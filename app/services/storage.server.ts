import { createClient } from "@supabase/supabase-js";
import { getSetting } from "~/db/models/settings.server";

export async function uploadImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const supabaseUrl = await getSetting("SUPABASE_URL");
  const supabaseKey = await getSetting("SUPABASE_ANON_KEY");

  // Fallback to local / public/images if no supabase is configured
  // Note: This works locally but will fail on Vercel
  if (!supabaseUrl || !supabaseKey) {
    console.warn("No Supabase configuration found. Images will be saved locally (this will crash on Vercel). Please configure Supabase in settings.");
    const fs = await import("node:fs");
    const path = await import("node:path");
    
    const PUBLIC_DIR = path.join(process.cwd(), "public", "images");
    if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    
    const imgBuffer = await file.arrayBuffer();
    const safeName = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const destPath = path.join(PUBLIC_DIR, safeName);
    fs.writeFileSync(destPath, Buffer.from(imgBuffer));
    return "/images/" + safeName;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const fileExt = file.name.split('.').pop();
  const safeName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  // Upload to the 'products' bucket
  const { data, error } = await supabase.storage
    .from("products")
    .upload(safeName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error("Supabase storage error:", error);
    throw new Error("Failed to upload image to Supabase");
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("products")
    .getPublicUrl(safeName);

  return publicUrl;
}
