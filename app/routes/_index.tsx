import { Link, useLoaderData, useRouteLoaderData } from "react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { CategoryCard } from "~/components/CategoryCard";
import { ArrowRight, Sparkles, Shield, Clock, Award } from "lucide-react";
import "~/styles/home.css";

export function meta() {
  return [
    { title: "Home | Store" },
    { name: "description", content: "Discover unique, one-of-a-kind items curated just for you." },
  ];
}

export async function loader({ request }: { request: Request }) {
  const { getFeaturedProducts, getRecentProducts } = await import("~/db/models/products.server");
  const { getAllCategories } = await import("~/db/models/categories.server");
  const { getOptionalUser, getSessionId } = await import("~/services/auth.server");
  const { getCartCount } = await import("~/db/models/cart.server");

  const user = await getOptionalUser(request);
  const sessionId = await getSessionId(request);
  const cartCount = await getCartCount(sessionId);
  const featured = await getFeaturedProducts(8);
  const recent = await getRecentProducts(8);
  const categories = await getAllCategories();

  return { featured, recent, categories, user, cartCount };
}

export default function HomePage() {
  const { featured, recent, categories, user, cartCount } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData<any>("root");
  const heroImageUrl = rootData?.heroImageUrl || "";
  const heroTitle = rootData?.heroTitle || "";
  const heroSubtitle = rootData?.heroSubtitle || "";

  const handleAddToCart = async (productId: number) => {
    const form = new FormData();
    form.set("productId", String(productId));
    form.set("action", "add");
    await fetch("/api/cart", { method: "POST", body: form });
    window.location.reload();
  };

  return (
    <>
      <Header cartCount={cartCount} user={user} />

      <main>
        {/* Hero Section */}
        <section
          className={`hero ${heroImageUrl ? "hero-has-bg" : ""}`}
          id="hero"
          style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})` } as React.CSSProperties : undefined}
        >
          <div className="hero-bg">
            <div className="hero-gradient" />
          </div>
          <div className="hero-content">
            <span className="hero-badge">
              <Sparkles size={16} />
              One-of-a-kind Finds
            </span>
            <h1 className="hero-title">
              {heroTitle ? (
                heroTitle
              ) : (
                <>
                  Discover Unique
                  <br />
                  <span className="hero-title-accent">Treasures</span>
                </>
              )}
            </h1>
            <p className="hero-subtitle">
              {heroSubtitle || "Every item in our collection is exclusive — once it's gone, it's gone forever. Find something that speaks to you."}
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                Shop Now
                <ArrowRight size={18} />
              </Link>
              <Link to="/categories" className="btn btn-outline btn-lg">
                Browse Categories
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        {featured.length > 0 && (
          <section className="featured-section" id="featured">
            <div className="container">
              <div className="section-header">
                <h2 className="section-title">Featured Items</h2>
                <p className="section-subtitle">Hand-picked exclusive pieces just for you</p>
              </div>
              <div className="product-grid">
                {featured.map((product: any, i: number) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    index={i}
                  />
                ))}
              </div>
              <div className="section-cta">
                <Link to="/products" className="btn btn-outline">
                  View All Products
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <section className="category-showcase" id="categories">
            <div className="container">
              <div className="section-header">
                <h2 className="section-title">Shop by Category</h2>
                <p className="section-subtitle">Find exactly what you're looking for</p>
              </div>
              <div className="category-grid">
                {categories.map((cat: any, i: number) => (
                  <CategoryCard key={cat.id} category={cat} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {recent.length > 0 && (
          <section className="featured-section" id="new-arrivals">
            <div className="container">
              <div className="section-header">
                <h2 className="section-title">New Arrivals</h2>
                <p className="section-subtitle">Fresh additions to our collection</p>
              </div>
              <div className="product-grid">
                {recent.map((product: any, i: number) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why Shop With Us */}
        <section className="why-shop" id="why-us">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Why Shop With Us</h2>
            </div>
            <div className="why-shop-grid">
              <div className="why-shop-card">
                <div className="why-shop-icon">
                  <Sparkles size={28} />
                </div>
                <h3>Exclusive Items</h3>
                <p>Every piece is unique. Once sold, it&apos;s gone forever. Own something truly special.</p>
              </div>
              <div className="why-shop-card">
                <div className="why-shop-icon">
                  <Shield size={28} />
                </div>
                <h3>Secure Payments</h3>
                <p>Pay safely with JazzCash. Your transactions are protected with bank-level security.</p>
              </div>
              <div className="why-shop-card">
                <div className="why-shop-icon">
                  <Clock size={28} />
                </div>
                <h3>Fast Processing</h3>
                <p>Quick order processing and updates. We keep you informed every step of the way.</p>
              </div>
              <div className="why-shop-card">
                <div className="why-shop-icon">
                  <Award size={28} />
                </div>
                <h3>Quality Assured</h3>
                <p>Each item is carefully inspected and curated to meet our high quality standards.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section" id="cta">
          <div className="container">
            <h2 className="cta-title">Ready to Find Your Next Treasure?</h2>
            <p className="cta-subtitle">
              Browse our collection of exclusive items and find something that speaks to you.
            </p>
            <Link to="/products" className="btn btn-primary btn-lg">
              Start Shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
