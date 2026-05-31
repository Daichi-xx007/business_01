import { db } from "~/db/database.server";
import bcrypt from "bcryptjs";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  role: string;
  created_at: string;
}

export type SafeUser = Omit<User, "password_hash">;

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
}

export async function findUserById(id: number): Promise<SafeUser | undefined> {
  const result = await db.query(
    "SELECT id, email, name, phone, address, city, role, created_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

export async function createUser(data: {
  email: string;
  password?: string;
  name: string;
  phone?: string;
}): Promise<SafeUser> {
  let hash = "";
  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    hash = await bcrypt.hash(data.password, salt);
  } else {
    // Generate a random unguessable hash for OAuth users
    const salt = await bcrypt.genSalt(10);
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    hash = await bcrypt.hash(randomString, salt);
  }

  const result = await db.query(
    `INSERT INTO users (email, password_hash, name, phone)
     VALUES ($1, $2, $3, $4) RETURNING id, email, name, phone, address, city, role, created_at`,
    [data.email, hash, data.name, data.phone ?? ""]
  );
  
  return result.rows[0];
}

export async function updateUserProfile(
  id: number,
  data: { name?: string; phone?: string; address?: string; city?: string }
): Promise<SafeUser | undefined> {
  const sets: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (data.phone !== undefined) {
    sets.push(`phone = $${paramCount++}`);
    values.push(data.phone);
  }
  if (data.address !== undefined) {
    sets.push(`address = $${paramCount++}`);
    values.push(data.address);
  }
  if (data.city !== undefined) {
    sets.push(`city = $${paramCount++}`);
    values.push(data.city);
  }

  if (sets.length === 0) return findUserById(id);

  values.push(id);
  const result = await db.query(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${paramCount} RETURNING id, email, name, phone, address, city, role, created_at`,
    values
  );

  return result.rows[0];
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function getAllUsers(): Promise<SafeUser[]> {
  const result = await db.query(
    "SELECT id, email, name, phone, address, city, role, created_at FROM users ORDER BY created_at DESC"
  );
  return result.rows;
}
