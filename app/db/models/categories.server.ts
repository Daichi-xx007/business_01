import { db } from "~/db/database.server";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  product_count?: number;
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function getAllCategories(): Promise<Category[]> {
  const result = await db.query(`
    SELECT c.*, COUNT(p.id) as product_count 
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.status = 'available'
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `);
  // pg returns count as string, convert it to number
  return result.rows.map((row: any) => ({
    ...row,
    product_count: parseInt(row.product_count, 10)
  }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const result = await db.query("SELECT * FROM categories WHERE slug = $1", [slug]);
  return result.rows[0];
}

export async function getCategoryById(id: number): Promise<Category | undefined> {
  const result = await db.query("SELECT * FROM categories WHERE id = $1", [id]);
  return result.rows[0];
}

export async function createCategory(data: { name: string; description?: string; image_url?: string }): Promise<Category> {
  const slug = generateSlug(data.name);
  const result = await db.query(
    `INSERT INTO categories (name, slug, description, image_url)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.name, slug, data.description || "", data.image_url || ""]
  );
  return result.rows[0];
}

export async function updateCategory(
  id: number,
  data: { name?: string; description?: string; image_url?: string; sort_order?: number }
): Promise<Category | undefined> {
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
  if (data.image_url !== undefined) {
    sets.push(`image_url = $${paramCount++}`);
    values.push(data.image_url);
  }
  if (data.sort_order !== undefined) {
    sets.push(`sort_order = $${paramCount++}`);
    values.push(data.sort_order);
  }

  if (sets.length === 0) return getCategoryById(id);

  values.push(id);
  const result = await db.query(
    `UPDATE categories SET ${sets.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteCategory(id: number): Promise<boolean> {
  // Check if products exist for this category
  const products = await db.query("SELECT id FROM products WHERE category_id = $1 LIMIT 1", [id]);
  if (products.rows.length > 0) {
    throw new Error("Cannot delete category because it contains products.");
  }

  const result = await db.query("DELETE FROM categories WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
