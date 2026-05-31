import { useState, useRef, useEffect, useCallback } from "react";
import { useRouteLoaderData } from "react-router";
import {
  MessageCircle,
  X,
  Send,
  Headphones,
  Sparkles,
} from "lucide-react";
import "~/styles/chat.css";

// ---------- SVG Icons for social platforms ----------
function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function InstagramIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function FacebookIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

// ---------- Types ----------
interface ChatMessage {
  id: number;
  text: string;
  sender: "user" | "bot";
  time: string;
}

interface SocialConfig {
  whatsappNumber?: string;
  instagramUrl?: string;
  facebookUrl?: string;
}

// ---------- Component ----------
export function ChatWidget({ social }: { social?: SocialConfig }) {
  const rootData = useRouteLoaderData<any>("root");
  const siteName = rootData?.siteName || "Store";

  const whatsapp = social?.whatsappNumber || rootData?.whatsappNumber || "";
  const instagram = social?.instagramUrl || rootData?.instagramUrl || "";
  const facebook = social?.facebookUrl || rootData?.facebookUrl || "";

  const [fabOpen, setFabOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: `Assalam o Alaikum! 👋 Welcome to ${siteName}. I'm your AI shopping assistant. Ask me anything about our products, prices, shipping, or anything else — in English ya Roman Urdu, dono chalein ge!`,
      sender: "bot",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [chatOpen]);

  const quickReplies = [
    "Kya products available hain?",
    "Shipping kaise hoti hai?",
    "Payment method kya hai?",
    "Show me featured items",
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = {
      id: Date.now(),
      text: text.trim(),
      sender: "user",
      time: now,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setShowQuickReplies(false);
    setIsTyping(true);

    try {
      const form = new FormData();
      form.set("message", text.trim());

      const response = await fetch("/api/chat", {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      const botReply: ChatMessage = {
        id: Date.now() + 1,
        text: data.reply || "Sorry, I couldn't process that. Please try again!",
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setIsTyping(false);
      setMessages(prev => [...prev, botReply]);
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Connection issue. Please try again in a moment! 🔄",
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const openChat = () => {
    setChatOpen(true);
    setFabOpen(false);
  };

  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi! I'm interested in your products.")}`
    : "";

  return (
    <>
      {/* Chat Window */}
      {chatOpen && (
        <div className="chat-window" id="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-avatar">
              <Sparkles size={22} />
            </div>
            <div className="chat-header-info">
              <div className="chat-header-name">{siteName} AI Assistant</div>
              <div className="chat-header-status">Online — Powered by AI</div>
            </div>
            <button
              className="chat-close-btn"
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`chat-message ${msg.sender === "user" ? "chat-message-user" : "chat-message-bot"}`}
              >
                {msg.text}
                <span className="chat-message-time">{msg.time}</span>
              </div>
            ))}

            {/* Quick Replies */}
            {showQuickReplies && messages.length <= 1 && (
              <div className="chat-quick-replies">
                {quickReplies.map(qr => (
                  <button
                    key={qr}
                    className="chat-quick-reply"
                    onClick={() => sendMessage(qr)}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="chat-typing">
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chat-input-area" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Kuch bhi poochein... Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              id="chat-input"
              autoComplete="off"
              disabled={isTyping}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* FAB Container */}
      {!chatOpen && (
        <div className="fab-container" id="fab-container">
          {/* FAB Menu */}
          <div className={`fab-menu ${fabOpen ? "fab-menu-open" : ""}`}>
            {/* Chat */}
            <div className="fab-item" onClick={openChat}>
              <span className="fab-item-label">AI Assistant</span>
              <button className="fab-item-btn fab-chat-trigger" aria-label="Open AI chat">
                <Sparkles size={22} />
              </button>
            </div>

            {/* WhatsApp */}
            {whatsapp && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="fab-item"
              >
                <span className="fab-item-label">WhatsApp</span>
                <span className="fab-item-btn fab-whatsapp" aria-label="Contact on WhatsApp">
                  <WhatsAppIcon />
                </span>
              </a>
            )}

            {/* Instagram */}
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="fab-item"
              >
                <span className="fab-item-label">Instagram</span>
                <span className="fab-item-btn fab-instagram" aria-label="Follow on Instagram">
                  <InstagramIcon />
                </span>
              </a>
            )}

            {/* Facebook */}
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="fab-item"
              >
                <span className="fab-item-label">Facebook</span>
                <span className="fab-item-btn fab-facebook" aria-label="Follow on Facebook">
                  <FacebookIcon />
                </span>
              </a>
            )}
          </div>

          {/* Toggle Button */}
          <button
            className={`fab-toggle ${fabOpen ? "fab-toggle-active" : ""}`}
            onClick={() => setFabOpen(!fabOpen)}
            aria-label={fabOpen ? "Close menu" : "Open contact menu"}
            id="fab-toggle"
          >
            {fabOpen ? <X size={26} /> : <MessageCircle size={26} />}
            {!fabOpen && <span className="fab-toggle-pulse" />}
          </button>
        </div>
      )}
    </>
  );
}
