import { db } from "~/db/database.server";
import { getProductById } from "./products.server";

export interface CartItem {
  id: number;
  product_id: number;
  session_id: string;
  user_id?: number;
  added_at: string;
  expires_at: string;
  
  // Joined fields
  product_name?: string;
  product_slug?: string;
  product_price?: number;
  product_image_url?: string;
}

export async function getCartItems(sessionId: string): Promise<CartItem[]> {
  await cleanupExpiredCarts();

  const result = await db.query(
    `SELECT c.*, p.name as product_name, p.slug as product_slug, p.price as product_price, p.image_url as product_image_url
     FROM cart_items c
     JOIN products p ON c.product_id = p.id
     WHERE c.session_id = $1`,
    [sessionId]
  );
  return result.rows;
}

export async function addToCart(productId: number, sessionId: string, userId?: number): Promise<boolean> {
  const product = await getProductById(productId);
  if (!product || product.status !== 'available') {
    return false;
  }

  try {
    await db.query("BEGIN");
    
    // Set product to in_cart
    await db.query("UPDATE products SET status = 'in_cart' WHERE id = $1 AND status = 'available'", [productId]);
    
    // Expiry = 30 minutes from now
    const expiresAt = new Date(Date.now() + 30 * 60000).toISOString();
    
    await db.query(
      `INSERT INTO cart_items (product_id, session_id, user_id, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [productId, sessionId, userId || null, expiresAt]
    );
    
    await db.query("COMMIT");
    return true;
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("addToCart error", error);
    return false;
  }
}

export async function removeFromCart(productId: number, sessionId: string): Promise<void> {
  try {
    await db.query("BEGIN");
    await db.query("DELETE FROM cart_items WHERE product_id = $1 AND session_id = $2", [productId, sessionId]);
    await db.query("UPDATE products SET status = 'available' WHERE id = $1", [productId]);
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("removeFromCart error", error);
  }
}

export async function clearCart(sessionId: string): Promise<void> {
  try {
    await db.query("BEGIN");
    const items = await db.query("SELECT product_id FROM cart_items WHERE session_id = $1", [sessionId]);
    for (const item of items.rows) {
      await db.query("UPDATE products SET status = 'available' WHERE id = $1", [item.product_id]);
    }
    await db.query("DELETE FROM cart_items WHERE session_id = $1", [sessionId]);
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("clearCart error", error);
  }
}

export async function getCartCount(sessionId: string): Promise<number> {
  await cleanupExpiredCarts();
  const result = await db.query("SELECT COUNT(*) as count FROM cart_items WHERE session_id = $1", [sessionId]);
  return parseInt(result.rows[0].count, 10);
}

export async function cleanupExpiredCarts(): Promise<void> {
  const now = new Date().toISOString();
  try {
    await db.query("BEGIN");
    const expired = await db.query("SELECT product_id FROM cart_items WHERE expires_at <= $1", [now]);
    if (expired.rows.length > 0) {
      for (const item of expired.rows) {
        await db.query("UPDATE products SET status = 'available' WHERE id = $1", [item.product_id]);
      }
      await db.query("DELETE FROM cart_items WHERE expires_at <= $1", [now]);
    }
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("cleanupExpiredCarts error", error);
  }
}
