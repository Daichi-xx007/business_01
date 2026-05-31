import { useLoaderData } from "react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { Search } from "lucide-react";
import "~/styles/products.css";

export function meta({ data }: { data: any }) {
  return [
    { title: `Search: ${data?.query || ""} | Store` },
    { name: "description", content: "Search results" },
  ];
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  const { searchProducts } = await import("~/db/models/products.server");
  const { getOptionalUser, getSessionId } = await import("~/services/auth.server");
  const { getCartCount } = await import("~/db/models/cart.server");
  const { getAllProducts } = await import("~/db/models/products.server");

  const user = await getOptionalUser(request);
  const sessionId = await getSessionId(request);
  const cartCount = await getCartCount(sessionId);
  const { products } = await getAllProducts({ search: query, limit: 50 });

  return { products, user, cartCount, query };
}

export default function SearchPage() {
  const { products, user, cartCount, query } = useLoaderData<typeof loader>();

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
      <main className="products-page">
        <div className="container">
          <div className="products-header">
            <div>
              <h1 className="page-title">
                {query ? `Results for "${query}"` : "Search"}
              </h1>
              <p className="page-subtitle">
                {products.length} {products.length === 1 ? "item" : "items"} found
              </p>
            </div>
          </div>

          <form action="/search" method="get" className="products-controls" style={{ marginBottom: "2rem" }}>
            <div className="products-search" style={{ flex: 1 }}>
              <Search size={18} />
              <input
                type="text"
                name="q"
                placeholder="Search products..."
                defaultValue={query}
                className="products-search-input"
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          {products.length > 0 ? (
            <div className="product-grid">
              {products.map((product: any, i: number) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} index={i} />
              ))}
            </div>
          ) : query ? (
            <div className="empty-state">
              <Search size={48} />
              <h3>No results found</h3>
              <p>Try different keywords or browse our categories</p>
            </div>
          ) : (
            <div className="empty-state">
              <Search size={48} />
              <h3>Start searching</h3>
              <p>Type something to search our products</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
