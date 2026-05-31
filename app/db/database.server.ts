import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Resolve paths
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const SCHEMA_PATH = path.join(path.dirname(__filename), "schema.sql");

// ---------------------------------------------------------------------------
// Connect to PostgreSQL via Supabase
// ---------------------------------------------------------------------------
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is missing. Please configure it in .env");
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for Supabase
});

export const db = pool;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
export async function initializeDatabase() {
  if (!connectionString) return;

  try {
    // 1. Run schema to ensure tables exist
    const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
    await pool.query(schema);

    // 2. Seed default admin users (only if not already present)
    const admins = [
      { email: "asia.ahtasham@yahoo.com", pass: "iamasia14570", name: "Asia" },
      { email: "abdullah.ahtasham.a@gmail.com", pass: "iamabdullah007", name: "Abdullah" }
    ];

    for (const admin of admins) {
      const existingAdmin = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [admin.email]
      );

      if (existingAdmin.rows.length === 0) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(admin.pass, salt);

        await pool.query(
          `INSERT INTO users (email, password_hash, name, role)
           VALUES ($1, $2, $3, $4)`,
          [admin.email, hash, admin.name, "admin"]
        );
        console.log(`Seeded admin user: ${admin.email}`);
      }
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Automatically run on startup
initializeDatabase().catch(console.error);
