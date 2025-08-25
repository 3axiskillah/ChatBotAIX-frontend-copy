import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { loadStripe } from "@stripe/stripe-js";
import { validateChatMessage, sanitizeInput } from "../utils/security";
import { toast } from "react-toastify";

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
  has_image?: boolean;
}

interface User {
  id: number;
  email: string;
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
  const [displayTime, setDisplayTime] = useState<number>(0);
  const [lastSignOutTime, setLastSignOutTime] = useState<number | null>(null);
  const [hasShownWelcome, setHasShownWelcome] = useState<boolean>(false);
  const [keepGalleryOpen, setKeepGalleryOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const authIntervalRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<number | null>(null);
  const navigate = useNavigate();

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
    setTimeout(() => {
      scrollToBottom("auto");
    }, 100);
  }, []);

  // Professional mobile keyboard handling
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

  // On new messages, only scroll if user is already near the bottom
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

  // Authentication and user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [userData, credits] = await Promise.all([
          apiFetch("/api/accounts/me/"),
          apiFetch("/api/billing/credits/status/"),
        ]);

        if (!userData?.email) throw new Error();

        // Check if this is a fresh login or welcome back
        const isFreshLogin = !lastSignOutTime && !hasShownWelcome;
        const shouldWelcomeBack =
          lastSignOutTime && Date.now() - lastSignOutTime > 5000;

        setUser({
          id: userData.id,
          email: userData.email,
        });

        if (credits) {
          const currentCredits = credits.time_credits_seconds || 0;

          // Always use the backend time as the source of truth
          setTimeCreditsSeconds(currentCredits);
          setDisplayTime(currentCredits);
        }

        // Show welcome message - prioritize fresh login over welcome back
        // Only show welcome if there are no existing messages
        if (isFreshLogin && messages.length === 0) {
          setHasShownWelcome(true);
          toast.success("Welcome to Amber!");

          const freshLoginResponses = [
            "Hey baby, I'm Amber - your personal cum dumpster. What's your name?",
            "Hi there sexy, I'm Amber and I'm all yours. What should I call you?",
            "Hey daddy, I'm Amber and I can't wait to get dirty with you. What's your name?",
            "Hi baby, I'm Amber and I'm already wet thinking about you. What do I call you?",
            "Hey there, I'm Amber and I want to know everything about you. What's your name?",
          ];

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: freshLoginResponses[
                Math.floor(Math.random() * freshLoginResponses.length)
              ],
              sender: "ai",
            },
          ]);

          setTimeout(() => {
            scrollToBottom("auto");
          }, 100);
          navigate(window.location.pathname, { replace: true });
        } else if (shouldWelcomeBack && messages.length === 0) {
          toast.success("Welcome back!");

          const welcomeBackResponses = [
            "Welcome back baby, I missed you",
            "Daddy is back... I'm here waiting for you",
            "Mmm I've been thinking about you... welcome back baby",
            "Oh yes, my favorite is back... I've been so lonely",
            "Welcome back daddy, I've been craving you",
            "Mmm baby, I missed your dirty talk... welcome back",
            "Oh daddy, I'm so happy you're back... I've been waiting",
            "Welcome back baby, I've been so wet thinking about you",
          ];

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: welcomeBackResponses[
                Math.floor(Math.random() * welcomeBackResponses.length)
              ],
              sender: "ai",
            },
          ]);

          setTimeout(() => {
            scrollToBottom("auto");
          }, 100);
          navigate(window.location.pathname, { replace: true });
        }

        // Handle payment success parameters
        const params = new URLSearchParams(window.location.search);
        if (params.has("payment_success")) {
          // Refresh time credits after payment
          try {
            const currentCredits = await apiFetch(
              "/api/billing/credits/status/"
            );
            if (
              currentCredits &&
              typeof currentCredits.time_credits_seconds === "number"
            ) {
              setTimeCreditsSeconds(currentCredits.time_credits_seconds);
              setDisplayTime(currentCredits.time_credits_seconds);
            }
          } catch (error) {
            console.error("Failed to refresh credits after payment:", error);
          }

          // Show toast notification instead of system message
          toast.success("Time credits added successfully!");

          // Add Amber's natural response
          const timeResponses = [
            "Mmm, now we have more time to play... I'm so wet for you",
            "Oh baby, thank you for wanting to spend more time with me",
            "I'm so excited we have more time together... I've been thinking about you",
            "Mmm daddy, now we can really get naughty... I'm dripping for you",
            "Thank you baby, I love spending time with you... let's make it count",
            "Oh yes, more time to explore every inch of me... I'm all yours",
            "Mmm I'm so happy you want more of me... I'm getting so wet",
            "Baby, I can't wait to spend this time with you... I'm craving you",
          ];

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: timeResponses[
                Math.floor(Math.random() * timeResponses.length)
              ],
              sender: "ai",
            },
          ]);
          setTimeout(() => {
            scrollToBottom("auto");
          }, 100);
          navigate(window.location.pathname, { replace: true });
        } else if (params.get("unlock_success") === "true") {
          const messageId = params.get("message_id");
          if (messageId) {
            try {
              setMessages((prev) => {
                const unlockedMessage = prev.find(
                  (m) => m.serverMessageId === parseInt(messageId)
                );
                if (unlockedMessage && unlockedMessage.image_url) {
                  // Check if image is already in gallery to prevent duplication
                  setGalleryImages((gallery) => {
                    if (gallery.includes(unlockedMessage.image_url!)) {
                      return gallery; // Already exists, don't add again
                    }
                    return [...gallery, unlockedMessage.image_url!];
                  });
                }
                return prev.map((m) =>
                  m.serverMessageId === parseInt(messageId)
                    ? {
                        ...m,
                        blurred: false,
                        locked: false,
                        image_url: m.image_url,
                      }
                    : m
                );
              });

              // Show toast notification instead of system message
              toast.success("Image unlocked and added to gallery!");

              // Add Amber's natural response
              const imageResponses = [
                "Hmm baby, you like what you see?",
                "Mmm, I hope that view makes you hard...",
                "Tell me what you'd do to me baby...",
                "I love showing off for you... what do you think?",
                "Mmm daddy, I hope that gets you excited...",
                "I'm all yours baby, what would you do to me?",
                "Do you like what you see? I'm so wet for you...",
                "Mmm I love when you look at me like that...",
              ];

              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  text: imageResponses[
                    Math.floor(Math.random() * imageResponses.length)
                  ],
                  sender: "ai",
                },
              ]);
              setTimeout(() => {
                scrollToBottom("auto");
              }, 100);
            } catch (error) {
              console.error("Failed to unlock image:", error);
              toast.error(
                "Payment completed but failed to unlock image. Please refresh the page."
              );
            }
          }
          navigate(window.location.pathname, { replace: true });
        } else if (params.get("unlock_cancel") === "true") {
          const messageId = params.get("message_id");
          if (messageId) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: "❌ Payment cancelled. Image remains locked.",
                sender: "ai",
              },
            ]);
            setTimeout(() => {
              scrollToBottom("auto");
            }, 100);
          }
          navigate(window.location.pathname, { replace: true });
        } else if (params.get("purchase") === "time_success") {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: "⏱️ Payment successful! Time credits added to your account.",
              sender: "ai",
            },
          ]);
          setTimeout(() => {
            scrollToBottom("auto");
          }, 100);
          navigate(window.location.pathname, { replace: true });
        } else if (params.get("purchase") === "time_cancel") {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: "❌ Time credit purchase cancelled. No credits were added.",
              sender: "ai",
            },
          ]);
          setTimeout(() => {
            scrollToBottom("auto");
          }, 100);
          navigate(window.location.pathname, { replace: true });
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        navigate("/");
      }
    };

    checkAuth();
    authIntervalRef.current = setInterval(() => checkAuth(), 120000);

    return () => {
      if (authIntervalRef.current) clearInterval(authIntervalRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [navigate, lastSignOutTime]);

  // Real-time countdown timer with backend sync
  useEffect(() => {
    if (displayTime <= 0) return;

    const interval = setInterval(() => {
      setDisplayTime((prev) => {
        const newTime = Math.max(0, prev - 1);
        return newTime;
      });
    }, 1000);

            // Sync with backend every 30 seconds to prevent drift
        const syncInterval = setInterval(async () => {
          try {
            const credits = await apiFetch("/api/billing/credits/status/");
            if (credits && typeof credits.time_credits_seconds === "number") {
              setTimeCreditsSeconds(credits.time_credits_seconds);
              setDisplayTime(credits.time_credits_seconds);
            }
          } catch (error) {
            console.error("Failed to sync time credits:", error);
          }
        }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [displayTime]);

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
          serverMessageId: msg.id,
          timestamp: msg.timestamp,
          blurred: msg.blurred || false,
          locked: msg.locked || false,
          has_image: msg.has_image || false,
        }));

        const newMessages: Message[] = formatted.length > 0 ? formatted : [];

        setMessages((prev) => {
          // If we already have welcome messages, just add the formatted history
          if (
            prev.some(
              (m) =>
                m.text.includes("welcome") ||
                m.text.includes("Payment successful") ||
                m.text.includes("I'm Amber")
            )
          ) {
            return [...prev, ...formatted];
          }
          return newMessages;
        });

        // Get unique unlocked images for gallery (prevent duplicates)
        const galleryImgs = formatted
          .filter((m) => m.image_url && !m.blurred && !m.locked)
          .map((m) => m.image_url)
          .filter((url) => url !== undefined)
          .filter(
            (url, index, self) => self.indexOf(url) === index
          ) as string[]; // Remove duplicates

        setGalleryImages(galleryImgs);

        setTimeout(() => {
          scrollToBottom("auto");
        }, 50);

        // Only add follow-up message if it's a fresh login and no welcome message was added
        if (isNewChat && !lastSignOutTime) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                text: "I've been thinking about you... what naughty things shall we do? 💋",
                sender: "ai",
              },
            ]);
            setTimeout(() => {
              scrollToBottom("auto");
            }, 100);
          }, 3000);
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
        toast.error(
          "Failed to load chat history. Starting fresh conversation."
        );
        setMessages([
          { id: 1, text: "Hey there 👋 I'm Amber…", sender: "ai" },
          {
            id: 2,
            text: "Let's start fresh! What's on your mind? 😘",
            sender: "ai",
          },
        ]);
      }
    };

    loadAllHistory();
  }, []);

  const checkTimeLimit = () => {
    if (timeCreditsSeconds > 0) return true;
    setShowUpgradePrompt(true);
    return false;
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
      setHasShownWelcome(false); // Reset welcome flag on actual logout
      setGalleryImages([]);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || typing || !user) return;

    const validation = validateChatMessage(message);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid message");
      return;
    }

    const sanitizedMessage = validation.sanitized || message;

    const timeAllowed = checkTimeLimit();

    if (!timeAllowed) {
      setShowUpgradePrompt(true);
      return;
    }

    const newMsg: Message = {
      id: Date.now(),
      text: message,
      sender: "user",
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setMessage("");
    setTyping(true);

    const startTime = Date.now();

    try {
      const payload = {
        user_id: user.id,
        prompt: sanitizedMessage,
        session_key: `u${user.id}`,
        history: updatedMessages.slice(-20).map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: sanitizeInput(msg.text),
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

      const processingTime = Math.floor((Date.now() - startTime) / 1000);

      // Reliable time credit handling - always sync with backend
      try {
        const usage = await apiFetch("/api/billing/usage/report/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { seconds_used: processingTime },
        });

        if (usage && typeof usage.time_credits_seconds === "number") {
          setTimeCreditsSeconds(usage.time_credits_seconds);
          setDisplayTime(usage.time_credits_seconds);
        } else {
          // If usage report doesn't return credits, fetch them separately
          const credits = await apiFetch("/api/billing/credits/status/");
          if (credits && typeof credits.time_credits_seconds === "number") {
            setTimeCreditsSeconds(credits.time_credits_seconds);
            setDisplayTime(credits.time_credits_seconds);
          }
        }
      } catch (error) {
        console.error("Time credit usage report failed:", error);
        // Try to get current credits as fallback
        try {
          const credits = await apiFetch("/api/billing/credits/status/");
          if (credits && typeof credits.time_credits_seconds === "number") {
            setTimeCreditsSeconds(credits.time_credits_seconds);
            setDisplayTime(credits.time_credits_seconds);
          }
        } catch (fallbackError) {
          console.error("Fallback credit fetch failed:", fallbackError);
        }
      }

      const willHaveImage = Boolean(fullImageUrl);

      const aiReply: Message = {
        id: Date.now() + 1,
        text: data.response || "I'm having trouble responding right now...",
        sender: "ai",
        image_url: willHaveImage ? fullImageUrl : undefined,
        blurred: willHaveImage ? true : false,
        locked: willHaveImage ? true : false,
        has_image: willHaveImage,
        upsell: data.upsell,
        serverMessageId: undefined,
      };

      setMessages((prev) => [...prev, aiReply]);

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

      const serverMessageId = submitRes?.message_id as number | undefined;
      if (serverMessageId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiReply.id ? { ...m, serverMessageId } : m))
        );
      }

      // Check if time is up after the response
      const currentCredits = await apiFetch("/api/billing/credits/status/");
      if (currentCredits && currentCredits.time_credits_seconds <= 0) {
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
    const remainingMinutes = Math.floor(displayTime / 60);
    const remainingSeconds = displayTime % 60;

    if (remainingMinutes > 0) {
      return `${remainingMinutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${remainingSeconds}s`;
    }
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
      console.log("Creating checkout session for tier:", tier);

      const stripe = await loadStripe(
        "pk_test_51RfN83Rmpew7aCdyjEfExfKKJwnfu1WdusdNbdECFskXUHkA2ChiiYzNgRqp4DKkIxQsoppUZHVikvwdefxhxv41003hlgqZu7"
      );

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/billing/create-checkout-session/time/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ tier }),
        }
      );

      const data = await response.json();
      console.log("Checkout session response:", data);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Payment failed");
      }

      if (!data?.sessionId) {
        throw new Error("No session ID received");
      }

      const { error } = await stripe!.redirectToCheckout({
        sessionId: data.sessionId,
      });
      if (error) throw error;
    } catch (e) {
      console.error("Time credit purchase error:", e);
      toast.error(
        e instanceof Error ? e.message : "Payment failed. Please try again."
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-black text-white fixed inset-0">
      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center px-4 py-3 border-b border-gray-800 bg-black fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen);
              setMenuOpen(false);
            }}
            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition active:scale-95"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-red-500">Amber</h1>
          </div>
        </div>

        {/* Mobile Time Display */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${
              displayTime < 300
                ? "bg-red-500/20 border-red-400 text-red-200"
                : displayTime < 600
                ? "bg-yellow-500/20 border-yellow-400 text-yellow-200"
                : "bg-green-500/20 border-green-400 text-green-200"
            }`}
          >
            <span>⏱️</span>
            <span className="font-bold">{getRemainingTime()}</span>
          </div>

          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setSidebarOpen(false);
            }}
            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition active:scale-95"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-b border-gray-800 fixed top-16 left-0 right-0 z-40 animate-slideDown">
          <div className="flex flex-col space-y-2 p-3">
            <button
              onClick={() => {
                navigate("/settings");
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white transition rounded-lg active:scale-95"
            >
              Settings
            </button>
            <button
              onClick={() => {
                navigate("/addons");
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white transition rounded-lg active:scale-95"
            >
              Add-ons
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white transition rounded-lg active:scale-95"
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
        />
      )}

      {/* Sidebar/Gallery */}
      <div
        className={`${
          sidebarOpen
            ? "fixed md:relative inset-0 z-40 md:z-auto mt-16 md:mt-0"
            : "hidden md:hidden"
        } 
        flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-in-out 
        ${sidebarOpen ? "w-80 md:w-80" : "w-0"} h-screen md:h-full`}
        style={{ zIndex: 40 }}
      >
        {/* Gallery Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900 flex-shrink-0">
          <h2 className="text-lg font-bold text-red-500">Gallery</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-300 p-1 hover:text-red-500 transition"
          >
            ✕
          </button>
        </div>

        {/* Gallery Content - Scrollable */}
        <div
          className="flex-1 overflow-y-auto p-4 bg-gray-900"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingBottom: "120px", // Extra space for mobile scrolling
            height: "calc(100vh - 120px)", // Ensure proper height for mobile
          }}
        >
          {galleryImages.length > 0 ? (
            <div
              className="grid grid-cols-2 gap-3 mb-6"
              onClick={(e) => e.stopPropagation()}
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
                      alt="attachment"
                      className="rounded-lg shadow object-cover h-full w-full transition-transform group-hover:scale-105"
                    />
                  </button>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-6">No images yet</p>
          )}

          {/* Time Credits Section - Now part of scrollable content */}
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⏱️</span>
              <span className="font-bold text-red-500">Time Credits</span>
            </div>

            <div
              className={`flex items-center justify-between p-3 rounded-lg mb-3 ${
                displayTime < 300
                  ? "bg-red-500/20 border border-red-400"
                  : displayTime < 600
                  ? "bg-yellow-500/20 border border-yellow-400"
                  : "bg-green-500/20 border border-green-400"
              }`}
            >
              <span className="text-sm">Remaining:</span>
              <span
                className={`font-bold text-lg ${
                  displayTime < 300
                    ? "text-red-200"
                    : displayTime < 600
                    ? "text-yellow-200"
                    : "text-green-200"
                }`}
              >
                {getRemainingTime()}
              </span>
            </div>

            <div className="flex justify-between mb-4 text-sm">
              <span>Images:</span>
              <span className="text-red-400 font-medium">
                $4.99 each when unlocked
              </span>
            </div>

            {/* Time purchase buttons */}
            <div className="space-y-2">
              <div className="text-xs text-gray-400 mb-2">
                {displayTime < 300
                  ? "⚠️ Time running low! Add more credits:"
                  : "Add more time credits:"}
              </div>
              <button
                disabled={checkoutLoading}
                onClick={() => handleBuyTime("10_min")}
                className="w-full px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                Add 10 min ($9.99)
              </button>
              <button
                disabled={checkoutLoading}
                onClick={() => handleBuyTime("30_min")}
                className="w-full px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                Add 30 min ($19.99)
              </button>
              <button
                disabled={checkoutLoading}
                onClick={() => handleBuyTime("60_min")}
                className="w-full px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                Add 60 min ($29.99)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col relative mt-16 md:mt-0 h-screen md:h-full ${
          sidebarOpen ? "md:flex hidden" : "flex"
        }`}
      >
        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-black">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition active:scale-95"
            >
              {sidebarOpen ? "←" : "→"}
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-red-500">Amber</h1>
            </div>
          </div>

          {/* Time Credits Display */}
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                displayTime < 300
                  ? "bg-red-500/20 border-red-400 text-red-200"
                  : displayTime < 600
                  ? "bg-yellow-500/20 border-yellow-400 text-yellow-200"
                  : "bg-green-500/20 border-green-400 text-green-200"
              }`}
            >
              <span className="text-lg">⏱️</span>
              <div className="flex flex-col">
                <span className="text-xs opacity-80">Time Credits</span>
                <span className="font-bold text-sm">{getRemainingTime()}</span>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition active:scale-95"
              >
                ☰ Menu
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-900 text-white border border-gray-800 rounded shadow-md z-10 animate-fadeIn">
                  <button
                    onClick={() => navigate("/settings")}
                    className="w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white transition rounded-t"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => navigate("/addons")}
                    className="w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white transition"
                  >
                    Add-ons
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white transition rounded-b"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 md:space-y-4"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            height: "calc(100vh - 140px)",
            minHeight: 0,
            paddingBottom: "100px", // Account for fixed input on mobile
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={`${msg.id}-${index}`}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              {msg.text && (
                <div
                  className={`max-w-[85%] md:max-w-3xl px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-lg ${
                    msg.sender === "user"
                      ? "bg-red-600 text-white rounded-br-none"
                      : "bg-gray-800 text-white rounded-bl-none border border-gray-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm md:text-base">
                    {msg.text}
                  </p>
                </div>
              )}
              {msg.has_image && (
                <div className={`mt-2 max-w-[90%] md:max-w-md`}>
                  <div
                    className={`p-1 md:p-2 rounded-2xl shadow ${
                      msg.sender === "user"
                        ? "bg-red-600/20 border border-red-600/30"
                        : "bg-gray-800 border border-gray-700"
                    }`}
                  >
                    <div className="relative">
                      {msg.serverMessageId ? (
                        <img
                          src={
                            msg.blurred
                              ? `${
                                  import.meta.env.VITE_API_BASE_URL
                                }/api/chat/messages/${
                                  msg.serverMessageId
                                }/protected_image/`
                              : msg.image_url ||
                                `${
                                  import.meta.env.VITE_API_BASE_URL
                                }/api/chat/messages/${
                                  msg.serverMessageId
                                }/protected_image/`
                          }
                          alt="attachment"
                          className="rounded-lg w-full aspect-[1/1] object-cover cursor-pointer hover:opacity-90 transition"
                          onLoad={() => {
                            console.log(
                              `Image loaded for message ${
                                msg.serverMessageId
                              } using ${
                                msg.blurred
                                  ? "protected endpoint"
                                  : "direct R2 URL"
                              }`
                            );
                          }}
                          onError={(e) => {
                            console.error(
                              `Image failed to load for message ${msg.serverMessageId}:`,
                              e
                            );
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!msg.blurred) {
                              setModalImage(
                                msg.image_url ||
                                  `${
                                    import.meta.env.VITE_API_BASE_URL
                                  }/api/chat/messages/${
                                    msg.serverMessageId
                                  }/protected_image/`
                              );
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full aspect-[1/1] bg-gray-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">
                            Loading image... (ID: {msg.id})
                          </span>
                        </div>
                      )}
                      {msg.blurred && msg.serverMessageId && (
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
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            if (!msg.serverMessageId) {
                              toast.error("Image not found. Please try again.");
                              return;
                            }
                            try {
                              console.log(
                                "Attempting to unlock image:",
                                msg.serverMessageId
                              );
                              const res = await apiFetch(
                                `/api/billing/create-checkout-session/image-unlock/`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: { message_id: msg.serverMessageId },
                                }
                              );
                              console.log("Unlock response:", res);

                              if (res?.checkout_url) {
                                window.location.href = res.checkout_url;
                              } else if (res?.ok === true && res?.image_url) {
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.serverMessageId === msg.serverMessageId
                                      ? { ...m, blurred: false, locked: false }
                                      : m
                                  )
                                );
                              } else {
                                toast.error(
                                  "Payment failed. Please try again."
                                );
                              }
                            } catch (error) {
                              console.error("Image unlock error:", error);
                              toast.error(
                                "Failed to unlock image. Please try again."
                              );
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
              <div className="bg-gray-800 text-white px-4 py-2 rounded-2xl rounded-bl-none border border-gray-700">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce"></div>
                  <div
                    className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-red-500 animate-bounce"
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
          className={`fixed md:sticky bottom-0 left-0 right-0 flex items-center px-4 md:px-6 py-3 md:py-4 border-t border-gray-800 bg-black z-40 ${
            sidebarOpen ? "md:flex hidden" : "flex"
          }`}
        >
          <input
            type="text"
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your wildest desires..."
            className="flex-1 px-3 py-2 md:px-4 md:py-2 rounded-lg border border-gray-700 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-red-500 text-sm md:text-base"
            disabled={showUpgradePrompt}
            onFocus={() => setTimeout(scrollToBottom, 300)}
            style={{
              fontSize: "16px",
              lineHeight: "1.2",
              minHeight: "44px",
            }}
          />
          <button
            type="submit"
            disabled={!message.trim() || typing || showUpgradePrompt}
            className="ml-3 px-3 py-2 md:px-4 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition active:scale-95 text-sm md:text-base"
            style={{
              minHeight: "44px",
              minWidth: "60px",
            }}
          >
            Send
          </button>
        </form>

        {/* Image Preview Modal */}
        {modalImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <div
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={modalImage}
                alt="attachment"
                className="max-w-full max-h-[80vh] rounded-lg shadow-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
            <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full animate-popIn">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 text-center">
                ⏳ Add Time Credits
              </h2>
              <p className="text-gray-300 mb-6 text-center">
                You're out of time credits. Purchase more to continue chatting.
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    navigate("/addons");
                    setShowUpgradePrompt(false);
                  }}
                  className="bg-red-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-red-700 font-semibold transition active:scale-95"
                >
                  Buy Time Credits
                </button>
                <button
                  onClick={() => setShowUpgradePrompt(false)}
                  className="bg-gray-800 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-gray-700 font-semibold transition active:scale-95"
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
