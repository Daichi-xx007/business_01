import { db } from "~/db/database.server";

/**
 * Vercel Cron Job endpoint.
 * Calling this regularly prevents the free tier Supabase database from pausing due to inactivity.
 */
export async function loader() {
  try {
    // Simply run a tiny, cheap query to register database activity
    await db.query("SELECT 1 as active");
    
    return Response.json({ status: "ok", message: "Database is active and kept alive." });
  } catch (error) {
    console.error("Keep-alive error:", error);
    return Response.json({ status: "error" }, { status: 500 });
  }
}
