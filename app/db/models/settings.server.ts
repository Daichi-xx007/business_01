import { db } from "../database.server";

export async function getSetting(key: string, defaultValue: string = ""): Promise<string> {
  try {
    const res = await db.query("SELECT value FROM site_settings WHERE key = $1", [key]);
    return res.rows.length > 0 ? res.rows[0].value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  try {
    await db.query(`
      INSERT INTO site_settings (key, value, updated_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `, [key, value]);
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const res = await db.query("SELECT key, value FROM site_settings");
    const settings: Record<string, string> = {};
    for (const row of res.rows) {
      settings[row.key] = row.value;
    }
    return settings;
  } catch (error) {
    console.error("Error getting all settings:", error);
    return {};
  }
}
