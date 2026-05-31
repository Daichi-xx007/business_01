import { Form, useLoaderData, useActionData, Link, useSubmit } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import { SudoModal } from "~/components/SudoModal";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import path from "node:path";
import fs from "node:fs";
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
  const { requireAdmin, isSudoUnlocked } = await import("~/services/auth.server");
  await requireAdmin(request);

  if (!isSudoUnlocked(request)) {
    return Response.json({ error: "sudo_required" }, { status: 403 });
  }

  const productId = parseInt(params.id);
  const formData = await request.formData();
  const _action = String(formData.get("_action"));

  if (_action === "delete") {
    const { deleteProduct } = await import("~/db/models/products.server");
    await deleteProduct(productId);
    return new Response(null, { status: 302, headers: { Location: "/admin/products" } });
  }

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = parseFloat(String(formData.get("price") || "0"));
  const category_id = parseInt(String(formData.get("category_id") || "0")) || null;
  const featured = formData.get("featured") === "on" ? 1 : 0;
  let image_url = String(formData.get("image_url") || "").trim();

  const imageFile = formData.get("imageFile") as File | null;

  if (!name || price <= 0) {
    return { error: "Name and valid price are required." };
  }

  if (imageFile && imageFile.size > 0) {
    const { uploadImage } = await import("~/services/storage.server");
    const uploadedUrl = await uploadImage(imageFile);
    if (uploadedUrl) image_url = uploadedUrl;
  }

  const { updateProduct } = await import("~/db/models/products.server");
  await updateProduct(productId, { name, description, price, category_id, image_url, featured });

  return new Response(null, { status: 302, headers: { Location: "/admin/products" } });
}

export default function AdminEditProductPage() {
  const { product, categories } = useLoaderData<typeof loader>();
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
    // We cannot reliably intercept the submit button value via formData without e.nativeEvent.submitter
    // So we add _action to formData manually
    const formData = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter && submitter.name === "_action") {
      formData.set("_action", submitter.value);
    } else {
      formData.set("_action", "update");
    }
    
    setPendingFormData(formData);
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
        <h1 className="admin-page-title">Edit Product</h1>

        {actionData?.error && actionData.error !== "sudo_required" && <div className="auth-error">{actionData.error}</div>}

        <Form method="post" className="admin-form" encType="multipart/form-data" onSubmit={handleFormSubmit}>
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
            <label className="form-label" htmlFor="imageFile">Product Image Upload</label>
            <input id="imageFile" name="imageFile" type="file" accept="image/*" className="form-input" />
            <span className="form-hint">Upload a new image to replace the current one.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="image_url">Current Image URL</label>
            <input id="image_url" name="image_url" type="text" className="form-input" defaultValue={product.image_url} />
          </div>
          
          <div className="form-group form-checkbox">
            <input id="featured" name="featured" type="checkbox" defaultChecked={product.featured === 1} />
            <label htmlFor="featured">Featured product</label>
          </div>
          <div className="admin-form-actions">
            <button type="submit" name="_action" value="update" className="btn btn-primary">Save Changes</button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (confirm("Delete this product?")) {
                  const formData = new FormData();
                  formData.append("_action", "delete");
                  setPendingFormData(formData);
                  submit(formData, { method: "POST", encType: "multipart/form-data" });
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
