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
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  price REAL NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  image_url TEXT DEFAULT '/images/placeholder.jpg',
  status TEXT DEFAULT 'available' CHECK(status IN ('available', 'in_cart', 'sold')),
  featured INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  product_id INTEGER UNIQUE NOT NULL REFERENCES products(id),
  session_id TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  guest_email TEXT DEFAULT '',
  guest_name TEXT DEFAULT '',
  guest_phone TEXT DEFAULT '',
  shipping_address TEXT DEFAULT '',
  shipping_city TEXT DEFAULT '',
  total_amount REAL NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed')),
  payment_method TEXT DEFAULT 'jazzcash',
  txn_ref_no TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  price_at_purchase REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

export async function initializeDatabase() {
  if (!connectionString) return;

  try {
    // 1. Run schema to ensure tables exist
    await pool.query(SCHEMA_SQL);

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
