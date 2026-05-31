import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
  useLocation,
} from "react-router";
import { ChatWidget } from "~/components/ChatWidget";

export async function loader() {
  const { getSetting } = await import("~/db/models/settings.server");
  
  return {
    siteName: await getSetting("SITE_NAME", process.env.SITE_NAME || "Store"),
    logoUrl: await getSetting("LOGO_URL", process.env.LOGO_URL || ""),
    heroImageUrl: await getSetting("HERO_IMAGE_URL", process.env.HERO_IMAGE_URL || ""),
    heroTitle: await getSetting("HERO_TITLE", process.env.HERO_TITLE || ""),
    heroSubtitle: await getSetting("HERO_SUBTITLE", process.env.HERO_SUBTITLE || ""),
    whatsappNumber: await getSetting("WHATSAPP_NUMBER", process.env.WHATSAPP_NUMBER || ""),
    instagramUrl: await getSetting("INSTAGRAM_URL", process.env.INSTAGRAM_URL || ""),
    facebookUrl: await getSetting("FACEBOOK_URL", process.env.FACEBOOK_URL || ""),
  };
}

export function headers() {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}

import globalStyles from "./styles/global.css?url";
import componentsStyles from "./styles/components.css?url";
import aboutStyles from "./styles/about.css?url";
import homeStyles from "./styles/home.css?url";
import productsStyles from "./styles/products.css?url";
import cartStyles from "./styles/cart.css?url";
import checkoutStyles from "./styles/checkout.css?url";
import authStyles from "./styles/auth.css?url";
import adminStyles from "./styles/admin.css?url";
import chatStyles from "./styles/chat.css?url";

export function links() {
  return [
    { rel: "stylesheet", href: globalStyles },
    { rel: "stylesheet", href: componentsStyles },
    { rel: "stylesheet", href: aboutStyles },
    { rel: "stylesheet", href: homeStyles },
    { rel: "stylesheet", href: productsStyles },
    { rel: "stylesheet", href: cartStyles },
    { rel: "stylesheet", href: checkoutStyles },
    { rel: "stylesheet", href: authStyles },
    { rel: "stylesheet", href: adminStyles },
    { rel: "stylesheet", href: chatStyles },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigation = useNavigation();
  const location = useLocation();
  const isLoading = navigation.state === "loading";
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      {isLoading && <div className="page-loading-bar" />}
      <Outlet />
      {!isAdmin && <ChatWidget />}
    </>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The page you're looking for doesn't exist."
        : error.statusText || details;
  } else if (error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="error-page">
      <div className="error-container">
        <h1 className="error-title">{message}</h1>
        <p className="error-details">{details}</p>
        {stack && (
          <pre className="error-stack">
            <code>{stack}</code>
          </pre>
        )}
        <a href="/" className="btn btn-primary">
          Go Home
        </a>
      </div>
    </main>
  );
}
