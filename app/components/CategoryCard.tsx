import { Link } from "react-router";

interface CategoryCardProps {
  category: {
    id: number;
    name: string;
    slug: string;
    image_url?: string;
    product_count?: number;
  };
  index?: number;
}

export function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  return (
    <Link
      to={`/categories/${category.slug}`}
      className={`category-card stagger-${(index % 8) + 1}`}
      id={`category-card-${category.id}`}
    >
      <div className="category-card-image-container">
        <img
          src={category.image_url || "/images/category-placeholder.jpg"}
          alt={category.name}
          className="category-card-image"
          loading="lazy"
        />
        <div className="category-card-overlay">
          <h3 className="category-card-name">{category.name}</h3>
          {typeof category.product_count === "number" && (
            <span className="category-card-count">
              {category.product_count} {category.product_count === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
