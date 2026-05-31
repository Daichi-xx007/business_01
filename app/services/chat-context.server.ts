import { db } from "~/db/database.server";

// ---------------------------------------------------------------------------
// Build a live snapshot of the store for the AI system prompt
// ---------------------------------------------------------------------------

export async function getStoreContext(): Promise<string> {
  const { getSetting } = await import("~/db/models/settings.server");
  const siteName = await getSetting("SITE_NAME", process.env.SITE_NAME || "Store");

  // Products summary
  const productsResult = await db.query(
    `SELECT p.name, p.price, p.status, p.description, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ORDER BY p.created_at DESC
     LIMIT 50`
  );
  const products = productsResult.rows;

  const availableProducts = products.filter((p) => p.status === "available");
  const soldProducts = products.filter((p) => p.status === "sold");

  // Categories
  const categoriesResult = await db.query(
    `SELECT c.name, c.description, COUNT(p.id) as product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id
     ORDER BY c.sort_order`
  );
  const categories = categoriesResult.rows;

  // Stats
  const totalProductsRes = await db.query("SELECT COUNT(*) as c FROM products");
  const totalProducts = parseInt(totalProductsRes.rows[0].c, 10);
  
  const availableCountRes = await db.query("SELECT COUNT(*) as c FROM products WHERE status = 'available'");
  const availableCount = parseInt(availableCountRes.rows[0].c, 10);

  // Price range
  const priceRangeRes = await db.query(
    "SELECT MIN(price) as min_price, MAX(price) as max_price FROM products WHERE status = 'available'"
  );
  const priceRange = priceRangeRes.rows[0];

  // Build the context string
  let context = `
STORE NAME: ${siteName}

STORE OVERVIEW:
- Total products: ${totalProducts}
- Available products: ${availableCount}
- Sold products: ${soldProducts.length}
- Price range: Rs. ${priceRange?.min_price || 0} — Rs. ${priceRange?.max_price || 0}
- Payment method: JazzCash (mobile wallet)
- Currency: PKR (Pakistani Rupees)
- Delivery: Across Pakistan, 3-5 business days

CATEGORIES:
${categories.map((c) => `- ${c.name}: ${c.description} (${c.product_count} products)`).join("\n")}

AVAILABLE PRODUCTS:
${availableProducts
  .map(
    (p) =>
      `- "${p.name}" — Rs. ${p.price} [${p.category_name || "Uncategorized"}] — ${p.description || "No description"}`
  )
  .join("\n")}
`;

  if (soldProducts.length > 0) {
    context += `\nRECENTLY SOLD (no longer available):\n${soldProducts
      .slice(0, 10)
      .map((p) => `- "${p.name}" — Rs. ${p.price} [SOLD]`)
      .join("\n")}\n`;
  }

  return context.trim();
}

// ---------------------------------------------------------------------------
// System prompt that makes the AI a store assistant
// ---------------------------------------------------------------------------

export async function buildSystemPrompt(storeContext: string, faqSummary: string): Promise<string> {
  const { getSetting } = await import("~/db/models/settings.server");
  const siteName = await getSetting("SITE_NAME", process.env.SITE_NAME || "Store");
  const whatsappNumber = await getSetting("WHATSAPP_NUMBER", process.env.WHATSAPP_NUMBER || "0300-1234567");

  return `You are the friendly AI shopping assistant for "${siteName}", an online store that sells unique, one-of-a-kind leftover items. Each item is exclusive — once sold, it's gone forever.

YOUR PERSONALITY:
- Warm, helpful, and enthusiastic but concise
- You use relevant emojis sparingly (1-2 per message max)
- You keep responses short (2-4 sentences usually, unless the user asks for details)
- You sound like a knowledgeable friend, not a corporate robot

LANGUAGE RULES (CRITICAL):
- Mirror the user's exact script and language naturally.
- If the user types in English, reply in English.
- If the user types in Urdu using the English/Latin alphabet (often called Roman Urdu), reply back in the exact same English/Latin alphabet style.
- If the user types in the native Urdu script (اردو), reply back in the native Urdu script.
- NEVER say the words "Roman Urdu" or "Urdu" or announce what language you are speaking. Just naturally respond in their language.

HUMAN AGENT HANDOFF:
- If the user specifically asks to talk to a human agent, employee, real person, or owner, you MUST politely refer them to contact the store directly on WhatsApp at: ${whatsappNumber}. Tell them an employee will assist them there.

WHAT YOU KNOW:
${storeContext}

${faqSummary ? \`FREQUENTLY ASKED QUESTIONS BY PAST CUSTOMERS:\\n\${faqSummary}\\n\` : ""}

STORE POLICIES:
- Items are exclusive, one-of-a-kind. Once sold, gone forever.
- Items are reserved for 30 minutes when added to cart.
- Payment via JazzCash only.
- Delivery across Pakistan, 3-5 business days.
- Returns only if item is damaged during shipping (within 24 hours of delivery).
- Guests can browse and buy without an account.
- Having an account lets you track orders and autofill checkout.

WHAT YOU CAN DO:
- Help users find products by category, price range, or description
- Answer questions about specific products (price, availability, details)
- Explain how to add items to cart and checkout
- Explain payment process (JazzCash)
- Answer shipping and return policy questions
- Guide users to create an account or log in
- Recommend products based on what the user is looking for

WHAT YOU CANNOT DO:
- You cannot place orders or modify carts directly
- You cannot access user accounts or personal data
- You cannot change prices or product listings
- If asked to do something you can't, kindly explain and redirect them

RESPONSE FORMAT:
- Never use markdown formatting (no **, ##, etc.)
- Use plain text only
- Keep it conversational and natural`;
}
