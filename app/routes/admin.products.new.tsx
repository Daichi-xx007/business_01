import { Form, useLoaderData, useActionData, Link, useSubmit } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import { SudoModal } from "~/components/SudoModal";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import path from "node:path";
import fs from "node:fs";
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
  const { requireAdmin, isSudoUnlocked } = await import("~/services/auth.server");
  await requireAdmin(request);

  if (!isSudoUnlocked(request)) {
    return Response.json({ error: "sudo_required" }, { status: 403 });
  }

  const formData = await request.formData();
  
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = parseFloat(String(formData.get("price") || "0"));
  const category_id = parseInt(String(formData.get("category_id") || "0")) || undefined;
  const featured = formData.get("featured") === "on" ? 1 : 0;
  let image_url = String(formData.get("image_url") || "").trim(); // fallback if manual text

  const imageFile = formData.get("imageFile") as File | null;

  if (!name || price <= 0) {
    return { error: "Name and valid price are required." };
  }

  if (imageFile && imageFile.size > 0) {
    const { uploadImage } = await import("~/services/storage.server");
    const uploadedUrl = await uploadImage(imageFile);
    if (uploadedUrl) image_url = uploadedUrl;
  }

  const { createProduct } = await import("~/db/models/products.server");
  await createProduct({ name, description, price, category_id, image_url: image_url || undefined, featured });

  return new Response(null, { status: 302, headers: { Location: "/admin/products" } });
}

export default function AdminNewProductPage() {
  const { categories } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const [showSudoModal, setShowSudoModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  useEffect(() => {
    if (actionData?.error === "sudo_required") {
      setShowSudoModal(true);
    }
  }, [actionData]);

  const handleSudoSuccess = () => {
    setShowSudoModal(false);
    if (pendingFormData) {
      submit(pendingFormData, { method: "POST", encType: "multipart/form-data" });
      setPendingFormData(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setPendingFormData(formData);
    // If not in sudo mode, it will submit and hit the 403, throwing the modal open
    // Otherwise, we could manually check, but the Action handles it.
    submit(formData, { method: "POST", encType: "multipart/form-data" });
  };

  return (
    <AdminLayout>
      <SudoModal 
        isOpen={showSudoModal} 
        onCancel={() => setShowSudoModal(false)} 
        onSuccess={handleSudoSuccess} 
      />
      <div className="admin-page">
        <Link to="/admin/products" className="back-link"><ArrowLeft size={18} /> Back to Products</Link>
        <h1 className="admin-page-title">Add New Product</h1>

        {actionData?.error && actionData.error !== "sudo_required" && (
          <div className="auth-error">{actionData.error}</div>
        )}

        <Form method="post" className="admin-form" encType="multipart/form-data" onSubmit={handleFormSubmit}>
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
            <label className="form-label" htmlFor="imageFile">Product Image Upload</label>
            <input id="imageFile" name="imageFile" type="file" accept="image/*" className="form-input" />
            <span className="form-hint">Upload an image directly, or provide a URL below.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="image_url">Or Image URL</label>
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
