import { Link, useLocation, useRouteLoaderData } from "react-router";
import { ShoppingCart, Search, User, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  cartCount?: number;
  user?: { id: number; name: string; role: string } | null;
  siteName?: string;
}

export function Header({ cartCount = 0, user, siteName: propSiteName }: HeaderProps) {
  const rootData = useRouteLoaderData<any>("root");
  const siteName = propSiteName || rootData?.siteName || "Store";
  const logoUrl = rootData?.logoUrl || "";
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Products" },
    { to: "/categories", label: "Categories" },
    { to: "/about", label: "About Us" },
  ];

  return (
    <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
      <div className="header-container">
        <Link to="/" className="header-logo">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="header-logo-img" />
          ) : (
            siteName
          )}
        </Link>

        <nav className={`header-nav ${mobileMenuOpen ? "header-nav-open" : ""}`}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? "nav-link-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="header-action-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
            id="search-toggle"
          >
            <Search size={20} />
          </button>

          <Link to="/cart" className="header-action-btn cart-btn" aria-label="Cart" id="cart-link">
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <div className="header-user-menu">
              <button className="header-action-btn user-btn" aria-label="User menu" id="user-menu-toggle">
                <User size={20} />
              </button>
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <span className="user-dropdown-name">{user.name}</span>
                </div>
                {user.role === "admin" && (
                  <Link to="/admin" className="user-dropdown-item">
                    <LayoutDashboard size={16} />
                    Admin Dashboard
                  </Link>
                )}
                <form action="/auth/logout" method="post">
                  <button type="submit" className="user-dropdown-item user-dropdown-logout">
                    <LogOut size={16} />
                    Logout
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <Link to="/auth/login" className="header-action-btn" aria-label="Login" id="login-link">
              <User size={20} />
            </Link>
          )}

          <button
            className="header-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="header-search-bar">
          <form onSubmit={handleSearch} className="header-search-form">
            <Search size={18} className="header-search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="header-search-input"
              autoFocus
              id="header-search-input"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>
        </div>
      )}

      {mobileMenuOpen && <div className="header-backdrop" onClick={() => setMobileMenuOpen(false)} />}
    </header>
  );
}
