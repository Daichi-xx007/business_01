import { Form, useLoaderData, useActionData, Link } from "react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { MapPin, Phone, Mail, User, CheckCircle } from "lucide-react";
import { useState } from "react";
import "~/styles/checkout.css";

export function meta() {
  return [{ title: "Checkout | Store" }];
}

export async function loader({ request }: { request: Request }) {
  const { getOptionalUser, getSessionId } = await import("~/services/auth.server");
  const { getCartItems, getCartCount } = await import("~/db/models/cart.server");

  const user = await getOptionalUser(request);
  const sessionId = await getSessionId(request);
  const items = await getCartItems(sessionId);
  const cartCount = await getCartCount(sessionId);

  if (items.length === 0) {
    return new Response(null, { status: 302, headers: { Location: "/cart" } });
  }

  const total = items.reduce((sum: number, item: any) => sum + item.price, 0);
  return { items, total, user, cartCount };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const { getOptionalUser, getSessionId } = await import("~/services/auth.server");
  const { getCartItems } = await import("~/db/models/cart.server");
  const { createOrder } = await import("~/db/models/orders.server");
  const { generatePaymentForm } = await import("~/services/jazzcash.server");

  const user = await getOptionalUser(request);
  const sessionId = await getSessionId(request);
  const items = await getCartItems(sessionId);

  if (items.length === 0) {
    return { error: "Your cart is empty." };
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();

  if (!name || !email || !phone || !address || !city) {
    return { error: "All fields are required." };
  }

  const totalAmount = items.reduce((sum: number, item: any) => sum + item.price, 0);

  const order = await createOrder({
    userId: user?.id,
    guestEmail: email,
    guestName: name,
    guestPhone: phone,
    shippingAddress: address,
    shippingCity: city,
    items: items.map((item: any) => ({ product_id: item.product_id, price: item.price })),
    totalAmount,
  });

  const paymentForm = generatePaymentForm(order);
  return { paymentForm, orderNumber: order.order_number };
}

export default function CheckoutPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [useProfile, setUseProfile] = useState(false);

  // If redirect response, loaderData may not have expected shape
  if (!loaderData || !('items' in loaderData)) return null;
  const { items, total, user, cartCount } = loaderData;

  // If payment form was generated, redirect to JazzCash
  if (actionData?.paymentForm) {
    return (
      <div className="payment-redirect">
        <div className="payment-redirect-card">
          <div className="payment-redirect-spinner" />
          <h2>Redirecting to JazzCash...</h2>
          <p>Please wait while we redirect you to complete your payment.</p>
          <form
            id="jazzcash-form"
            method="POST"
            action={actionData.paymentForm.action}
            ref={(form) => form?.submit()}
          >
            {Object.entries(actionData.paymentForm.fields).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={String(value)} />
            ))}
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header cartCount={cartCount} user={user} />
      <main className="checkout-page">
        <div className="container">
          <h1 className="page-title">Checkout</h1>

          <div className="checkout-layout">
            <div className="checkout-form-section">
              {user && (user.address || user.phone) && !useProfile && (
                <div className="autofill-prompt">
                  <CheckCircle size={18} />
                  <span>We have your saved information on file.</span>
                  <button className="btn btn-sm btn-secondary" onClick={() => setUseProfile(true)}>
                    Use Saved Info
                  </button>
                </div>
              )}

              {actionData?.error && (
                <div className="auth-error" style={{ marginBottom: "1rem" }}>{actionData.error}</div>
              )}

              <Form method="post" className="checkout-form">
                <h3 className="checkout-section-title">Contact Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">Full Name</label>
                    <div className="form-input-wrapper">
                      <User size={18} className="form-input-icon" />
                      <input id="name" name="name" type="text" className="form-input form-input-with-icon" required defaultValue={useProfile ? user?.name : ""} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email</label>
                    <div className="form-input-wrapper">
                      <Mail size={18} className="form-input-icon" />
                      <input id="email" name="email" type="email" className="form-input form-input-with-icon" required defaultValue={useProfile ? user?.email : ""} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <div className="form-input-wrapper">
                    <Phone size={18} className="form-input-icon" />
                    <input id="phone" name="phone" type="tel" className="form-input form-input-with-icon" required placeholder="+92 300 1234567" defaultValue={useProfile ? user?.phone : ""} />
                  </div>
                </div>

                <h3 className="checkout-section-title" style={{ marginTop: "2rem" }}>Shipping Address</h3>
                <div className="form-group">
                  <label className="form-label" htmlFor="address">Address</label>
                  <div className="form-input-wrapper">
                    <MapPin size={18} className="form-input-icon" />
                    <input id="address" name="address" type="text" className="form-input form-input-with-icon" required placeholder="Street address" defaultValue={useProfile ? user?.address : ""} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="city">City</label>
                  <input id="city" name="city" type="text" className="form-input" required placeholder="City" defaultValue={useProfile ? user?.city : ""} />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "1.5rem" }}>
                  Pay with JazzCash — Rs. {total.toLocaleString()}
                </button>
              </Form>
            </div>

            <div className="checkout-summary">
              <h3 className="cart-summary-title">Order Summary</h3>
              <div className="checkout-items">
                {items.map((item: any) => (
                  <div key={item.id} className="checkout-item">
                    <img src={item.image_url || "/images/placeholder.jpg"} alt={item.name} className="checkout-item-image" />
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{item.name}</span>
                      <span className="checkout-item-price">Rs. {(item.price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-summary-divider" />
              <div className="cart-summary-row cart-summary-total">
                <span>Total</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
