import { Link, useLoaderData, useSearchParams } from "react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { Search, ArrowLeft, ChevronDown } from "lucide-react";
import "~/styles/products.css";

export function meta({ data }: { data: any }) {
  const name = data?.category?.name || "Category";
  return [
    { title: `${name} | Store` },
    { name: "description", content: `Browse ${name} products.` },
  ];
}

export async function loader({ params, request }: { params: { slug: string }; request: Request }) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const sort = url.searchParams.get("sort") || "newest";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 12;

  const { getCategoryBySlug } = await import("~/db/models/categories.server");
  const { getProductsByCategory } = await import("~/db/models/products.server");
  const { getOptionalUser, getSessionId } = await import("~/services/auth.server");
  const { getCartCount } = await import("~/db/models/cart.server");

  const category = await getCategoryBySlug(params.slug as string);
  if (!category) {
    throw new Response("Category Not Found", { status: 404 });
  }

  const user = await getOptionalUser(request);
  const sessionId = await getSessionId(request);
  const cartCount = await getCartCount(sessionId);
  const { products, total } = await getProductsByCategory(params.slug as string, { search, sort, page, limit });
  const totalPages = Math.ceil(total / limit);

  return { category, products, user, cartCount, total, page, totalPages, search, sort };
}

export default function CategoryDetailPage() {
  const { category, products, user, cartCount, total, page, totalPages, search, sort } =
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
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    setSearchParams(params);
  };

  return (
    <>
      <Header cartCount={cartCount} user={user} />
      <main className="products-page">
        <div className="container">
          <Link to="/categories" className="back-link">
            <ArrowLeft size={18} /> All Categories
          </Link>
          <div className="products-header">
            <div>
              <h1 className="page-title">{category.name}</h1>
              <p className="page-subtitle">{total} items in this category</p>
            </div>
          </div>
          <div className="products-controls">
            <div className="products-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search in category..."
                defaultValue={search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="products-search-input"
              />
            </div>
            <div className="products-filters">
              <div className="filter-group">
                <select value={sort} onChange={(e) => updateFilter("sort", e.target.value)} className="filter-select">
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
            <div className="product-grid">
              {products.map((product: any, i: number) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} index={i} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={48} />
              <h3>No products found</h3>
              <p>This category doesn&apos;t have any products yet.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
