import { Link, useRouteLoaderData } from "react-router";
import { Mail, Phone, MapPin, Heart } from "lucide-react";

interface FooterProps {
  siteName?: string;
}

export function Footer({ siteName: propSiteName }: FooterProps) {
  const rootData = useRouteLoaderData<any>("root");
  const siteName = propSiteName || rootData?.siteName || "Store";

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              {siteName}
            </Link>
            <p className="footer-tagline">
              Discover unique, one-of-a-kind items curated just for you. Each piece tells a story.
            </p>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-heading">Quick Links</h4>
            <nav className="footer-links">
              <Link to="/products">All Products</Link>
              <Link to="/categories">Categories</Link>
              <Link to="/about">About Us</Link>
            </nav>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-heading">Account</h4>
            <nav className="footer-links">
              <Link to="/auth/login">Login</Link>
              <Link to="/auth/register">Register</Link>
              <Link to="/cart">Shopping Cart</Link>
            </nav>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-heading">Contact</h4>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <Mail size={16} />
                <span>info@store.com</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={16} />
                <span>+92 300 1234567</span>
              </div>
              <div className="footer-contact-item">
                <MapPin size={16} />
                <span>Pakistan</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <p className="footer-made-with">
            Made with <Heart size={14} className="footer-heart" /> in Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
}
