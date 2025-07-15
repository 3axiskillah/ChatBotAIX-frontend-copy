import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  image_url?: string;
  timestamp?: string;
  blurred?: boolean;
  upsell?: boolean;
}

export default function ChatUI() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [user, setUser] = useState<{ id: number; is_premium: boolean } | null>(null);
  const [imagesSent, setImagesSent] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const DAILY_LIMIT_SECONDS = 40 * 60;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await apiFetch("/api/accounts/me/");
        if (!u || !u.email) throw new Error();
        setUser({ id: u.id, is_premium: u.is_premium });
      } catch {
        navigate("/accounts/login");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const loadAllHistory = async () => {
      try {
        const data = await apiFetch("/api/chat/history/all/");
        const formatted: Message[] = data.messages.map((msg: any, index: number) => ({
          id: index + 1,
          text: msg.content,
          sender: msg.is_user ? "user" : "ai",
          image_url: msg.image_url || undefined,
          timestamp: msg.timestamp,
        }));
        setMessages(
          formatted.length > 0
            ? formatted
            : [{ id: 1, text: "Hey there 👋 I'm Amber…", sender: "ai" }]
        );
        const imgs = formatted.filter((m) => m.image_url).map((m) => m.image_url!);
        setGalleryImages(imgs);
        setImagesSent(imgs.length);
      } catch {
        setMessages([{ id: 1, text: "Hey there 👋 I'm Amber…", sender: "ai" }]);
      }
    };
    loadAllHistory();
  }, []);

  const handleSignOut = async () => {
    await apiFetch("/api/accounts/logout/", { method: "POST" });
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };

  const checkTimeLimit = () => {
    if (user?.is_premium) return true;

    const today = new Date().toISOString().slice(0, 10);
    const usedDate = localStorage.getItem("chat_last_used_date");
    const usedSeconds = parseInt(localStorage.getItem("chat_minutes_used") || "0", 10);

    if (usedDate !== today) {
      localStorage.setItem("chat_last_used_date", today);
      localStorage.setItem("chat_minutes_used", "0");
      return true;
    }

    if (usedSeconds >= DAILY_LIMIT_SECONDS) {
      setShowUpgradePrompt(true);
      return false;
    }

    return true;
  };

  const incrementTimeUsed = (seconds: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const usedDate = localStorage.getItem("chat_last_used_date");
    const usedSeconds = parseInt(localStorage.getItem("chat_minutes_used") || "0", 10);

    if (usedDate !== today) {
      localStorage.setItem("chat_last_used_date", today);
      localStorage.setItem("chat_minutes_used", String(seconds));
    } else {
      localStorage.setItem("chat_minutes_used", String(usedSeconds + seconds));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || typing || !checkTimeLimit() || !user) return;

    const newMsg: Message = { id: Date.now(), text: message, sender: "user" };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setMessage("");
    setTyping(true);

    const startTime = Date.now();

    try {
      const data = await apiFetch(
        "/chat/respond",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            prompt: message,
            user_type: user.is_premium ? "premium" : "free",
            images_sent: imagesSent,
            history: updated.map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text,
            })),
          }),
        },
        true
      );

      const fullImageUrl =
        data.image_url && !data.image_url.startsWith("http")
          ? `${import.meta.env.VITE_AI_WORKER_URL}${data.image_url}`
          : data.image_url;

      setTimeout(async () => {
        const aiReplyText: Message = {
          id: Date.now() + 1,
          text: data.response || "No response.",
          sender: "ai",
        };
        setMessages((prev) => [...prev, aiReplyText]);

        if (fullImageUrl) {
          const aiReplyImage: Message = {
            id: Date.now() + 2,
            text: "",
            sender: "ai",
            image_url: fullImageUrl,
            blurred: data.blurred || false,
          };
          setMessages((prev) => [...prev, aiReplyImage]);
          if (!galleryImages.includes(fullImageUrl)) {
            setGalleryImages((prev) => [...prev, fullImageUrl]);
          }
          setImagesSent((prev) => prev + 1);
        }

        if (data.upsell) {
          setShowUpgradePrompt(true);
        }

        await apiFetch("/api/chat/submit/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: message,
            reply: data.response,
            image_url: fullImageUrl || null,
          }),
        });

        const durationSec = Math.floor((Date.now() - startTime) / 1000);
        incrementTimeUsed(durationSec);
        setTyping(false);
      }, 1500 + Math.random() * 1000);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 3,
          text: "⚠️ Error reaching Amber.",
          sender: "ai",
        },
      ]);
      setTyping(false);
    }
  };


