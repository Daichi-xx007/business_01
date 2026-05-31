import { db } from "../database.server";
import crypto from "crypto";

/**
 * Generate a 6-digit OTP for a specific email and purpose.
 * Expires in 10 minutes.
 */
export async function generateOTP(email: string, purpose: "checkout" | "admin_sudo"): Promise<string> {
  // Delete any existing unused OTPs for this email+purpose to prevent spam
  await db.query("DELETE FROM otps WHERE email = $1 AND purpose = $2", [email, purpose]);

  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiration to 5 minutes from now
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  await db.query(
    `INSERT INTO otps (email, code, purpose, expires_at) VALUES ($1, $2, $3, $4)`,
    [email, code, purpose, expiresAt]
  );

  return code;
}

/**
 * Verify an OTP. If correct, it automatically deletes it so it can't be reused.
 * Returns true if valid, false if invalid or expired.
 */
export async function verifyOTP(email: string, code: string, purpose: "checkout" | "admin_sudo"): Promise<boolean> {
  // First, clean up all expired OTPs across the board
  await db.query("DELETE FROM otps WHERE expires_at < NOW()");

  const res = await db.query(
    `SELECT id FROM otps WHERE email = $1 AND code = $2 AND purpose = $3 AND expires_at > NOW()`,
    [email, code, purpose]
  );

  if (res.rows.length > 0) {
    // Valid! Delete it so it can't be used again
    await db.query("DELETE FROM otps WHERE id = $1", [res.rows[0].id]);
    return true;
  }

  return false;
}
