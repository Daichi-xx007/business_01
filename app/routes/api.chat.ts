import {
  getOrCreateConversation,
  addMessage,
  getConversationMessages,
  getFrequentQuestions,
} from "~/db/models/chat.server";
import {
  getStoreContext,
  buildSystemPrompt,
} from "~/services/chat-context.server";

// ---------------------------------------------------------------------------
// Gemini API Call
// ---------------------------------------------------------------------------

interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

async function callGemini(
  systemPrompt: string,
  conversationHistory: GeminiMessage[],
  userMessage: string
): Promise<string> {
  const { getSetting } = await import("~/db/models/settings.server");
  const apiKey = await getSetting("GEMINI_API_KEY", process.env.GEMINI_API_KEY || "");
  
  if (!apiKey) {
    return "I'm currently offline because the AI service hasn't been configured yet. Please contact the store directly through WhatsApp or check back later! 🙏";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // Build the request
  const contents: GeminiMessage[] = [
    ...conversationHistory,
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 300,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return "Sorry, I'm having trouble connecting right now. Please try again in a moment! 🔄";
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I didn't quite catch that. Could you rephrase? 🤔";
    return text.trim();
  } catch (err) {
    console.error("Gemini API fetch error:", err);
    return "Oops, something went wrong on my end. Please try again! 🔄";
  }
}

// ---------------------------------------------------------------------------
// API Route Handler
// ---------------------------------------------------------------------------

export async function action({ request }: { request: Request }) {
  const { getSessionId, getOptionalUser } = await import(
    "~/services/auth.server"
  );

  const formData = await request.formData();
  const userMessage = String(formData.get("message") || "").trim();

  if (!userMessage) {
    return Response.json({ error: "Empty message" }, { status: 400 });
  }

  // Get session info
  const sessionId = await getSessionId(request);
  const user = await getOptionalUser(request);

  // Get or create conversation
  const conversation = await getOrCreateConversation(sessionId);

  // Save user message
  await addMessage(conversation.id, "user", userMessage);

  // Get conversation history for context
  const dbMessages = await getConversationMessages(conversation.id, 20);

  // Convert to Gemini format (exclude system messages, pair user/assistant)
  const geminiHistory: GeminiMessage[] = [];
  for (const msg of dbMessages) {
    if (msg.role === "system") continue;
    // Skip the very last message (the one we just added) since we pass it separately
    if (msg.id === dbMessages[dbMessages.length - 1]?.id && msg.role === "user")
      continue;
    geminiHistory.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // Build real-time store context
  const storeContext = await getStoreContext();

  // Get FAQ summary for learning
  const faqs = await getFrequentQuestions(8);
  const faqSummary = faqs.length > 0
    ? faqs.map((f: any) => `- "${f.content}" (asked ${f.count} times)`).join("\n")
    : "";

  // Build system prompt
  const systemPrompt = await buildSystemPrompt(storeContext, faqSummary);

  // Call Gemini
  const aiReply = await callGemini(systemPrompt, geminiHistory, userMessage);

  // Save assistant response
  await addMessage(conversation.id, "model", aiReply);

  return Response.json({
    reply: aiReply,
    conversationId: conversation.id,
  });
}
