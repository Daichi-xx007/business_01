import crypto from "node:crypto";
import { redirect } from "react-router";
import { findUserById, type SafeUser } from "~/db/models/users.server";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SESSION_SECRET =
  process.env.SESSION_SECRET || "default-dev-secret-change-me";
const COOKIE_NAME = "__session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// ---------------------------------------------------------------------------
// Session payload type
// ---------------------------------------------------------------------------
interface SessionPayload {
  userId?: number;
  role?: string;
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Cookie signing / verification helpers
// ---------------------------------------------------------------------------

function sign(value: string): string {
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(value)
    .digest("base64url");
  return `${value}.${signature}`;
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const expected = sign(value);
  // Timing-safe comparison
  if (expected.length !== signed.length) return null;
  const a = Buffer.from(expected);
  const b = Buffer.from(signed);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return value;
}

function generateId(): string {
  return crypto.randomBytes(16).toString("hex");
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const [key, ...rest] = pair.split("=");
    const k = key?.trim();
    if (k) cookies[k] = decodeURIComponent(rest.join("=").trim());
  }
  return cookies;
}

function serializeCookie(
  name: string,
  value: string,
  opts: {
    maxAge?: number;
    path?: string;
    httpOnly?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    secure?: boolean;
  } = {}
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push(`Path=${opts.path ?? "/"}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  parts.push(`SameSite=${opts.sameSite ?? "Lax"}`);
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read the session cookie from a request and return parsed payload.
 */
export function getSession(request: Request): SessionPayload | null {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies = parseCookies(cookieHeader);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;

  const value = unsign(raw);
  if (!value) return null;

  try {
    return JSON.parse(value) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Create a signed session cookie value.
 * Returns a Set-Cookie header string.
 */
export function createSession(
  userId: number,
  role: string,
  existingSessionId?: string
): { cookie: string } {
  const payload: SessionPayload = {
    userId,
    role,
    sessionId: existingSessionId || generateId(),
  };
  const signed = sign(JSON.stringify(payload));
  const cookie = serializeCookie(COOKIE_NAME, signed, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
  });
  return { cookie };
}

/**
 * Destroy the session by returning a Set-Cookie header that expires immediately.
 */
export function destroySession(): string {
  return serializeCookie(COOKIE_NAME, "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
  });
}

/**
 * Require an authenticated user. Redirects to /auth/login if not logged in.
 */
export async function requireUser(request: Request): Promise<SafeUser> {
  const session = getSession(request);
  if (!session?.userId) {
    throw redirect("/auth/login");
  }

  const user = await findUserById(session.userId);
  if (!user) {
    throw redirect("/auth/login");
  }

  return user;
}

/**
 * Require admin role. Redirects to / if not admin.
 */
export async function requireAdmin(request: Request): Promise<SafeUser> {
  const session = getSession(request);
  if (!session?.userId || session.role !== "admin") {
    throw redirect("/");
  }

  const user = await findUserById(session.userId);
  if (!user || user.role !== "admin") {
    throw redirect("/");
  }

  return user;
}

/**
 * Get the current user if logged in, otherwise return null.
 * Useful for pages that work for both guests and logged-in users.
 */
export async function getOptionalUser(request: Request): Promise<SafeUser | null> {
  const session = getSession(request);
  if (!session?.userId) return null;
  return (await findUserById(session.userId)) ?? null;
}

/**
 * Get or create a session ID for cart tracking.
 * Returns { sessionId, setCookieHeader? }.
 * If no session cookie exists, a new guest session is created and
 * the caller should set the returned cookie header on the response.
 */
export async function getSessionId(request: Request): Promise<string> {
  const session = getSession(request);
  if (session?.sessionId) {
    return session.sessionId;
  }
  // No session – generate a temporary guest ID
  return generateId();
}
