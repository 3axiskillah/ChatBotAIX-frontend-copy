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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        
        // Check if we need to migrate anonymous chat
        if (sessionStorage.getItem("anon_migration_needed")) {
          try {
            const anonId = localStorage.getItem("anon_id");
            const chatHistory = sessionStorage.getItem("anon_chat");
            
            if (anonId || chatHistory) {
              await apiFetch("/api/chat/migrate/", {
                method: "POST",
                body: {
                  anon_id: anonId,
                  chat_history: chatHistory ? JSON.parse(chatHistory) : null
                }
              });
              
              // Clear migration flags
              localStorage.removeItem("anon_id");
              sessionStorage.removeItem("anon_chat");
              sessionStorage.removeItem("anon_migration_needed");
            }
          } catch (migrateErr) {
            console.error("Migration error:", migrateErr);
          }
        }
      } catch {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

useEffect(() => {
  const loadAllHistory = async () => {
    try {
      const data = await apiFetch("/api/chat/history/all/");
      
      // Check if this is a new chat (no history)
      const isNewChat = data.messages.length === 0;
      
      // Format existing messages if any
      const formatted: Message[] = data.messages.map((msg: any) => ({
        id: msg.id || Date.now(), // Use backend ID if available, otherwise generate one
        text: msg.content,
        sender: msg.is_user ? "user" : "ai",
        image_url: msg.image_url || undefined,
        timestamp: msg.timestamp,
        blurred: msg.metadata?.blurred || false
      }));

      // Set messages - either existing history or initial welcome
      setMessages(
        formatted.length > 0
          ? formatted
          : [
              { 
                id: 1, 
                text: "Hey there 👋 I'm Amber…", 
                sender: "ai" 
              },
              { 
                id: 2,
                text: "Welcome back, sexy! Ready to pick up where we left off? 😘",
                sender: "ai"
              },
              {
                id: 3,
                text: "Tell me what's on your mind... or should I guess? 😈",
                sender: "ai"
              }
            ]
      );

      // Load gallery images from history
      const galleryImgs = formatted
        .filter(m => m.image_url)
        .map(m => m.image_url)
        .filter(url => url !== undefined) as string[];
      
      setGalleryImages(galleryImgs);
      setImagesSent(galleryImgs.length);

      // If new chat, add a delayed seductive message
      if (isNewChat) {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              text: "I've been thinking about you... wondering what naughty things we'll do today 💋",
              sender: "ai"
            }
          ]);
        }, 3000);
      }

    } catch (err) {
      console.error("Error loading chat history:", err);
      setMessages([
        { 
          id: 1, 
          text: "Hey there 👋 I'm Amber…", 
          sender: "ai" 
        },
        {
          id: 2,
          text: "Mmm... something went wrong, but I'm still here for you 😉",
          sender: "ai"
        }
      ]);
    }
  };

  loadAllHistory();
}, []);

