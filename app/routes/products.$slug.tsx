import { Link, useLoaderData } from "react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { ShoppingCart, ArrowLeft, Tag } from "lucide-react";
import "~/styles/products.css";

export function meta({ data }: { data: any }) {
  const name = data?.product?.name || "Product";
  return [
    { title: `${name} | Store` },
    { name: "description", content: data?.product?.description || "View product details" },
  ];
}

export async function loader({ params, request }: { params: { slug: string }; request: Request }) {
  const { getProductBySlug, getProductsByCategory } = await import("~/db/models/products.server");
  const { getOptionalUser, getSessionId } = await import("~/services/auth.server");
  const { getCartCount } = await import("~/db/models/cart.server");

  const product = await getProductBySlug(params.slug as string);
  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }

  const user = await getOptionalUser(request);
  const sessionId = await getSessionId(request);
  const cartCount = await getCartCount(sessionId);

  let relatedProducts: any[] = [];
  if (product.category_id) {
    const result = await getProductsByCategory(product.category_slug || "", {
      limit: 4,
    });
    relatedProducts = result.products.filter((p: any) => p.id !== product.id).slice(0, 4);
  }

  return { product, relatedProducts, user, cartCount };
}

export default function ProductDetailPage() {
  const { product, relatedProducts, user, cartCount } = useLoaderData<typeof loader>();

  const handleAddToCart = async (productId: number) => {
    const form = new FormData();
    form.set("productId", String(productId));
    form.set("action", "add");
    await fetch("/api/cart", { method: "POST", body: form });
    window.location.reload();
  };

  const isAvailable = product.status === "available";

  return (
    <>
      <Header cartCount={cartCount} user={user} />

      <main className="product-detail-page">
        <div className="container">
          <Link to="/products" className="back-link">
            <ArrowLeft size={18} />
            Back to Products
          </Link>

          <div className="product-detail">
            <div className="product-detail-image">
              <img
                src={product.image_url || "/images/placeholder.jpg"}
                alt={product.name}
              />
              {product.status === "sold" && (
                <div className="product-detail-sold-overlay">
                  <span>SOLD</span>
                </div>
              )}
            </div>

            <div className="product-detail-info">
              {product.category_name && (
                <Link
                  to={`/categories/${product.category_slug}`}
                  className="product-detail-category"
                >
                  <Tag size={14} />
                  {product.category_name}
                </Link>
              )}

              <h1 className="product-detail-name">{product.name}</h1>
              <p className="product-detail-price">Rs. {(product.price || 0).toLocaleString()}</p>

              <div className="product-detail-status">
                <span className={`badge ${product.status === "available" ? "badge-available" : product.status === "sold" ? "badge-sold" : "badge-in-cart"}`}>
                  {product.status === "available" ? "Available" : product.status === "sold" ? "Sold" : "Reserved"}
                </span>
                <span className="product-detail-exclusive">✨ One-of-a-kind item</span>
              </div>

              <div className="product-detail-description">
                <h3>Description</h3>
                <p>{product.description || "No description available."}</p>
              </div>

              {isAvailable && (
                <button
                  className="btn btn-primary btn-lg product-detail-add-btn"
                  onClick={() => handleAddToCart(product.id)}
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
              )}

              {product.status === "in_cart" && (
                <p className="product-detail-reserved-text">
                  This item is currently reserved by another shopper.
                </p>
              )}
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <section className="related-products">
              <h2 className="section-title">Related Products</h2>
              <div className="product-grid">
                {relatedProducts.map((p: any, i: number) => (
                  <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
