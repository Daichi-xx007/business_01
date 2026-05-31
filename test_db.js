import { initializeDatabase, db } from "./app/db/database.server.js";

async function test() {
  console.log("Testing connection...");
  try {
    await initializeDatabase();
    console.log("Init finished. Checking if tables exist...");
    const res = await db.query("SELECT count(*) FROM users");
    console.log("Users count:", res.rows[0].count);
    console.log("Connection successful!");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}
test();
