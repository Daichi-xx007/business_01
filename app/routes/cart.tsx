import { Link, useLoaderData } from "react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Trash2, ShoppingBag, ArrowRight, Clock } from "lucide-react";
import "~/styles/cart.css";

export function meta() {
  return [{ title: "Cart | Store" }];
}

export async function loader({ request }: { request: Request }) {
  const { getOptionalUser, getSessionId } = await import("~/services/auth.server");
  const { getCartItems, getCartCount } = await import("~/db/models/cart.server");

  const user = await getOptionalUser(request);
  const sessionId = await getSessionId(request);
  const items = await getCartItems(sessionId);
  const cartCount = await getCartCount(sessionId);
  const total = items.reduce((sum: number, item: any) => sum + item.price, 0);

  return { items, total, user, cartCount };
}

export default function CartPage() {
  const { items, total, user, cartCount } = useLoaderData<typeof loader>();

  const handleRemove = async (productId: number) => {
    const form = new FormData();
    form.set("productId", String(productId));
    form.set("action", "remove");
    await fetch("/api/cart", { method: "POST", body: form });
    window.location.reload();
  };

  return (
    <>
      <Header cartCount={cartCount} user={user} />
      <main className="cart-page">
        <div className="container">
          <h1 className="page-title">Shopping Cart</h1>

          {items.length > 0 ? (
            <div className="cart-layout">
              <div className="cart-items">
                {items.map((item: any) => {
                  const expiresAt = new Date(item.expires_at);
                  const now = new Date();
                  const minutesLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 60000));

                  return (
                    <div key={item.id} className="cart-item">
                      <img
                        src={item.image_url || "/images/placeholder.jpg"}
                        alt={item.name}
                        className="cart-item-image"
                      />
                      <div className="cart-item-info">
                        <Link to={`/products/${item.slug}`} className="cart-item-name">
                          {item.name}
                        </Link>
                        <span className="cart-item-price">Rs. {(item.price || 0).toLocaleString()}</span>
                        <span className="cart-item-timer">
                          <Clock size={14} />
                          Reserved for {minutesLeft} min
                        </span>
                      </div>
                      <button
                        className="cart-item-remove"
                        onClick={() => handleRemove(item.product_id)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="cart-summary">
                <h3 className="cart-summary-title">Order Summary</h3>
                <div className="cart-summary-row">
                  <span>Items ({items.length})</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
                <div className="cart-summary-divider" />
                <div className="cart-summary-row cart-summary-total">
                  <span>Total</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
                <Link to="/checkout" className="btn btn-primary btn-lg" style={{ width: "100%", textAlign: "center" }}>
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="cart-empty">
              <ShoppingBag size={64} />
              <h3>Your cart is empty</h3>
              <p>Looks like you haven&apos;t added any items yet.</p>
              <Link to="/products" className="btn btn-primary">
                Browse Products
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
