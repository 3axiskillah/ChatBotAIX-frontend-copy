import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { loadStripe } from "@stripe/stripe-js";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  image_url?: string;
  timestamp?: string;
  blurred?: boolean;
  upsell?: boolean;
  serverMessageId?: number;
  locked?: boolean;
}

interface User {
  id: number;
  email: string;
  is_premium: boolean;
  premium_until?: string;
}

interface ApiChatResponse {
  response: string;
  image_url?: string;
  blurred?: boolean;
  upsell?: boolean;
  images_remaining?: number;
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

  const [timeCreditsSeconds, setTimeCreditsSeconds] = useState<number>(0);
  const [lastSignOutTime, setLastSignOutTime] = useState<number | null>(null);
  const [keepGalleryOpen, setKeepGalleryOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // no daily limit when using time credits

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior,
        block: "end",
        inline: "nearest",
      });
    }, 50);
  };

  // On initial mount, always scroll to bottom
  useEffect(() => {
    scrollToBottom("auto");
    // eslint-disable-next-line
  }, []);

  // On new messages, only scroll if user is already near the bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    // If user is near the bottom (within 300px), auto-scroll
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      300;
    if (isNearBottom) {
      scrollToBottom("auto");
    }
    // Otherwise, do nothing (user is reading old messages)
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
        const [userData, subscriptionData, credits] = await Promise.all([
          apiFetch("/api/accounts/me/"),
          apiFetch(
            `/api/billing/subscription/status/?force_refresh=${forceRefresh}`
          ),
          apiFetch("/api/billing/credits/status/"),
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
        });

        if (credits) {
          setTimeCreditsSeconds(credits.time_credits_seconds || 0);
        }

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
        } else if (params.get("unlock_success") === "true") {
          const messageId = params.get("message_id");
          if (messageId) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: "🖼️ Image unlocked! Enjoy your content.",
                sender: "ai",
              },
            ]);
            // Refresh the specific message to show unblurred image
            // The webhook should have already updated the message metadata
          }
          navigate(window.location.pathname, { replace: true });
        } else if (params.get("purchase") === "time_success") {
          try {
            const newCredits = await apiFetch("/api/billing/credits/status/");
            setTimeCreditsSeconds(newCredits.time_credits_seconds || 0);
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: "⏱️ Time credits added! Let's keep going.",
                sender: "ai",
              },
            ]);
          } catch {}
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
    if (timeCreditsSeconds > 0) return true;
    setShowUpgradePrompt(true);
    return false;
  };

  const checkImageLimit = () => {
    // Always allow generating a blurred preview; unblur requires payment
    return { canSend: true, shouldBlur: true };
  };

  const incrementTimeUsed = (seconds: number): void => {
    // Update local display only; authoritative usage is reported to backend
    setTimeCreditsSeconds((prev) => Math.max(0, prev - seconds));
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

    const timeAllowed = checkTimeLimit();
    const { canSend: imagesAllowed, shouldBlur } = checkImageLimit();

    if (!timeAllowed) {
      setShowUpgradePrompt(true);
      return;
    }

    // If image limit reached, allow chat but set allow_image to false
    let allowImage = imagesAllowed; // always true for preview
    let shouldBlurImage = shouldBlur; // blur if no credits

    const newMsg: Message = {
      id: Date.now(),
      text: message,
      sender: "user",
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setMessage("");
    setTyping(true);

    const startTime = Date.now(); // Make sure this is at the very start of the async operation

    try {
      const payload = {
        user_id: user.id,
        prompt: message,
        user_type: user.is_premium ? "premium" : "free",
        images_sent: 0,
        should_blur: shouldBlurImage,
        allow_image: allowImage,
        session_key: `u${user.id}`,
        history: updatedMessages.slice(-10).map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      };

      const data: ApiChatResponse = await apiFetch(
        "/chat/respond",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        true
      );

      const fullImageUrl = data.image_url
        ? data.image_url.startsWith("http")
          ? data.image_url
          : `${import.meta.env.VITE_AI_WORKER_URL}${data.image_url}`
        : undefined;

      // Calculate and increment time used right after successful response
      const processingTime = Math.floor((Date.now() - startTime) / 1000);
      // Report usage to backend (will deduct credits server-side).
      // Prefer server's remaining balance; fall back to local decrement on error
      try {
        const usage = await apiFetch("/api/billing/usage/report/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { seconds_used: processingTime },
        });
        if (usage && typeof usage.time_credits_seconds === "number") {
          setTimeCreditsSeconds(Math.max(0, usage.time_credits_seconds));
        } else {
          incrementTimeUsed(processingTime);
        }
      } catch {
        incrementTimeUsed(processingTime);
      }

      // Always blur images initially - user pays to unlock
      const willHaveImage = Boolean(fullImageUrl);

      const aiReply: Message = {
        id: Date.now() + 1,
        text: data.response || "I'm having trouble responding right now...",
        sender: "ai",
        image_url: willHaveImage ? fullImageUrl : undefined, // Store the real URL but it will be blurred
        blurred: willHaveImage ? true : false,
        locked: willHaveImage ? true : false,
        upsell: data.upsell,
      };

      setMessages((prev) => [...prev, aiReply]);

      // Rest of your code remains the same...
      const submitRes = await apiFetch("/api/chat/submit/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: message,
          reply: aiReply.text,
          image_url: fullImageUrl || null,
          blurred: willHaveImage ? true : false,
        }),
      });

      // Attach server message id for future unlock
      const serverMessageId = submitRes?.message_id as number | undefined;
      if (serverMessageId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiReply.id ? { ...m, serverMessageId } : m))
        );
      }

      // Do not push to gallery until unlocked

      if (data.upsell) {
        setShowUpgradePrompt(true);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "Sorry, I'm having trouble connecting. Please try again later.",
          sender: "ai",
        },
      ]);
    } finally {
      setTyping(false);
      scrollToBottom();
    }
  };

  const getRemainingTime = () => {
    if (user?.is_premium) return "Unlimited";
    const remainingMinutes = Math.floor(timeCreditsSeconds / 60);
    return `${remainingMinutes} mins`;
  };

  const getRemainingImages = () => {
    return "$4.99 per image unlock";
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

  const handleBuyTime = async (tier: string) => {
    try {
      setCheckoutLoading(true);
      const stripe = await loadStripe(
        "pk_live_51QbghtDGzHpWMy7sKMwPXAnv82i3nRvMqejIiNy2WNnXmlyLZ5pAcmykuB7hWO8WwpS9nT1hpeuvvWQdRyUpg2or00x6xR1JgX"
      );
      const { sessionId } = await apiFetch(
        "/api/billing/create-checkout-session/time/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { tier },
        }
      );
      const { error } = await stripe!.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Payment failed. Please try again.",
          sender: "ai",
        },
      ]);
    } finally {
      setCheckoutLoading(false);
    }
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
                navigate("/addons");
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition rounded-lg active:scale-95"
            >
              Add-ons
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
            style={{ pointerEvents: "auto" }}
          >
            {galleryImages.map((url, i) => (
              <div key={i} className="aspect-[1/1] relative group">
                <button
                  type="button"
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "block",
                    width: "100%",
                    height: "100%",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick(url);
                  }}
                >
                  <img
                    src={url}
                    alt={`Generated ${i}`}
                    className="rounded-lg shadow object-cover h-full w-full transition-transform group-hover:scale-105 touch-pan-y"
                    style={{ pointerEvents: "auto", zIndex: 50 }}
                  />
                </button>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
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
              <span
                className={
                  timeCreditsSeconds < 300 ? "text-red-400 font-bold" : ""
                }
              >
                {getRemainingTime()}
              </span>
            </div>
            <div className="flex justify-between mb-3">
              <span>Images:</span>
              <span className="text-[#D1A75D]">$4.99 each when unlocked</span>
            </div>

            {/* Show time purchase buttons when time is low or always show them */}
            <div className="space-y-2">
              <div className="text-xs text-[#E7D8C1]/70 mb-2">
                {timeCreditsSeconds < 300
                  ? "⚠️ Time running low!"
                  : "Add more time:"}
              </div>
              <button
                disabled={checkoutLoading}
                onClick={() => handleBuyTime("10_min")}
                className="w-full px-2 py-1 bg-[#D1A75D] text-[#4B1F1F] rounded text-xs hover:bg-[#b88b35] disabled:opacity-50 font-medium"
              >
                Add 10 min ($9.99)
              </button>
              <button
                disabled={checkoutLoading}
                onClick={() => handleBuyTime("30_min")}
                className="w-full px-2 py-1 bg-[#D1A75D] text-[#4B1F1F] rounded text-xs hover:bg-[#b88b35] disabled:opacity-50 font-medium"
              >
                Add 30 min ($19.99)
              </button>
              <button
                disabled={checkoutLoading}
                onClick={() => handleBuyTime("60_min")}
                className="w-full px-2 py-1 bg-[#D1A75D] text-[#4B1F1F] rounded text-xs hover:bg-[#b88b35] disabled:opacity-50 font-medium"
              >
                Add 60 min ($29.99)
              </button>
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
                  onClick={() => navigate("/addons")}
                  className="w-full text-left px-4 py-2 hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition"
                >
                  Add-ons
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
                        <button
                          type="button"
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          style={{
                            background: "rgba(0,0,0,0.5)",
                            border: "none",
                            width: "100%",
                            height: "100%",
                            padding: 0,
                          }}
                          onClick={async () => {
                            if (!msg.serverMessageId) {
                              setShowUpgradePrompt(true);
                              return;
                            }
                            try {
                              const res = await apiFetch(
                                `/api/chat/messages/${msg.serverMessageId}/unlock_image/`,
                                { method: "POST" }
                              );
                              if (res?.ok && res.image_url) {
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === msg.id
                                      ? {
                                          ...m,
                                          image_url: res.image_url,
                                          blurred: false,
                                          locked: false,
                                        }
                                      : m
                                  )
                                );
                              } else if (res?.checkout_url) {
                                // Redirect to Stripe checkout for payment
                                window.location.href = res.checkout_url;
                              } else if (res?.error === "NO_CREDITS") {
                                setShowUpgradePrompt(true);
                              }
                            } catch {
                              setShowUpgradePrompt(true);
                            }
                          }}
                        >
                          <span className="text-white font-bold bg-black/50 p-2 rounded">
                            🔒 Pay $4.99 to Unlock
                          </span>
                        </button>
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
                ⏳ Add Time Credits
              </h2>
              <p className="text-[#E7D8C1] mb-6 text-center">
                You're out of time credits. Purchase more to continue chatting.
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    navigate("/addons");
                    setShowUpgradePrompt(false);
                  }}
                  className="bg-[#D1A75D] text-[#4B1F1F] px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-[#b88e4f] font-semibold transition active:scale-95"
                >
                  Buy Time Credits
                </button>
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="bg-[#3A1A1A] text-[#E7D8C1] px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-[#2e1414] font-semibold transition active:scale-95"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
