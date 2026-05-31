import { Form, useLoaderData, useActionData, Link } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import { ArrowLeft } from "lucide-react";
import "~/styles/admin.css";

export function meta() {
  return [{ title: "Add Product | Admin" }];
}

export async function loader({ request }: { request: Request }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);
  const { getAllCategories } = await import("~/db/models/categories.server");
  return { categories: await getAllCategories() };
}

export async function action({ request }: { request: Request }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);

  const formData = await request.formData();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = parseFloat(String(formData.get("price") || "0"));
  const category_id = parseInt(String(formData.get("category_id") || "0")) || undefined;
  const image_url = String(formData.get("image_url") || "").trim();
  const featured = formData.get("featured") === "on" ? 1 : 0;

  if (!name || price <= 0) {
    return { error: "Name and valid price are required." };
  }

  const { createProduct } = await import("~/db/models/products.server");
  createProduct({ name, description, price, category_id, image_url: image_url || undefined, featured });

  return new Response(null, { status: 302, headers: { Location: "/admin/products" } });
}

export default function AdminNewProductPage() {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <AdminLayout>
      <div className="admin-page">
        <Link to="/admin/products" className="back-link"><ArrowLeft size={18} /> Back to Products</Link>
        <h1 className="admin-page-title">Add New Product</h1>

        {actionData?.error && <div className="auth-error">{actionData.error}</div>}

        <Form method="post" className="admin-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Product Name *</label>
            <input id="name" name="name" type="text" className="form-input" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea id="description" name="description" className="form-textarea" rows={4} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="price">Price (Rs.) *</label>
              <input id="price" name="price" type="number" step="0.01" min="0" className="form-input" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="category_id">Category</label>
              <select id="category_id" name="category_id" className="form-select">
                <option value="">No Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="image_url">Image URL</label>
            <input id="image_url" name="image_url" type="text" className="form-input" placeholder="/images/product.jpg or https://..." />
          </div>
          <div className="form-group form-checkbox">
            <input id="featured" name="featured" type="checkbox" />
            <label htmlFor="featured">Featured product (show on homepage)</label>
          </div>
          <button type="submit" className="btn btn-primary">Add Product</button>
        </Form>
      </div>
    </AdminLayout>
  );
}
