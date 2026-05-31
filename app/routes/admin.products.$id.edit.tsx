import { Form, useLoaderData, useActionData, Link } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import { ArrowLeft } from "lucide-react";
import "~/styles/admin.css";

export function meta() {
  return [{ title: "Edit Product | Admin" }];
}

export async function loader({ params, request }: { params: { id: string }; request: Request }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);
  const { getProductById } = await import("~/db/models/products.server");
  const { getAllCategories } = await import("~/db/models/categories.server");

  const product = await getProductById(parseInt(params.id as string));
  if (!product) throw new Response("Product not found", { status: 404 });

  return { product, categories: await getAllCategories() };
}

export async function action({ params, request }: { params: { id: string }; request: Request }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);

  const productId = parseInt(params.id);
  const formData = await request.formData();
  const _action = String(formData.get("_action"));

  if (_action === "delete") {
    const { deleteProduct } = await import("~/db/models/products.server");
    deleteProduct(productId);
    return new Response(null, { status: 302, headers: { Location: "/admin/products" } });
  }

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = parseFloat(String(formData.get("price") || "0"));
  const category_id = parseInt(String(formData.get("category_id") || "0")) || null;
  const image_url = String(formData.get("image_url") || "").trim();
  const featured = formData.get("featured") === "on" ? 1 : 0;

  if (!name || price <= 0) {
    return { error: "Name and valid price are required." };
  }

  const { updateProduct } = await import("~/db/models/products.server");
  updateProduct(productId, { name, description, price, category_id, image_url, featured });

  return new Response(null, { status: 302, headers: { Location: "/admin/products" } });
}

export default function AdminEditProductPage() {
  const { product, categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <AdminLayout>
      <div className="admin-page">
        <Link to="/admin/products" className="back-link"><ArrowLeft size={18} /> Back to Products</Link>
        <h1 className="admin-page-title">Edit Product</h1>

        {actionData?.error && <div className="auth-error">{actionData.error}</div>}

        <Form method="post" className="admin-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Product Name *</label>
            <input id="name" name="name" type="text" className="form-input" required defaultValue={product.name} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea id="description" name="description" className="form-textarea" rows={4} defaultValue={product.description} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="price">Price (Rs.) *</label>
              <input id="price" name="price" type="number" step="0.01" min="0" className="form-input" required defaultValue={product.price} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="category_id">Category</label>
              <select id="category_id" name="category_id" className="form-select" defaultValue={product.category_id || ""}>
                <option value="">No Category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="image_url">Image URL</label>
            <input id="image_url" name="image_url" type="text" className="form-input" defaultValue={product.image_url} />
          </div>
          <div className="form-group form-checkbox">
            <input id="featured" name="featured" type="checkbox" defaultChecked={product.featured === 1} />
            <label htmlFor="featured">Featured product</label>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary">Save Changes</button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm("Delete this product?")) {
                  const form = document.createElement("form");
                  form.method = "post";
                  const input = document.createElement("input");
                  input.type = "hidden";
                  input.name = "_action";
                  input.value = "delete";
                  form.appendChild(input);
                  document.body.appendChild(form);
                  form.submit();
                }
              }}
            >
              Delete Product
            </button>
          </div>
        </Form>
      </div>
    </AdminLayout>
  );
}