// Helper functions
  const handleSignOut = async () => {
    await apiFetch("/api/accounts/logout/", { method: "POST" });
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("chat_last_used_date");
    localStorage.removeItem("chat_seconds_used");
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
      // Get AI response
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

      const fullImageUrl = data.image_url 
        ? data.image_url.startsWith("http") 
          ? data.image_url 
          : `${import.meta.env.VITE_AI_WORKER_URL}${data.image_url}`
        : undefined;

      // First submit to backend to get permanent image URL
      const submitResponse = await apiFetch("/api/chat/submit/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: message,
          reply: data.response,
          image_url: fullImageUrl || null,
          blurred: data.blurred || false,
        }),
      });

      // Now use the backend's permanent image URL
      const permanentImageUrl = submitResponse.image_url || fullImageUrl;

      // Create AI message with permanent URL
      const aiReply: Message = {
        id: Date.now() + 1,
        text: data.response || "No response.",
        sender: "ai",
        image_url: permanentImageUrl,
        blurred: data.blurred || false,
      };

      setMessages((prev) => [...prev, aiReply]);
      
      // Add to gallery if image exists
      if (permanentImageUrl) {
        setGalleryImages(prev => [...prev, permanentImageUrl]);
        setImagesSent(prev => prev + 1);
      }

      const durationSec = Math.floor((Date.now() - startTime) / 1000);
      incrementTimeUsed(durationSec);
      setTyping(false);

      if (data.upsell) {
        setShowUpgradePrompt(true);
      }
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
    <div className="w-screen h-screen flex flex-col md:flex-row bg-[#4B1F1F] text-[#E7D8C1] overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center px-4 py-3 border-b border-[#D1A75D] bg-[#4B1F1F]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-[#D1A75D] text-[#4B1F1F] p-2 rounded hover:bg-[#b88b35] transition">
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <h1 className="text-lg font-bold text-[#D1A75D]">Amber</h1>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="bg-[#D1A75D] text-[#4B1F1F] p-2 rounded hover:bg-[#c49851] transition">
          ☰
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#3A1818] border-b border-[#D1A75D]">
          <div className="flex flex-col space-y-2 p-3">
            <button onClick={() => navigate("/settings")}
              className="w-full text-left px-3 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition rounded">
              Settings
            </button>
            <button onClick={() => navigate("/subscriptions")}
              className="w-full text-left px-3 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition rounded">
              Subscriptions
            </button>
            <button onClick={handleSignOut}
              className="w-full text-left px-3 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition rounded">
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Sidebar - Mobile optimized */}
      <div className={`${sidebarOpen ? 'fixed md:relative inset-0 z-40 md:z-auto' : 'hidden md:flex'} 
        flex-col bg-[#3A1818] border-r border-[#D1A75D] transition-all duration-300 ease-in-out 
        ${sidebarOpen ? "w-full md:w-64 p-4" : "w-0 p-0"} overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Gallery</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-[#E7D8C1] p-1">
            ✕
          </button>
        </div>
        
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-2">
            {galleryImages.map((url, i) => (
              <div key={i} className="aspect-square relative group">
                <img
                  src={url}
                  alt={`Generated ${i}`}
                  className="rounded-lg shadow hover:scale-105 transition cursor-pointer object-cover h-full w-full"
                  onClick={() => {
                    setModalImage(url);
                    setSidebarOpen(false);
                  }}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">View</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#E7D8C1]/70">No images yet</p>
        )}
      </div>

      {/* Image Preview Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setModalImage(null)}>
          <div className="relative max-w-full max-h-full">
            <img src={modalImage} alt="preview"
              className="max-w-full max-h-[80vh] rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()} />
            <button 
              onClick={() => setModalImage(null)}
              className="absolute -top-10 right-0 text-white text-2xl p-1">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-center px-6 py-4 border-b border-[#D1A75D] bg-[#4B1F1F]">
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
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 md:space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              {msg.text && (
                <div className={`max-w-[85%] md:max-w-3xl px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-lg ${
                  msg.sender === "user"
                    ? "bg-[#D1A75D] text-[#4B1F1F] rounded-br-none"
                    : "bg-[#3A1A1A] text-[#E7D8C1] rounded-bl-none border border-[#D1A75D]/30"
                }`}>
                  <p className="whitespace-pre-wrap text-sm md:text-base">{msg.text}</p>
                </div>
              )}
              {msg.image_url && (
                <div className={`mt-2 max-w-[90%] md:max-w-md ${msg.sender === "user" ? "ml-auto" : "mr-auto"}`}>
                  <div className={`p-1 md:p-2 rounded-2xl shadow ${
                    msg.sender === "user" 
                      ? "bg-[#D1A75D]/20 border border-[#D1A75D]/30" 
                      : "bg-[#3A1A1A] border border-[#D1A75D]/30"
                  }`}>
                    <img 
                      src={msg.image_url} 
                      alt="AI generated" 
                      className={`rounded-lg max-h-64 md:max-h-80 object-contain cursor-pointer hover:opacity-90 transition ${
                        msg.blurred ? 'filter blur-md' : ''
                      }`}
                      onClick={() => !msg.blurred && setModalImage(msg.image_url || null)}
                    />
                    {msg.blurred && (
                      <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
                        <span className="text-white font-bold bg-black/50 p-2 rounded">
                          Premium Content
                        </span>
                      </div>
                    )}
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
          className="flex items-center px-4 md:px-6 py-3 md:py-4 border-t border-[#D1A75D] bg-[#4B1F1F]">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your wildest desires..."
            className="flex-1 px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[#D1A75D] bg-[#3A1A1A] text-[#E7D8C1] placeholder-[#E7D8C1]/70 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-[#D1A75D] text-sm md:text-base"
            disabled={showUpgradePrompt}
          />
          <button
            type="submit"
            disabled={!message.trim() || typing || showUpgradePrompt}
            className="ml-3 px-3 py-2 md:px-4 md:py-2 bg-[#D1A75D] text-[#4B1F1F] rounded-lg hover:bg-[#c49851] disabled:opacity-50 transition text-sm md:text-base">
            Send
          </button>
        </form>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <div className="absolute inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center p-4">
            <h2 className="text-xl md:text-2xl font-bold text-[#E7D8C1] mb-4 text-center">⏳ Your free chat time is up!</h2>
            <p className="text-[#E7D8C1] mb-6 text-center">Subscribe now to unlock unlimited time with Amber.</p>
            <button
              onClick={() => navigate("/subscriptions")}
              className="bg-[#D1A75D] text-[#4B1F1F] px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-[#b88e4f] font-semibold transition">
              Go Premium
            </button>
          </div>
        )}
      </div>
    </div>
  );
}