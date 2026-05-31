import { Link, useLoaderData, useSearchParams } from "react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { Search, Filter, ChevronDown } from "lucide-react";
import "~/styles/products.css";

export function meta() {
  return [
    { title: "Products | Store" },
    { name: "description", content: "Browse our collection of exclusive, one-of-a-kind items." },
  ];
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const category = url.searchParams.get("category") || "";
  const sort = url.searchParams.get("sort") || "newest";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  const { getAllProducts, countProducts } = await import("~/db/models/products.server");
  const { getAllCategories } = await import("~/db/models/categories.server");
  const { getOptionalUser, getSessionId } = await import("~/services/auth.server");
  const { getCartCount } = await import("~/db/models/cart.server");

  const user = await getOptionalUser(request);
  const sessionId = await getSessionId(request);
  const cartCount = await getCartCount(sessionId);
  const categories = await getAllCategories();

  // Resolve category slug to id
  let categoryId: number | undefined;
  if (category) {
    const cat = categories.find((c: any) => c.slug === category);
    if (cat) categoryId = cat.id;
  }

  // Map sort values to model's expected format
  const sortMap: Record<string, string> = {
    "newest": "newest",
    "price-low": "price_asc",
    "price-high": "price_desc",
    "name": "name_asc",
  };

  const { products, total } = await getAllProducts({
    search,
    category: categoryId,
    sort: sortMap[sort] || "newest",
    page,
    limit,
  });
  const totalPages = Math.ceil(total / limit);

  return { products, categories, user, cartCount, total, page, totalPages, search, category, sort };
}

export default function ProductsPage() {
  const { products, categories, user, cartCount, total, page, totalPages, search, category, sort } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleAddToCart = async (productId: number) => {
    const form = new FormData();
    form.set("productId", String(productId));
    form.set("action", "add");
    await fetch("/api/cart", { method: "POST", body: form });
    window.location.reload();
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    setSearchParams(params);
  };

  return (
    <>
      <Header cartCount={cartCount} user={user} />

      <main className="products-page">
        <div className="container">
          <div className="products-header">
            <div>
              <h1 className="page-title">All Products</h1>
              <p className="page-subtitle">{total} exclusive items available</p>
            </div>
          </div>

          <div className="products-controls">
            <div className="products-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search products..."
                defaultValue={search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="products-search-input"
                id="products-search"
              />
            </div>

            <div className="products-filters">
              <div className="filter-group">
                <Filter size={16} />
                <select
                  value={category}
                  onChange={(e) => updateFilter("category", e.target.value)}
                  className="filter-select"
                  id="category-filter"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="filter-chevron" />
              </div>

              <div className="filter-group">
                <select
                  value={sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="filter-select"
                  id="sort-filter"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                </select>
                <ChevronDown size={14} className="filter-chevron" />
              </div>
            </div>
          </div>

          {products.length > 0 ? (
            <>
              <div className="product-grid">
                {products.map((product: any, i: number) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    index={i}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  {page > 1 && (
                    <Link
                      to={`/products?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) })}`}
                      className="pagination-btn"
                    >
                      Previous
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      to={`/products?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(p) })}`}
                      className={`pagination-btn ${p === page ? "pagination-btn-active" : ""}`}
                    >
                      {p}
                    </Link>
                  ))}
                  {page < totalPages && (
                    <Link
                      to={`/products?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) })}`}
                      className="pagination-btn"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Search size={48} />
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
