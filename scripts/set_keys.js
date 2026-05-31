import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const url = "https://nrfccgyxvicyifyjydqf.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmNjZ3l4dmljeWlmeWp5ZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTA0NTksImV4cCI6MjA5NTc4NjQ1OX0.qVWEjl7Zu0mZ1QzZYsQhdpn6mHiEhu-nKuUh9d83CUQ";

  await pool.query(
    `INSERT INTO site_settings (key, value) VALUES ('SUPABASE_URL', $1) 
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, 
    [url]
  );
  
  await pool.query(
    `INSERT INTO site_settings (key, value) VALUES ('SUPABASE_ANON_KEY', $1) 
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, 
    [key]
  );

  console.log("Keys saved to database!");
  process.exit(0);
}

run().catch(console.error);
