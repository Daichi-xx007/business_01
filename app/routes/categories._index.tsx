import { useLoaderData } from "react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { CategoryCard } from "~/components/CategoryCard";
import "~/styles/products.css";

export function meta() {
  return [
    { title: "Categories | Store" },
    { name: "description", content: "Browse our product categories." },
  ];
}

export async function loader({ request }: { request: Request }) {
  const { getAllCategories } = await import("~/db/models/categories.server");
  const { getOptionalUser, getSessionId } = await import("~/services/auth.server");
  const { getCartCount } = await import("~/db/models/cart.server");

  const user = await getOptionalUser(request);
  const sessionId = await getSessionId(request);
  const cartCount = await getCartCount(sessionId);
  const categories = await getAllCategories();

  return { categories, user, cartCount };
}

export default function CategoriesPage() {
  const { categories, user, cartCount } = useLoaderData<typeof loader>();

  return (
    <>
      <Header cartCount={cartCount} user={user} />
      <main className="products-page">
        <div className="container">
          <div className="products-header">
            <div>
              <h1 className="page-title">Categories</h1>
              <p className="page-subtitle">Find what you&apos;re looking for</p>
            </div>
          </div>
          <div className="category-grid category-grid-large">
            {categories.map((cat: any, i: number) => (
              <CategoryCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
