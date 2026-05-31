import { useLoaderData, Link, Form, useActionData } from "react-router";
import { AdminLayout } from "~/components/AdminLayout";
import { ArrowLeft, CheckCircle, Package, User, MapPin, CreditCard } from "lucide-react";
import "~/styles/admin.css";

export function meta({ data }: any) {
  return [{ title: `Order ${data?.order?.order_number || ""} | Admin` }];
}

export async function loader({ request, params }: { request: Request; params: any }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);

  const { getOrderByNumber } = await import("~/db/models/orders.server");
  const order = await getOrderByNumber(params.orderNumber);

  if (!order) {
    throw new Response("Order Not Found", { status: 404 });
  }

  return { order };
}

export async function action({ request, params }: { request: Request; params: any }) {
  const { requireAdmin } = await import("~/services/auth.server");
  await requireAdmin(request);

  const formData = await request.formData();
  const status = formData.get("status") as "pending" | "paid" | "failed";
  const txnRefNo = formData.get("txnRefNo") as string || undefined;

  const { updatePaymentStatus } = await import("~/db/models/orders.server");
  const updatedOrder = await updatePaymentStatus(params.orderNumber, status, txnRefNo);

  return { success: true, order: updatedOrder };
}

export default function AdminOrderDetailPage() {
  const { order } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const currentOrder = actionData?.order || order;

  return (
    <AdminLayout>
      <div className="admin-page">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <Link to="/admin/orders" className="btn btn-icon btn-outline">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="admin-page-title" style={{ margin: 0 }}>
            Order {currentOrder.order_number}
          </h1>
          <span className={`badge badge-${currentOrder.payment_status}`} style={{ marginLeft: "auto", fontSize: "1rem", padding: "0.5rem 1rem" }}>
            {currentOrder.payment_status.toUpperCase()}
          </span>
        </div>

        {actionData?.success && (
          <div className="admin-success">
            <CheckCircle size={18} />
            Order payment status updated successfully!
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "2rem" }}>
          
          {/* Left Column: Items */}
          <div>
            <h3 className="admin-section-title"><Package size={18} style={{ verticalAlign: "middle", marginRight: "8px" }}/> Order Items</h3>
            <div style={{ background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", padding: "1.5rem" }}>
              <table className="admin-table" style={{ marginTop: 0 }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: "right" }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "50px", height: "50px", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--bg-secondary)" }}>
                          <img src={item.product_image_url || "/images/placeholder.jpg"} alt={item.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>#{item.product_id}</div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        Rs. {(item.price_at_purchase || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ textAlign: "right", fontWeight: 600, paddingTop: "1.5rem" }}>Total Amount:</td>
                    <td style={{ textAlign: "right", fontWeight: 800, fontSize: "1.25rem", color: "var(--accent)", paddingTop: "1.5rem" }}>
                      Rs. {(currentOrder.total_amount || 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Right Column: Customer & Payment Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Customer Details */}
            <div style={{ background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", padding: "1.5rem" }}>
              <h3 className="admin-section-title" style={{ marginTop: 0, borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                <User size={18} style={{ verticalAlign: "middle", marginRight: "8px" }}/> Customer Details
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "2px" }}>Name</div>
                  <div style={{ fontWeight: 500 }}>{currentOrder.guest_name || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "2px" }}>Email</div>
                  <div><a href={`mailto:${currentOrder.guest_email}`}>{currentOrder.guest_email || "—"}</a></div>
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "2px" }}>Phone</div>
                  <div><a href={`tel:${currentOrder.guest_phone}`}>{currentOrder.guest_phone || "—"}</a></div>
                </div>
              </div>
            </div>

            {/* Shipping Details */}
            <div style={{ background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", padding: "1.5rem" }}>
              <h3 className="admin-section-title" style={{ marginTop: 0, borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                <MapPin size={18} style={{ verticalAlign: "middle", marginRight: "8px" }}/> Shipping Address
              </h3>
              <div style={{ marginTop: "1rem", lineHeight: 1.6 }}>
                {currentOrder.shipping_address ? (
                  <>
                    {currentOrder.shipping_address}<br/>
                    {currentOrder.shipping_city && <strong>{currentOrder.shipping_city}</strong>}
                  </>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>No shipping address provided.</span>
                )}
              </div>
            </div>

            {/* Payment Status Updater */}
            <div style={{ background: "var(--bg-accent)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", padding: "1.5rem" }}>
              <h3 className="admin-section-title" style={{ marginTop: 0, borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                <CreditCard size={18} style={{ verticalAlign: "middle", marginRight: "8px" }}/> Update Payment Status
              </h3>
              
              <Form method="post" style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="status">Status</label>
                  <select id="status" name="status" className="form-select" defaultValue={currentOrder.payment_status}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid (Approved)</option>
                    <option value="failed">Failed / Cancelled</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="txnRefNo">Transaction Ref No (Optional)</label>
                  <input type="text" id="txnRefNo" name="txnRefNo" className="form-input" defaultValue={currentOrder.txn_ref_no || ""} placeholder="T123456789" />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                  Save Status
                </button>

                <p className="form-hint" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                  <strong>Note:</strong> Marking an order as "Paid" will automatically mark all items in it as "SOLD" so they cannot be purchased by anyone else.
                </p>
              </Form>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
