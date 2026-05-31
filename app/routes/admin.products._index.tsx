import { Link, useLoaderData } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import { Plus, Edit, Trash2 } from "lucide-react";
import "~/styles/admin.css";

export function meta() {
  return [{ title: "Manage Products | Admin" }];
}

export async function loader({ request }: { request: Request }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";

  const { getAllProducts } = await import("~/db/models/products.server");
  const { products, total } = getAllProducts({ search, page, limit: 20 });
  const totalPages = Math.ceil(total / 20);

  return { products, total, page, totalPages, search };
}

export async function action({ request }: { request: Request }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);

  const formData = await request.formData();
  const actionType = String(formData.get("_action"));

  if (actionType === "delete") {
    const productId = parseInt(String(formData.get("productId")));
    const { deleteProduct } = await import("~/db/models/products.server");
    deleteProduct(productId);
  }

  return { success: true };
}

export default function AdminProductsPage() {
  const { products, total, page, totalPages, search } = useLoaderData<typeof loader>();

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Products ({total})</h1>
          <Link to="/admin/products/new" className="btn btn-primary">
            <Plus size={18} /> Add Product
          </Link>
        </div>

        <form method="get" className="admin-search-bar">
          <input
            type="text"
            name="search"
            placeholder="Search products..."
            defaultValue={search}
            className="form-input"
          />
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product: any) => (
              <tr key={product.id}>
                <td>
                  <img src={product.image_url || "/images/placeholder.jpg"} alt="" className="admin-table-image" />
                </td>
                <td><strong>{product.name}</strong></td>
                <td>Rs. {(product.price || 0).toLocaleString()}</td>
                <td>{product.category_name || "—"}</td>
                <td>
                  <span className={`badge badge-${product.status}`}>{product.status}</span>
                </td>
                <td>
                  <div className="admin-actions">
                    <Link to={`/admin/products/${product.id}/edit`} className="btn btn-icon btn-sm">
                      <Edit size={16} />
                    </Link>
                    <form method="post" style={{ display: "inline" }} onSubmit={(e) => { if (!confirm("Delete this product?")) e.preventDefault(); }}>
                      <input type="hidden" name="_action" value="delete" />
                      <input type="hidden" name="productId" value={product.id} />
                      <button type="submit" className="btn btn-icon btn-sm btn-danger">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} to={`/admin/products?page=${p}&search=${search}`} className={`pagination-btn ${p === page ? "pagination-btn-active" : ""}`}>
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
