import { Link } from "react-router";
import { ShoppingCart, Eye, Tag } from "lucide-react";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    image_url: string;
    status: string;
    category_name?: string;
  };
  onAddToCart?: (productId: number) => void;
  index?: number;
}

export function ProductCard({ product, onAddToCart, index = 0 }: ProductCardProps) {
  const isAvailable = product.status === "available";
  const isSold = product.status === "sold";
  const isInCart = product.status === "in_cart";

  const statusBadge = isSold
    ? { label: "Sold", className: "badge-sold" }
    : isInCart
    ? { label: "Reserved", className: "badge-in-cart" }
    : null;

  return (
    <div
      className={`product-card stagger-${(index % 8) + 1}`}
      id={`product-card-${product.id}`}
    >
      <Link to={`/products/${product.slug}`} className="product-card-image-link">
        <div className="product-card-image-container">
          <img
            src={product.image_url || "/images/placeholder.jpg"}
            alt={product.name}
            className="product-card-image"
            loading="lazy"
          />
          {statusBadge && (
            <span className={`badge ${statusBadge.className}`}>{statusBadge.label}</span>
          )}
          <div className="product-card-overlay">
            <span className="product-card-view">
              <Eye size={18} />
              View Details
            </span>
          </div>
        </div>
      </Link>

      <div className="product-card-info">
        {product.category_name && (
          <span className="product-card-category">
            <Tag size={12} />
            {product.category_name}
          </span>
        )}
        <Link to={`/products/${product.slug}`} className="product-card-name">
          {product.name}
        </Link>
        <div className="product-card-bottom">
          <span className="product-card-price">Rs. {(product.price || 0).toLocaleString()}</span>
          {isAvailable && onAddToCart && (
            <button
              className="product-card-cart-btn"
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product.id);
              }}
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCart size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
