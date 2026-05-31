import { Form, useLoaderData, useActionData } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import { Plus, Edit, Trash2, X, Check } from "lucide-react";
import { useState } from "react";
import "~/styles/admin.css";

export function meta() {
  return [{ title: "Manage Categories | Admin" }];
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
  const _action = String(formData.get("_action"));

  if (_action === "create") {
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const image_url = String(formData.get("image_url") || "").trim();
    if (!name) return { error: "Category name is required." };
    const { createCategory } = await import("~/db/models/categories.server");
    createCategory({ name, description, image_url });
  }

  if (_action === "update") {
    const id = parseInt(String(formData.get("id")));
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const image_url = String(formData.get("image_url") || "").trim();
    if (!name) return { error: "Category name is required." };
    const { updateCategory } = await import("~/db/models/categories.server");
    updateCategory(id, { name, description, image_url });
  }

  if (_action === "delete") {
    const id = parseInt(String(formData.get("id")));
    const { deleteCategory } = await import("~/db/models/categories.server");
    try {
      deleteCategory(id);
    } catch (e: any) {
      return { error: e.message };
    }
  }

  return { success: true };
}

export default function AdminCategoriesPage() {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showNew, setShowNew] = useState(false);

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Categories</h1>
          <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>
            {showNew ? <X size={18} /> : <Plus size={18} />}
            {showNew ? "Cancel" : "Add Category"}
          </button>
        </div>

        {actionData?.error && <div className="auth-error">{actionData.error}</div>}

        {showNew && (
          <Form method="post" className="admin-form admin-inline-form">
            <input type="hidden" name="_action" value="create" />
            <input name="name" type="text" placeholder="Category name" className="form-input" required />
            <input name="description" type="text" placeholder="Description" className="form-input" />
            <input name="image_url" type="text" placeholder="Image URL" className="form-input" />
            <button type="submit" className="btn btn-primary"><Check size={16} /> Create</button>
          </Form>
        )}

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat: any) => (
              <tr key={cat.id}>
                <td><strong>{cat.name}</strong></td>
                <td className="text-muted">{cat.slug}</td>
                <td>{cat.product_count}</td>
                <td>
                  <div className="admin-actions">
                    <Form method="post" style={{ display: "inline" }} onSubmit={(e) => { if (!confirm("Delete this category?")) e.preventDefault(); }}>
                      <input type="hidden" name="_action" value="delete" />
                      <input type="hidden" name="id" value={cat.id} />
                      <button type="submit" className="btn btn-icon btn-sm btn-danger"><Trash2 size={16} /></button>
                    </Form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
