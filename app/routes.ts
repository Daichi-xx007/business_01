import { type RouteConfig, index, route, prefix } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),

  // Auth routes
  route("auth/login", "routes/auth.login.tsx"),
  route("auth/register", "routes/auth.register.tsx"),
  route("auth/logout", "routes/auth.logout.tsx"),

  // Products
  route("products", "routes/products._index.tsx"),
  route("products/:slug", "routes/products.$slug.tsx"),

  // Categories
  route("categories", "routes/categories._index.tsx"),
  route("categories/:slug", "routes/categories.$slug.tsx"),

  // Other pages
  route("about", "routes/about.tsx"),
  route("search", "routes/search.tsx"),

  // Cart & Checkout
  route("cart", "routes/cart.tsx"),
  route("checkout", "routes/checkout.tsx"),
  route("api/cart", "routes/api.cart.ts"),

  // Payment
  route("payment/redirect", "routes/payment.redirect.tsx"),
  route("payment/callback", "routes/payment.callback.tsx"),

  // Admin routes
  ...prefix("admin", [
    index("routes/admin._index.tsx"),
    route("products", "routes/admin.products._index.tsx"),
    route("products/new", "routes/admin.products.new.tsx"),
    route("products/:id/edit", "routes/admin.products.$id.edit.tsx"),
    route("categories", "routes/admin.categories.tsx"),
    route("orders", "routes/admin.orders.tsx"),
    route("users", "routes/admin.users.tsx"),
    route("settings", "routes/admin.settings.tsx"),
    route("inventory", "routes/admin.inventory.tsx"),
  ]),
] satisfies RouteConfig;
