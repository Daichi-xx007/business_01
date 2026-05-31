import { db } from "~/db/database.server";

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  category_id: number;
  image_url: string;
  status: "available" | "in_cart" | "sold";
  featured: number;
  created_at: string;
  /** Joined from categories */
  category_name?: string;
  category_slug?: string;
}

export function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function getAllProducts(opts: {
  search?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ products: Product[], total: number, page: number, totalPages: number }> {
  const page = Math.max(opts.page ?? 1, 1);
  const limit = Math.max(opts.limit ?? 20, 1);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  if (opts.search) {
    conditions.push(`(p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`);
    params.push(`%${opts.search}%`);
    paramCount++;
  }

  if (opts.category) {
    conditions.push(`c.slug = $${paramCount}`);
    params.push(opts.category);
    paramCount++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy = "p.created_at DESC";
  if (opts.sort === "price-asc") orderBy = "p.price ASC";
  if (opts.sort === "price-desc") orderBy = "p.price DESC";

  const countResult = await db.query(
    `SELECT COUNT(*) as count 
     FROM products p 
     LEFT JOIN categories c ON p.category_id = c.id
     ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await db.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    [...params, limit, offset]
  );

  return {
    products: result.rows,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const result = await db.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.slug = $1`,
    [slug]
  );
  return result.rows[0];
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const result = await db.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const result = await db.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.featured = 1 AND p.status = 'available'
     ORDER BY p.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getRecentProducts(limit = 8): Promise<Product[]> {
  const result = await db.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug 
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.status = 'available'
     ORDER BY p.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getProductsByCategory(categorySlug: string, opts: any = {}) {
  return getAllProducts({ ...opts, category: categorySlug });
}

export async function createProduct(data: {
  name: string;
  description?: string;
  price: number;
  category_id: number;
  image_url?: string;
  featured?: number;
}): Promise<Product> {
  const slug = generateSlug(data.name);
  const result = await db.query(
    `INSERT INTO products (name, slug, description, price, category_id, image_url, featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.name, slug, data.description || "", data.price, data.category_id, data.image_url || "/images/placeholder.jpg", data.featured || 0]
  );
  return result.rows[0];
}

export async function updateProduct(
  id: number,
  data: { name?: string; description?: string; price?: number; category_id?: number; image_url?: string; status?: string; featured?: number }
): Promise<Product | undefined> {
  const sets: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.name !== undefined) {
    sets.push(`name = $${paramCount++}`);
    values.push(data.name);
    sets.push(`slug = $${paramCount++}`);
    values.push(generateSlug(data.name));
  }
  if (data.description !== undefined) {
    sets.push(`description = $${paramCount++}`);
    values.push(data.description);
  }
  if (data.price !== undefined) {
    sets.push(`price = $${paramCount++}`);
    values.push(data.price);
  }
  if (data.category_id !== undefined) {
    sets.push(`category_id = $${paramCount++}`);
    values.push(data.category_id);
  }
  if (data.image_url !== undefined) {
    sets.push(`image_url = $${paramCount++}`);
    values.push(data.image_url);
  }
  if (data.status !== undefined) {
    sets.push(`status = $${paramCount++}`);
    values.push(data.status);
  }
  if (data.featured !== undefined) {
    sets.push(`featured = $${paramCount++}`);
    values.push(data.featured);
  }

  if (sets.length === 0) return getProductById(id);

  values.push(id);
  const result = await db.query(
    `UPDATE products SET ${sets.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteProduct(id: number): Promise<boolean> {
  const result = await db.query("DELETE FROM products WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function countProducts(status?: string): Promise<number> {
  const q = status ? "SELECT COUNT(*) as count FROM products WHERE status = $1" : "SELECT COUNT(*) as count FROM products";
  const result = await db.query(q, status ? [status] : []);
  return parseInt(result.rows[0].count, 10);
}
