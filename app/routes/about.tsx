import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { useLoaderData } from "react-router";
import { Heart, Shield, Sparkles, Users, Instagram, MessageCircle } from "lucide-react";
import "~/styles/about.css";

export function meta() {
  return [
    { title: "About Us | Store" },
    { name: "description", content: "Learn about our story and mission." },
  ];
}

export async function loader({ request }: { request: Request }) {
  const { getOptionalUser, getSessionId } = await import("~/services/auth.server");
  const { getCartCount } = await import("~/db/models/cart.server");
  const { getSetting } = await import("~/db/models/settings.server");
  
  const user = await getOptionalUser(request);
  const sessionId = await getSessionId(request);
  const cartCount = getCartCount(sessionId);
  
  return { 
    user, 
    cartCount,
    instagramUrl: await getSetting("INSTAGRAM_URL", process.env.INSTAGRAM_URL || "https://instagram.com"),
    whatsappNumber: await getSetting("WHATSAPP_NUMBER", process.env.WHATSAPP_NUMBER || ""),
    ownerAvatar: await getSetting("OWNER_AVATAR", ""),
    ownerName: await getSetting("OWNER_NAME", "Syeda Asia"),
    ownerBio: await getSetting("OWNER_BIO", "Started with a passion for finding unique treasures, Syeda Asia built this store to share her love for exclusive, authentic, and meticulously curated items. Every piece in our collection is handpicked to ensure it brings joy, character, and uniqueness to your home. We're more than just a store; we're a community of enthusiasts who appreciate the beauty of the extraordinary.")
  };
}

export default function AboutPage() {
  const { user, cartCount, instagramUrl, whatsappNumber, ownerAvatar, ownerName, ownerBio } = useLoaderData<typeof loader>();

  return (
    <>
      <Header cartCount={cartCount} user={user} />
      <main className="about-page">
        <div className="container">
          <div className="about-hero">
            <h1 className="page-title">About Us</h1>
            <p className="page-subtitle" style={{ maxWidth: "600px", margin: "0 auto" }}>
              We believe every item has a story. Our mission is to connect unique, one-of-a-kind
              pieces with people who will cherish them.
            </p>
          </div>

          <div className="owner-section">
            <div className="owner-avatar" style={ownerAvatar ? { backgroundImage: `url(${ownerAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : {}}>
              {!ownerAvatar && <span style={{ fontSize: "4rem", fontWeight: "bold" }}>{ownerName.substring(0,2).toUpperCase()}</span>}
            </div>
            <div className="owner-info">
              <h3>Founder & Curator</h3>
              <h2>{ownerName}</h2>
              <p>{ownerBio}</p>
            </div>
          </div>

          <div className="connect-grid">
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="connect-card instagram">
              <div className="connect-card-icon">
                <Instagram size={32} />
              </div>
              <h3>Follow on Instagram</h3>
              <p>Join our visual journey and stay updated</p>
            </a>
            
            <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="connect-card whatsapp">
              <div className="connect-card-icon">
                <MessageCircle size={32} />
              </div>
              <h3>Chat on WhatsApp</h3>
              <p>Direct support and instant responses</p>
            </a>
          </div>

          <div className="about-values">
            <div className="value-card">
              <div className="value-card-icon"><Heart size={24} /></div>
              <h3>Our Mission</h3>
              <p>To curate and deliver exceptional, one-of-a-kind items that bring joy and uniqueness to every home.</p>
            </div>
            <div className="value-card">
              <div className="value-card-icon"><Sparkles size={24} /></div>
              <h3>Our Story</h3>
              <p>Started with a passion for unique finds, we've grown into a trusted destination for exclusive items.</p>
            </div>
            <div className="value-card">
              <div className="value-card-icon"><Shield size={24} /></div>
              <h3>Our Promise</h3>
              <p>Every product is authentic, carefully inspected, and delivered with care. Satisfaction guaranteed.</p>
            </div>
            <div className="value-card">
              <div className="value-card-icon"><Users size={24} /></div>
              <h3>Community</h3>
              <p>We're building a community of collectors and enthusiasts who appreciate the beauty of unique items.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
