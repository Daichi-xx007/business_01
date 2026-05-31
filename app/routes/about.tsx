import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { useLoaderData } from "react-router";
import { Heart, Shield, Sparkles, Users } from "lucide-react";

export function meta() {
  return [
    { title: "About Us | Store" },
    { name: "description", content: "Learn about our story and mission." },
  ];
}

export async function loader({ request }: { request: Request }) {
  const { getOptionalUser, getSessionId } = await import("~/services/auth.server");
  const { getCartCount } = await import("~/db/models/cart.server");
  const user = await getOptionalUser(request);
  const sessionId = await getSessionId(request);
  const cartCount = getCartCount(sessionId);
  return { user, cartCount };
}

export default function AboutPage() {
  const { user, cartCount } = useLoaderData<typeof loader>();

  return (
    <>
      <Header cartCount={cartCount} user={user} />
      <main className="products-page">
        <div className="container">
          <div className="about-hero">
            <h1 className="page-title">About Us</h1>
            <p className="page-subtitle" style={{ maxWidth: "600px", margin: "0 auto" }}>
              We believe every item has a story. Our mission is to connect unique, one-of-a-kind
              pieces with people who will cherish them.
            </p>
          </div>

          <div className="about-values" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem", margin: "3rem 0" }}>
            <div className="why-shop-card">
              <div className="why-shop-icon"><Heart size={28} /></div>
              <h3>Our Mission</h3>
              <p>To curate and deliver exceptional, one-of-a-kind items that bring joy and uniqueness to every home.</p>
            </div>
            <div className="why-shop-card">
              <div className="why-shop-icon"><Sparkles size={28} /></div>
              <h3>Our Story</h3>
              <p>Started with a passion for unique finds, we've grown into a trusted destination for exclusive items from across Pakistan.</p>
            </div>
            <div className="why-shop-card">
              <div className="why-shop-icon"><Shield size={28} /></div>
              <h3>Our Promise</h3>
              <p>Every product is authentic, carefully inspected, and delivered with care. Your satisfaction is our top priority.</p>
            </div>
            <div className="why-shop-card">
              <div className="why-shop-icon"><Users size={28} /></div>
              <h3>Our Community</h3>
              <p>We're building a community of collectors and enthusiasts who appreciate the beauty of unique, exclusive items.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
