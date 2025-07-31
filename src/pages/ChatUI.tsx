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

interface User {
  id: number;
  email: string;
  is_premium: boolean;
  premium_until?: string;
  images_sent_today?: number;
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
  const [user, setUser] = useState<User | null>(null);
  const [imagesSent, setImagesSent] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const DAILY_LIMIT_SECONDS = 40 * 60; // 40 minutes

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Check authentication and load user data
  useEffect(() => {
    const checkAuth = async (forceRefresh = false) => {
      try {
        const [userData, subscriptionData] = await Promise.all([
          apiFetch("/api/accounts/me/"),
          apiFetch(`/api/billing/subscription/status/?force_refresh=${forceRefresh}`)
        ]);

        if (!userData?.email) throw new Error();
        
        // Trust backend's premium status completely
        const isPremium = userData.is_premium || subscriptionData?.is_active;
        
        setUser({ 
          id: userData.id, 
          email: userData.email,
          is_premium: isPremium,
          premium_until: subscriptionData?.current_period_end,
          images_sent_today: subscriptionData?.images_sent_today || 0
        });

        // Clear limits if premium
        if (isPremium) {
          localStorage.removeItem('chat_limits');
        }

        // Handle post-payment redirect
        const params = new URLSearchParams(window.location.search);
        if (params.has('payment_success')) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: "🎉 Welcome to Premium! Your full access has been activated.",
            sender: "ai"
          }]);
          navigate(window.location.pathname, { replace: true });
        }

      } catch {
        navigate("/");
      }
    };
    
    // Initial check
    checkAuth(true);
    
    // Periodic checks
    const interval = setInterval(() => checkAuth(false), 120000);
    return () => clearInterval(interval);
  }, [navigate]);


  // Load chat history
  useEffect(() => {
    const loadAllHistory = async () => {
      try {
        const data = await apiFetch("/api/chat/history/all/");
        const isNewChat = data.messages.length === 0;
        
        // Format existing messages
        const formatted: Message[] = data.messages.map((msg: any) => ({
          id: msg.id || Date.now(),
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
                { id: 1, text: "Hey there 👋 I'm Amber…", sender: "ai" },
                { id: 2, text: "Welcome back, sexy! Ready to pick up where we left off? 😘", sender: "ai" },
                { id: 3, text: "Tell me what's on your mind... or should I guess? 😈", sender: "ai" }
              ]
        );

        // Load gallery images
        const galleryImgs = formatted
          .filter(m => m.image_url)
          .map(m => m.image_url)
          .filter(url => url !== undefined) as string[];
        
        setGalleryImages(galleryImgs);

        // If new chat, add delayed message
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
          { id: 1, text: "Hey there 👋 I'm Amber…", sender: "ai" },
          { id: 2, text: "Mmm... something went wrong, but I'm still here for you 😉", sender: "ai" }
        ]);
      }
    };

    loadAllHistory();
  }, []);

  // Check daily time limit
  const checkTimeLimit = () => {
    if (user?.is_premium) return true;

    const today = new Date().toISOString().slice(0, 10);
    const usedDate = localStorage.getItem("chat_last_used_date");
    const usedSeconds = parseInt(localStorage.getItem("chat_seconds_used") || "0", 10);

    if (usedDate !== today) {
      localStorage.setItem("chat_last_used_date", today);
      localStorage.setItem("chat_seconds_used", "0");
      return true;
    }

    if (usedSeconds >= DAILY_LIMIT_SECONDS) {
      setShowUpgradePrompt(true);
      return false;
    }

    return true;
  };

  // Check daily image limit
  const checkImageLimit = () => {
    if (user?.is_premium) return true;
    
    const today = new Date().toISOString().slice(0, 10);
    const lastReset = localStorage.getItem('imageResetDate');
    const imagesSentToday = parseInt(localStorage.getItem('imagesSentToday') || '0', 10);
    
    // Reset counter if it's a new day
    if (!lastReset || lastReset !== today) {
      localStorage.setItem('imageResetDate', today);
      localStorage.setItem('imagesSentToday', '0');
      return true;
    }
    
    return imagesSentToday < 3; // Free users get 3 images/day
  };

  // Increment time used
  const incrementTimeUsed = (seconds: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const usedDate = localStorage.getItem("chat_last_used_date");
    const usedSeconds = parseInt(localStorage.getItem("chat_seconds_used") || "0", 10);

    if (usedDate !== today) {
      localStorage.setItem("chat_last_used_date", today);
      localStorage.setItem("chat_seconds_used", String(seconds));
    } else {
      localStorage.setItem("chat_seconds_used", String(usedSeconds + seconds));
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await apiFetch("/api/accounts/logout/", { method: "POST" });
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("chat_last_used_date");
    localStorage.removeItem("chat_seconds_used");
    localStorage.removeItem("imagesSentToday");
    localStorage.removeItem("imageResetDate");
    navigate("/");
  };

  // Handle sending messages
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check limits
    if (!message.trim() || typing || !user) return;
    if (!checkTimeLimit()) {
      setShowUpgradePrompt(true);
      return;
    }
    if (!checkImageLimit()) {
      setShowUpgradePrompt(true);
      return;
    }

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
          should_blur: imagesSent >= (user.is_premium ? 999 : 3),
          allow_image: user.is_premium || imagesSent < 3
        }),
      },
      true
    );

      const fullImageUrl = data.image_url 
        ? data.image_url.startsWith("http") 
          ? data.image_url 
          : `${import.meta.env.VITE_AI_WORKER_URL}${data.image_url}`
        : undefined;

      // Submit to backend
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

      // Create AI message
      const permanentImageUrl = submitResponse.image_url || fullImageUrl;
      const aiReply: Message = {
        id: Date.now() + 1,
        text: data.response || "No response.",
        sender: "ai",
        image_url: permanentImageUrl,
        blurred: data.blurred || false,
      };

      setMessages((prev) => [...prev, aiReply]);
      
      // Update image counters if image was generated
      if (permanentImageUrl) {
        const today = new Date().toISOString().slice(0, 10);
        const lastReset = localStorage.getItem('imageResetDate');
        let imagesSentToday = parseInt(localStorage.getItem('imagesSentToday') || '0', 10);
        
        if (!lastReset || lastReset !== today) {
          localStorage.setItem('imageResetDate', today);
          imagesSentToday = 0;
        }
        
        imagesSentToday++;
        localStorage.setItem('imagesSentToday', imagesSentToday.toString());
        setImagesSent(imagesSentToday);
        setGalleryImages(prev => [...prev, permanentImageUrl]);
      }

      // Update time used
      const durationSec = Math.floor((Date.now() - startTime) / 1000);
      incrementTimeUsed(durationSec);
      setTyping(false);

      // Show upsell if needed
      if (data.upsell) {
        setShowUpgradePrompt(true);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 3, text: "⚠️ Error reaching Amber.", sender: "ai" },
      ]);
      setTyping(false);
    }
  };

  // Calculate remaining time
  const getRemainingTime = () => {
    if (user?.is_premium) return "Unlimited";
    
    const usedSeconds = parseInt(localStorage.getItem("chat_seconds_used") || "0", 10);
    const remainingMinutes = Math.floor((DAILY_LIMIT_SECONDS - usedSeconds) / 60);
    return `${remainingMinutes} mins`;
  };

  // Calculate remaining images
  const getRemainingImages = () => {
    if (user?.is_premium) return "Unlimited";
    
    const today = new Date().toISOString().slice(0, 10);
    const lastReset = localStorage.getItem('imageResetDate');
    const imagesSentToday = parseInt(localStorage.getItem('imagesSentToday') || '0', 10);
    
    if (!lastReset || lastReset !== today) {
      return "3 images";
    }
    
    return `${3 - imagesSentToday} images`;
  };

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row bg-[#4B1F1F] text-[#E7D8C1] overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center px-4 py-3 border-b border-[#D1A75D] bg-[#4B1F1F] fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSidebarOpen(!sidebarOpen); setMenuOpen(false); }}
            className="bg-[#D1A75D] text-[#4B1F1F] p-2 rounded hover:bg-[#b88b35] transition">
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <div className="flex items-center gap-2">
            {user?.is_premium && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                PREMIUM
              </span>
            )}
            <h1 className="text-lg font-bold text-[#D1A75D]">Amber</h1>
          </div>
        </div>
        <button
          onClick={() => { setMenuOpen(!menuOpen); setSidebarOpen(false); }}
          className="bg-[#D1A75D] text-[#4B1F1F] p-2 rounded hover:bg-[#c49851] transition">
          ☰
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#3A1818] border-b border-[#D1A75D] fixed top-16 left-0 right-0 z-40">
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

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'fixed md:relative inset-0 z-40 md:z-auto mt-16 md:mt-0' : 'hidden md:flex'} 
        flex-col bg-[#3A1818] border-r border-[#D1A75D] transition-all duration-300 ease-in-out 
        ${sidebarOpen ? "w-full md:w-64 p-4" : "w-0 p-0"} overflow-y-auto h-[calc(100vh-4rem)] md:h-full`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Gallery</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-[#E7D8C1] p-1">
            ✕
          </button>
        </div>
        
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 pr-2 pb-4">
            {galleryImages.map((url, i) => (
              <div key={i} className="aspect-[1/1] relative">
                <img
                  src={url}
                  alt={`Generated ${i}`}
                  className="rounded-lg shadow object-cover h-full w-full cursor-pointer"
                  onClick={() => {
                    setModalImage(url);
                    setSidebarOpen(false);
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#E7D8C1]/70">No images yet</p>
        )}

        {/* Free user limits */}
        {!user?.is_premium && (
          <div className="mt-4 p-3 bg-[#4B1F1F]/50 rounded-lg text-sm">
            <div className="flex justify-between mb-1">
              <span>Time left:</span>
              <span>{getRemainingTime()}</span>
            </div>
            <div className="flex justify-between">
              <span>Images left:</span>
              <span>{getRemainingImages()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setModalImage(null)}>
          <div className="relative max-w-full max-h-full">
            <img src={modalImage} alt="preview"
              className="max-w-full max-h-[80vh] rounded-lg shadow-lg object-contain"
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
      <div className="flex-1 flex flex-col relative mt-16 md:mt-0">
        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-center px-6 py-4 border-b border-[#D1A75D] bg-[#4B1F1F]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-[#D1A75D] text-[#4B1F1F] px-3 py-1 rounded hover:bg-[#b88b35] transition">
              {sidebarOpen ? "←" : "→"}
            </button>
            <div className="flex items-center gap-2">
              {user?.is_premium && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  PREMIUM
                </span>
              )}
              <h1 className="text-xl font-bold text-[#D1A75D]">Amber</h1>
            </div>
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
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 md:space-y-4 pt-0 md:pt-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
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
                <div className={`mt-2 max-w-[90%] md:max-w-md`}>
                  <div className={`p-1 md:p-2 rounded-2xl shadow ${
                    msg.sender === "user" 
                      ? "bg-[#D1A75D]/20 border border-[#D1A75D]/30" 
                      : "bg-[#3A1A1A] border border-[#D1A75D]/30"
                  }`}>
                    <img 
                      src={msg.image_url} 
                      alt="AI generated" 
                      className={`rounded-lg w-full aspect-[1/1] object-cover cursor-pointer hover:opacity-90 transition ${
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
          className="flex items-center px-4 md:px-6 py-3 md:py-4 border-t border-[#D1A75D] bg-[#4B1F1F] sticky bottom-0">
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
          <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center p-4">
            <div className="bg-[#4B1F1F] p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl md:text-2xl font-bold text-[#E7D8C1] mb-4 text-center">
                {imagesSent >= 3 ? "🚫 Image Limit Reached" : "⏳ Time Limit Reached"}
              </h2>
              <p className="text-[#E7D8C1] mb-6 text-center">
                {imagesSent >= 3 
                  ? "Free users get 3 images per day. Upgrade for unlimited access!"
                  : "Free users get 40 minutes per day. Upgrade for unlimited chat!"}
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    navigate("/subscriptions");
                    setShowUpgradePrompt(false);
                  }}
                  className="bg-[#D1A75D] text-[#4B1F1F] px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-[#b88e4f] font-semibold transition">
                  Upgrade to Premium
                </button>
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="bg-[#3A1A1A] text-[#E7D8C1] px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-[#2e1414] font-semibold transition">
                  {imagesSent >= 3 ? "Continue Without Images" : "Continue With Remaining Time"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}