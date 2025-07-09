import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  image_url?: string;
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const DAILY_LIMIT_SECONDS = 40 * 60;

  // Scroll to latest message
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await apiFetch("/api/accounts/me/", { credentials: "include" });
        if (!u || !u.email) throw new Error();
        setUser({ id: u.id, is_premium: u.is_premium });
      } catch {
        navigate("/accounts/login");
      }
    };
    checkAuth();
  }, [navigate]);

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await apiFetch("/api/chat/history/", { credentials: "include" });
        const formatted: Message[] = data.messages.map((msg: any, index: number) => ({
          id: index + 1,
          text: msg.content,
          sender: msg.is_user ? "user" : "ai",
          image_url: msg.image_url || undefined,
        }));
        setMessages(formatted.length > 0
          ? formatted
          : [{ id: 1, text: "Hey there 👋 I'm Amber…", sender: "ai" }]
        );
        const imgs = formatted.filter((m) => m.image_url).map((m) => m.image_url!);
        setGalleryImages(imgs);
      } catch {
        setMessages([{ id: 1, text: "Hey there 👋 I'm Amber…", sender: "ai" }]);
      }
    };
    loadHistory();
  }, []);

  const handleSignOut = async () => {
    await apiFetch("/api/accounts/logout/", {
      method: "POST",
      credentials: "include",
    });
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
          body: JSON.stringify({
            user_id: user.id, // ✅ critical fix here
            prompt: message,
            history: updated.map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text,
            })),
          }),
        },
        true
      );

      const fullImageUrl = data.image_url && !data.image_url.startsWith("http")
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
          };
          setMessages((prev) => [...prev, aiReplyImage]);
          if (!galleryImages.includes(fullImageUrl)) {
            setGalleryImages((prev) => [...prev, fullImageUrl]);
          }
        }

        await apiFetch("/api/chat/submit/", {
          method: "POST",
          credentials: "include",
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
      {/* Sidebar Gallery */}
      <div className={`flex flex-col bg-[#3A1818] border-r border-[#D1A75D] transition-all duration-300 ease-in-out ${
        sidebarOpen ? "w-64 p-4" : "w-0 p-0"} overflow-y-auto`}>
        <h2 className="text-lg font-bold mb-4">Gallery</h2>
        <div className="grid grid-cols-2 gap-4 pr-2">
          {galleryImages.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Generated ${i}`}
              className="rounded shadow hover:scale-105 transition cursor-pointer"
              onClick={() => setModalImage(url)}
            />
          ))}
        </div>
      </div>

      {/* Modal Image Preview */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setModalImage(null)}>
          <img src={modalImage} alt="preview"
            className="max-w-full max-h-full rounded shadow"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Chat UI */}
      <div className="flex-1 flex flex-col relative">
        <header className="flex justify-between items-center px-6 py-4 border-b border-[#D1A75D] bg-[#4B1F1F]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-[#D1A75D] text-[#4B1F1F] px-3 py-1 rounded">
              {sidebarOpen ? "←" : "→"}
            </button>
            <h1 className="text-xl font-bold text-[#D1A75D]">Amber</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="bg-[#D1A75D] text-[#4B1F1F] px-4 py-2 rounded hover:bg-[#c49851]">
              ☰ Menu
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-[#3A1818] text-[#E7D8C1] border border-[#D1A75D] rounded shadow-md z-10">
                <button onClick={() => navigate("/settings")}
                  className="w-full text-left px-4 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F]">
                  Settings
                </button>
                <button onClick={() => navigate("/subscriptions")}
                  className="w-full text-left px-4 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F]">
                  Subscriptions
                </button>
                <button onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F]">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.text && (
                <div className={`max-w-xl px-4 py-3 text-sm shadow ${
                  msg.sender === "user"
                    ? "bg-[#E7D8C1] text-[#4B1F1F] ml-auto"
                    : "bg-[#D1A75D] text-[#4B1F1F]"
                } rounded-2xl`}>
                  <p>{msg.text}</p>
                </div>
              )}
              {msg.image_url && (
                <div className="max-w-xl p-2 bg-[#D1A75D] rounded-2xl shadow ml-2">
                  <img src={msg.image_url} alt="AI generated"
                    className="max-w-xs rounded-xl shadow" />
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="italic text-sm text-[#E7D8C1]">Amber is typing…</div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend}
          className="flex items-center px-6 py-4 border-t border-[#D1A75D] bg-[#4B1F1F]">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your wildest desires..."
            className="flex-1 px-4 py-2 rounded-lg border border-[#D1A75D] bg-[#4B1F1F] text-[#E7D8C1] placeholder-[#E7D8C1]"
            disabled={showUpgradePrompt}
          />
          <button
            type="submit"
            disabled={!message.trim() || typing || showUpgradePrompt}
            className="ml-4 px-4 py-2 bg-[#D1A75D] text-[#4B1F1F] rounded hover:bg-[#c49851] disabled:opacity-40">
            ➤
          </button>
        </form>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <div className="absolute inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-[#E7D8C1] mb-4">⏳ Your free chat time is up!</h2>
            <p className="text-[#E7D8C1] mb-6">Subscribe now to unlock unlimited time with Amber.</p>
            <button
              onClick={() => navigate("/subscriptions")}
              className="bg-[#D1A75D] text-[#4B1F1F] px-6 py-3 rounded-lg hover:bg-[#b88e4f] font-semibold">
              Go Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
