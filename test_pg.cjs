const pg = require("pg");

const pool = new pg.Pool({
  connectionString: "postgresql://postgres:iamasia140570@db.nrfccgyxvicyifyjydqf.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("SUCCESS! Supabase time:", res.rows[0].now);
    process.exit(0);
  } catch(e) {
    console.error("FAIL:", e);
    process.exit(1);
  }
}
main();
