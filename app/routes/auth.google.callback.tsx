import { redirect } from "react-router";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return redirect("/auth/login?error=" + encodeURIComponent("Google Login failed or was cancelled."));
  }

  if (!code) {
    return redirect("/auth/login");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not fully configured in the environment.");
  }

  const redirectUri = `${url.protocol}//${url.host}/auth/google/callback`;

  // 1. Exchange code for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error("Google Token Error:", tokenData);
    return redirect("/auth/login?error=" + encodeURIComponent("Failed to exchange token with Google."));
  }

  // 2. Fetch user profile
  const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const userData = await userResponse.json();

  if (!userResponse.ok || !userData.email) {
    console.error("Google UserInfo Error:", userData);
    return redirect("/auth/login?error=" + encodeURIComponent("Failed to retrieve user profile from Google."));
  }

  // 3. Find or create user
  const { findUserByEmail, createUser } = await import("~/db/models/users.server");
  let user = await findUserByEmail(userData.email);

  if (!user) {
    user = await createUser({
      email: userData.email,
      name: userData.name || userData.email.split("@")[0],
    });
  }

  // 4. Create session and login
  const { createSession } = await import("~/services/auth.server");
  const { cookie } = createSession(user.id, user.role);

  return redirect("/", {
    headers: { "Set-Cookie": cookie },
  });
}
