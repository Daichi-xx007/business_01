import { useLoaderData, Link } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import "~/styles/admin.css";

export function meta() {
  return [{ title: "Orders | Admin" }];
}

export async function loader({ request }: { request: Request }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const page = parseInt(url.searchParams.get("page") || "1");

  const { getAllOrders } = await import("~/db/models/orders.server");
  const { orders, total } = await getAllOrders({ status: status || undefined, page, limit: 20 });
  const totalPages = Math.ceil(total / 20);

  return { orders, total, page, totalPages, status };
}

export default function AdminOrdersPage() {
  const { orders, total, page, totalPages, status } = useLoaderData<typeof loader>();

  return (
    <AdminLayout>
      <div className="admin-page">
        <h1 className="admin-page-title">Orders ({total})</h1>

        <div className="admin-filters">
          <Link to="/admin/orders" className={`btn btn-sm ${!status ? "btn-primary" : "btn-outline"}`}>All</Link>
          <Link to="/admin/orders?status=paid" className={`btn btn-sm ${status === "paid" ? "btn-primary" : "btn-outline"}`}>Paid</Link>
          <Link to="/admin/orders?status=pending" className={`btn btn-sm ${status === "pending" ? "btn-primary" : "btn-outline"}`}>Pending</Link>
          <Link to="/admin/orders?status=failed" className={`btn btn-sm ${status === "failed" ? "btn-primary" : "btn-outline"}`}>Failed</Link>
        </div>

        {orders.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id}>
                  <td><strong>{order.order_number}</strong></td>
                  <td>{order.guest_name || "—"}</td>
                  <td>{order.guest_email || "—"}</td>
                  <td>{order.guest_phone || "—"}</td>
                  <td>Rs. {(order.total_amount || 0).toLocaleString()}</td>
                  <td><span className={`badge badge-${order.payment_status}`}>{order.payment_status}</span></td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/admin/orders/${order.order_number}`} className="btn btn-sm btn-outline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="admin-empty">No orders found</p>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} to={`/admin/orders?page=${p}${status ? `&status=${status}` : ""}`} className={`pagination-btn ${p === page ? "pagination-btn-active" : ""}`}>
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
