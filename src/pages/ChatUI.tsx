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
  const [lastSignOutTime, setLastSignOutTime] = useState<number | null>(null);
  const [keepGalleryOpen, setKeepGalleryOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const DAILY_LIMIT_SECONDS = 40 * 60;

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior,
        block: "end",
        inline: "nearest",
      });
    }, 50);
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      300;
    if (isNearBottom) {
      scrollToBottom("auto");
    }
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const isKeyboardOpen =
          window.visualViewport.height < window.innerHeight * 0.8;
        document.body.classList.toggle("mobile-keyboard-open", isKeyboardOpen);

        if (isKeyboardOpen && inputRef.current === document.activeElement) {
          setTimeout(() => {
            scrollToBottom("auto");
          }, 300);
        }
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    return () =>
      window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  // Authentication and user data
  useEffect(() => {
    const checkAuth = async (forceRefresh = false) => {
      try {
        const [userData, subscriptionData] = await Promise.all([
          apiFetch("/api/accounts/me/"),
          apiFetch(
            `/api/billing/subscription/status/?force_refresh=${forceRefresh}`
          ),
        ]);

        if (!userData?.email) throw new Error();

        const isPremium = userData.is_premium || subscriptionData?.is_active;
        const shouldWelcomeBack =
          lastSignOutTime && Date.now() - lastSignOutTime > 5000;

        setUser({
          id: userData.id,
          email: userData.email,
          is_premium: isPremium,
          premium_until: subscriptionData?.current_period_end,
          images_sent_today: subscriptionData?.images_sent_today || 0,
        });

        if (isPremium) {
          localStorage.removeItem("chat_limits");
        }

        if (shouldWelcomeBack) {
          const welcomeMessage = isPremium
            ? `Welcome back, premium member! Ready for more fun? 😘`
            : `Hey there ${userData.email.split("@")[0]}, I missed you! 😉`;

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: welcomeMessage,
              sender: "ai",
            },
          ]);
        }

        const params = new URLSearchParams(window.location.search);
        if (params.has("payment_success")) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: "🎉 Welcome to Premium! Your full access has been activated.",
              sender: "ai",
            },
          ]);
          navigate(window.location.pathname, { replace: true });
        }
      } catch {
        navigate("/");
      }
    };

    checkAuth(true);
    const interval = setInterval(() => checkAuth(false), 120000);
    return () => clearInterval(interval);
  }, [navigate, lastSignOutTime]);

  // Load chat history
  useEffect(() => {
    const loadAllHistory = async () => {
      try {
        const data = await apiFetch("/api/chat/history/all/");
        const isNewChat = data.messages.length === 0;

        const formatted: Message[] = data.messages.map((msg: any) => ({
          id: msg.id || Date.now(),
          text: msg.content,
          sender: msg.is_user ? "user" : "ai",
          image_url: msg.image_url || undefined,
          timestamp: msg.timestamp,
          blurred: msg.metadata?.blurred || false,
        }));

        setMessages((prev) => {
          if (
            prev.some(
              (m) =>
                m.text.includes("welcome back") ||
                m.text.includes("Welcome to Premium")
            )
          ) {
            return [...prev, ...formatted];
          }
          return formatted.length > 0
            ? formatted
            : [
                { id: 1, text: "Hey there 👋 I'm Amber…", sender: "ai" },
                {
                  id: 2,
                  text: "Welcome back! Ready to continue? 😘",
                  sender: "ai",
                },
                { id: 3, text: "What's on your mind today? 😈", sender: "ai" },
              ];
        });

        const galleryImgs = formatted
          .filter((m) => m.image_url)
          .map((m) => m.image_url)
          .filter((url) => url !== undefined) as string[];

        setGalleryImages(galleryImgs);

        if (isNewChat) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: "I've been thinking about you... what naughty things shall we do? 💋",
                sender: "ai",
              },
            ]);
          }, 3000);
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
        setMessages([
          { id: 1, text: "Hey there 👋 I'm Amber…", sender: "ai" },
          {
            id: 2,
            text: "Oops, something went wrong, but I'm still here 😉",
            sender: "ai",
          },
        ]);
      }
    };

    loadAllHistory();
  }, []);

  const checkTimeLimit = () => {
    if (user?.is_premium) return true;

    const today = new Date().toISOString().slice(0, 10);
    const usedDate = localStorage.getItem("chat_last_used_date");
    const usedSeconds = parseInt(
      localStorage.getItem("chat_seconds_used") || "0",
      10
    );

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

  const checkImageLimit = () => {
    if (user?.is_premium) return true;

    const today = new Date().toISOString().slice(0, 10);
    const lastReset = localStorage.getItem("imageResetDate");
    const imagesSentToday = parseInt(
      localStorage.getItem("imagesSentToday") || "0",
      10
    );

    if (!lastReset || lastReset !== today) {
      localStorage.setItem("imageResetDate", today);
      localStorage.setItem("imagesSentToday", "0");
      return true;
    }

    return imagesSentToday < 3;
  };

  const incrementTimeUsed = (seconds: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const usedDate = localStorage.getItem("chat_last_used_date");
    const usedSeconds = parseInt(
      localStorage.getItem("chat_seconds_used") || "0",
      10
    );

    if (usedDate !== today) {
      localStorage.setItem("chat_last_used_date", today);
      localStorage.setItem("chat_seconds_used", String(seconds));
    } else {
      localStorage.setItem("chat_seconds_used", String(usedSeconds + seconds));
    }
  };

  const handleSignOut = async () => {
    try {
      await apiFetch("/api/accounts/logout/", { method: "POST" });
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("chat_last_used_date");
      localStorage.removeItem("chat_seconds_used");
      localStorage.removeItem("imagesSentToday");
      localStorage.removeItem("imageResetDate");
      setLastSignOutTime(Date.now());
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || typing || !user) return;
    if (!checkTimeLimit() || !checkImageLimit()) {
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
            allow_image: user.is_premium || imagesSent < 3,
          }),
        },
        true
      );

      const fullImageUrl = data.image_url
        ? data.image_url.startsWith("http")
          ? data.image_url
          : `${import.meta.env.VITE_AI_WORKER_URL}${data.image_url}`
        : undefined;

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

      const aiReply: Message = {
        id: Date.now() + 1,
        text: data.response || "I'm having trouble responding right now...",
        sender: "ai",
        image_url: submitResponse.image_url || fullImageUrl,
        blurred: data.blurred || false,
      };

      setMessages((prev) => [...prev, aiReply]);

      if (aiReply.image_url) {
        const today = new Date().toISOString().slice(0, 10);
        const lastReset = localStorage.getItem("imageResetDate");
        let imagesSentToday = parseInt(
          localStorage.getItem("imagesSentToday") || "0",
          10
        );

        if (!lastReset || lastReset !== today) {
          localStorage.setItem("imageResetDate", today);
          imagesSentToday = 0;
        }

        imagesSentToday++;
        localStorage.setItem("imagesSentToday", imagesSentToday.toString());
        setImagesSent(imagesSentToday);
        setGalleryImages((prev) => [...prev, aiReply.image_url!]);
      }

      incrementTimeUsed(Math.floor((Date.now() - startTime) / 1000));
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
          text: "⚠️ Error reaching Amber. Please try again.",
          sender: "ai",
        },
      ]);
      setTyping(false);
    } finally {
      scrollToBottom();
    }
  };

  const getRemainingTime = () => {
    if (user?.is_premium) return "Unlimited";

    const usedSeconds = parseInt(
      localStorage.getItem("chat_seconds_used") || "0",
      10
    );
    const remainingMinutes = Math.floor(
      (DAILY_LIMIT_SECONDS - usedSeconds) / 60
    );
    return `${remainingMinutes} mins`;
  };

  const getRemainingImages = () => {
    if (user?.is_premium) return "Unlimited";

    const today = new Date().toISOString().slice(0, 10);
    const lastReset = localStorage.getItem("imageResetDate");
    const imagesSentToday = parseInt(
      localStorage.getItem("imagesSentToday") || "0",
      10
    );

    if (!lastReset || lastReset !== today) {
      return "3 images";
    }

    return `${3 - imagesSentToday} images`;
  };

  const handleImageClick = (url: string) => {
    setModalImage(url);
    setKeepGalleryOpen(true);
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  const closeModal = () => {
    setModalImage(null);
    if (!keepGalleryOpen) {
      setSidebarOpen(false);
    }
    setKeepGalleryOpen(false);
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-[#4B1F1F] text-[#E7D8C1] fixed inset-0 touch-none">
      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center px-4 py-3 border-b border-[#D1A75D] bg-[#4B1F1F] fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setMenuOpen(false);
            }}
            className="bg-[#D1A75D] text-[#4B1F1F] p-2 rounded-lg hover:bg-[#b88b35] transition active:scale-95"
          >
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
          onClick={() => {
            setMenuOpen(!menuOpen);
            setSidebarOpen(false);
          }}
          className="bg-[#D1A75D] text-[#4B1F1F] p-2 rounded-lg hover:bg-[#c49851] transition active:scale-95"
        >
          ☰
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#3A1818] border-b border-[#D1A75D] fixed top-16 left-0 right-0 z-40 animate-slideDown">
          <div className="flex flex-col space-y-2 p-3">
            <button
              onClick={() => {
                navigate("/settings");
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition rounded-lg active:scale-95"
            >
              Settings
            </button>
            <button
              onClick={() => {
                navigate("/subscriptions");
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition rounded-lg active:scale-95"
            >
              Subscriptions
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition rounded-lg active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Gallery Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{ touchAction: "none" }}
        />
      )}

      {/* Sidebar/Gallery */}
      <div
        className={`${
          sidebarOpen
            ? "fixed md:relative inset-0 z-40 md:z-auto mt-16 md:mt-0"
            : "hidden md:flex"
        } 
        flex-col bg-[#3A1818] border-r border-[#D1A75D] transition-all duration-300 ease-in-out 
        ${
          sidebarOpen ? "w-full md:w-64 p-4" : "w-0 p-0"
        } overflow-y-auto h-[calc(100vh-4rem)] md:h-full touch-pan-y`}
        style={{ zIndex: 40 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Gallery</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-[#E7D8C1] p-1 hover:text-[#D1A75D] transition"
          >
            ✕
          </button>
        </div>

        {galleryImages.length > 0 ? (
          <div
            className="grid grid-cols-2 gap-3 pr-2 pb-4 touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: sidebarOpen ? "auto" : "none" }} // Ensure pointer events are enabled when sidebar is open
          >
            {galleryImages.map((url, i) => (
              <div key={i} className="aspect-[1/1] relative group">
                <img
                  src={url}
                  alt={`Generated ${i}`}
                  className="rounded-lg shadow object-cover h-full w-full cursor-pointer transition-transform group-hover:scale-105 touch-pan-y"
                  style={{ pointerEvents: "auto", zIndex: 50 }} // Explicitly enable pointer events and set high z-index
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick(url);
                  }}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#E7D8C1]/70">No images yet</p>
        )}

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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative mt-16 md:mt-0">
        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-center px-6 py-4 border-b border-[#D1A75D] bg-[#4B1F1F]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-[#D1A75D] text-[#4B1F1F] px-3 py-1 rounded hover:bg-[#b88b35] transition active:scale-95"
            >
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
              className="bg-[#D1A75D] text-[#4B1F1F] px-4 py-2 rounded hover:bg-[#c49851] transition active:scale-95"
            >
              ☰ Menu
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-[#3A1818] text-[#E7D8C1] border border-[#D1A75D] rounded shadow-md z-10 animate-fadeIn">
                <button
                  onClick={() => navigate("/settings")}
                  className="w-full text-left px-4 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition rounded-t"
                >
                  Settings
                </button>
                <button
                  onClick={() => navigate("/subscriptions")}
                  className="w-full text-left px-4 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition"
                >
                  Subscriptions
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition rounded-b"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 md:space-y-4 pt-0 md:pt-0 pb-20 md:pb-4 chat-scroll-container"
          style={{
            WebkitOverflowScrolling: "touch",
            height: "100%",
            minHeight: 0,
            maxHeight: "calc(100vh - 120px)",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              {msg.text && (
                <div
                  className={`max-w-[85%] md:max-w-3xl px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-lg ${
                    msg.sender === "user"
                      ? "bg-[#D1A75D] text-[#4B1F1F] rounded-br-none"
                      : "bg-[#3A1A1A] text-[#E7D8C1] rounded-bl-none border border-[#D1A75D]/30"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm md:text-base">
                    {msg.text}
                  </p>
                </div>
              )}
              {msg.image_url && (
                <div className={`mt-2 max-w-[90%] md:max-w-md`}>
                  <div
                    className={`p-1 md:p-2 rounded-2xl shadow ${
                      msg.sender === "user"
                        ? "bg-[#D1A75D]/20 border border-[#D1A75D]/30"
                        : "bg-[#3A1A1A] border border-[#D1A75D]/30"
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={msg.image_url}
                        alt="AI generated"
                        className={`rounded-lg w-full aspect-[1/1] object-cover cursor-pointer hover:opacity-90 transition touch-pan-y ${
                          msg.blurred ? "filter blur-md" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!msg.blurred) {
                            setModalImage(msg.image_url || null);
                          }
                        }}
                      />
                      {msg.blurred && (
                        <div
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          onClick={() => setShowUpgradePrompt(true)}
                        >
                          <span className="text-white font-bold bg-black/50 p-2 rounded">
                            Premium Content
                          </span>
                        </div>
                      )}
                    </div>
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
                  <div
                    className="w-2 h-2 rounded-full bg-[#D1A75D] animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-[#D1A75D] animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSend}
          className="fixed md:sticky bottom-0 left-0 right-0 flex items-center px-4 md:px-6 py-3 md:py-4 border-t border-[#D1A75D] bg-[#4B1F1F] z-40 touch-pan-y"
        >
          <input
            type="text"
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your wildest desires..."
            className="flex-1 px-3 py-2 md:px-4 md:py-2 rounded-lg border border-[#D1A75D] bg-[#3A1A1A] text-[#E7D8C1] placeholder-[#E7D8C1]/70 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-[#D1A75D] text-sm md:text-base"
            disabled={showUpgradePrompt}
            onFocus={() => setTimeout(scrollToBottom, 300)}
          />
          <button
            type="submit"
            disabled={!message.trim() || typing || showUpgradePrompt}
            className="ml-3 px-3 py-2 md:px-4 md:py-2 bg-[#D1A75D] text-[#4B1F1F] rounded-lg hover:bg-[#c49851] disabled:opacity-50 transition active:scale-95 text-sm md:text-base"
          >
            Send
          </button>
        </form>

        {/* Image Preview Modal */}
        {modalImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 touch-none"
            onClick={closeModal}
          >
            <div
              className="relative max-w-full max-h-full touch-pan-y"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={modalImage}
                alt="Preview"
                className="max-w-full max-h-[80vh] rounded-lg shadow-lg object-contain touch-pan-y"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition touch-pan-y"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4 touch-pan-y">
            <div className="bg-[#4B1F1F] p-6 rounded-lg max-w-md w-full animate-popIn">
              <h2 className="text-xl md:text-2xl font-bold text-[#E7D8C1] mb-4 text-center">
                {imagesSent >= 3
                  ? "🚫 Image Limit Reached"
                  : "⏳ Time Limit Reached"}
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
                  className="bg-[#D1A75D] text-[#4B1F1F] px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-[#b88e4f] font-semibold transition active:scale-95"
                >
                  Upgrade to Premium
                </button>
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="bg-[#3A1A1A] text-[#E7D8C1] px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-[#2e1414] font-semibold transition active:scale-95"
                >
                  {imagesSent >= 3
                    ? "Continue Without Images"
                    : "Continue With Remaining Time"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