return (
  <div className="w-screen h-screen flex bg-[#4B1F1F] text-[#E7D8C1] overflow-hidden">
    {/* Sidebar */}
    <div className={`flex flex-col bg-[#3A1818] border-r border-[#D1A75D] transition-all duration-300 ease-in-out ${
      sidebarOpen ? "w-64 p-4" : "w-0 p-0"} overflow-y-auto`}>
      <h2 className="text-lg font-bold mb-4">Gallery</h2>
      <div className="grid grid-cols-2 gap-4 pr-2">
        {galleryImages.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Generated ${i}`}
            className="rounded-lg shadow hover:scale-105 transition cursor-pointer object-cover h-32 w-full"
            onClick={() => setModalImage(url)}
          />
        ))}
      </div>
    </div>

    {/* Image Preview Modal */}
    {modalImage && (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
        onClick={() => setModalImage(null)}>
        <img src={modalImage} alt="preview"
          className="max-w-full max-h-full rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()} />
      </div>
    )}

    {/* Main Chat Area */}
    <div className="flex-1 flex flex-col relative">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-[#D1A75D] bg-[#4B1F1F]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-[#D1A75D] text-[#4B1F1F] px-3 py-1 rounded hover:bg-[#b88b35] transition">
            {sidebarOpen ? "←" : "→"}
          </button>
          <h1 className="text-xl font-bold text-[#D1A75D]">Amber</h1>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-[#D1A75D] text-[#4B1F1F] px-4 py-2 rounded hover:bg-[#c49851] transition">
            ☰ Menu
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-[#3A1818] text-[#E7D8C1] border border-[#D1A75D] rounded shadow-md z-10">
              <button onClick={() => navigate("/settings")}
                className="w-full text-left px-4 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition">
                Settings
              </button>
              <button onClick={() => navigate("/subscriptions")}
                className="w-full text-left px-4 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition">
                Subscriptions
              </button>
              <button onClick={handleSignOut}
                className="w-full text-left px-4 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            {msg.text && (
              <div className={`max-w-3xl px-4 py-3 rounded-2xl shadow-lg ${
                msg.sender === "user"
                  ? "bg-[#D1A75D] text-[#4B1F1F] rounded-br-none"
                  : "bg-[#3A1A1A] text-[#E7D8C1] rounded-bl-none border border-[#D1A75D]/30"
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            )}
            {msg.image_url && (
              <div className={`mt-2 max-w-md ${msg.sender === "user" ? "ml-auto" : "mr-auto"}`}>
                <div className={`p-2 rounded-2xl shadow ${
                  msg.sender === "user" 
                    ? "bg-[#D1A75D]/20 border border-[#D1A75D]/30" 
                    : "bg-[#3A1A1A] border border-[#D1A75D]/30"
                }`}>
                  <img 
                    src={msg.image_url} 
                    alt="AI generated" 
                    className="rounded-lg max-h-80 object-contain cursor-pointer hover:opacity-90 transition"
                    onClick={() => setModalImage(msg.image_url || null)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {typing && (
          <div className="flex justify-start">
            <div className="bg-[#3A1A1A] text-[#E7D8C1] px-4 py-2 rounded-2xl rounded-bl-none border border-[#D1A75D]/30">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#D1A75D] animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-[#D1A75D] animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 rounded-full bg-[#D1A75D] animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend}
        className="flex items-center px-6 py-4 border-t border-[#D1A75D] bg-[#4B1F1F]">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about your wildest desires..."
          className="flex-1 px-4 py-2 rounded-lg border border-[#D1A75D] bg-[#3A1A1A] text-[#E7D8C1] placeholder-[#E7D8C1]/70 focus:outline-none focus:ring-2 focus:ring-[#D1A75D]"
          disabled={showUpgradePrompt}
        />
        <button
          type="submit"
          disabled={!message.trim() || typing || showUpgradePrompt}
          className="ml-4 px-4 py-2 bg-[#D1A75D] text-[#4B1F1F] rounded-lg hover:bg-[#c49851] disabled:opacity-50 transition">
          Send
        </button>
      </form>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-[#E7D8C1] mb-4">⏳ Your free chat time is up!</h2>
          <p className="text-[#E7D8C1] mb-6">Subscribe now to unlock unlimited time with Amber.</p>
          <button
            onClick={() => navigate("/subscriptions")}
            className="bg-[#D1A75D] text-[#4B1F1F] px-6 py-3 rounded-lg hover:bg-[#b88e4f] font-semibold transition">
            Go Premium
          </button>
        </div>
      )}
    </div>
  </div>
);
}