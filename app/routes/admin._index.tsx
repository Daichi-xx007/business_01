import { useLoaderData } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import { Package, ShoppingBag, DollarSign, Clock } from "lucide-react";
import "~/styles/admin.css";

export function meta() {
  return [{ title: "Admin Dashboard | Store" }];
}

export async function loader({ request }: { request: Request }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);

  const { getOrderStats, getAllOrders } = await import("~/db/models/orders.server");
  const { countProducts } = await import("~/db/models/products.server");

  const stats = await getOrderStats();
  const productCount = await countProducts();
  const { orders: recentOrders } = await getAllOrders({ limit: 5 });

  return { stats, productCount, recentOrders };
}

export default function AdminDashboard() {
  const { stats, productCount, recentOrders } = useLoaderData<typeof loader>();

  return (
    <AdminLayout>
      <div className="admin-page">
        <h1 className="admin-page-title">Dashboard</h1>

        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: "var(--accent)" }}>
              <Package size={24} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">{productCount}</span>
              <span className="stat-card-label">Total Products</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: "var(--accent-secondary)" }}>
              <ShoppingBag size={24} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">{stats.total_orders}</span>
              <span className="stat-card-label">Total Orders</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: "var(--success)" }}>
              <DollarSign size={24} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">Rs. {(stats.total_revenue || 0).toLocaleString()}</span>
              <span className="stat-card-label">Total Revenue</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: "var(--accent-tertiary)" }}>
              <Clock size={24} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">{stats.pending_payments}</span>
              <span className="stat-card-label">Pending Payments</span>
            </div>
          </div>
        </div>

        <div className="admin-section">
          <h2 className="admin-section-title">Recent Orders</h2>
          {recentOrders.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td><strong>{order.order_number}</strong></td>
                    <td>{order.guest_name || "N/A"}</td>
                    <td>Rs. {order.total_amount.toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${order.payment_status}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-empty">No orders yet</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
