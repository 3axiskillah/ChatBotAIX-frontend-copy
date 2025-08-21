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
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [lastSignOutTime, setLastSignOutTime] = useState<number | null>(null);
  const [keepGalleryOpen, setKeepGalleryOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const authIntervalRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<number | null>(null);
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
    // Delay scroll to ensure messages are rendered
    setTimeout(() => {
      scrollToBottom("auto");
    }, 100);
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
    const checkAuth = async () => {
      try {
        const [userData, credits] = await Promise.all([
          apiFetch("/api/accounts/me/"),
          apiFetch("/api/billing/credits/status/"),
        ]);

        if (!userData?.email) throw new Error();

        const shouldWelcomeBack =
          lastSignOutTime && Date.now() - lastSignOutTime > 5000;

        setUser({
          id: userData.id,
          email: userData.email,
        });

        if (credits) {
          const currentCredits = credits.time_credits_seconds || 0;
          const now = Date.now();
          const elapsedSinceSync = Math.floor((now - lastSyncTime) / 1000);
          const adjustedCredits = Math.max(
            0,
            currentCredits - elapsedSinceSync
          );

          setTimeCreditsSeconds(currentCredits);
          setDisplayTime(adjustedCredits);
          setLastSyncTime(now);
          console.log(
            "Periodic sync - backend:",
            currentCredits,
            "adjusted:",
            adjustedCredits
          );
        }

        if (shouldWelcomeBack) {
          toast.success("Welcome back!");
          setTimeout(() => {
            scrollToBottom("auto");
          }, 100);
          navigate(window.location.pathname, { replace: true });
        }

        // Handle payment success parameters
        const params = new URLSearchParams(window.location.search);
        if (params.has("payment_success")) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              text: "🎉 Payment successful! Your time credits have been added.",
              sender: "ai",
            },
          ]);
          setTimeout(() => {
            scrollToBottom("auto");
          }, 100);
          navigate(window.location.pathname, { replace: true });
        } else if (params.get("unlock_success") === "true") {
          console.log(
            "Image unlock success detected, messageId:",
            params.get("message_id")
          );
          const messageId = params.get("message_id");
          if (messageId) {
            // Refresh the specific message to show unblurred image
            try {
              setMessages((prev) => {
                const unlockedMessage = prev.find(
                  (m) => m.serverMessageId === parseInt(messageId)
                );
                console.log("Found unlocked message:", unlockedMessage);
                if (unlockedMessage && unlockedMessage.image_url) {
                  console.log(
                    "Adding image to gallery:",
                    unlockedMessage.image_url
                  );
                  setGalleryImages((gallery) => [
                    ...gallery,
                    unlockedMessage.image_url!,
                  ]);
                }
                return prev.map((m) =>
                  m.serverMessageId === parseInt(messageId)
                    ? {
                        ...m,
                        blurred: false,
                        locked: false,
                      }
                    : m
                );
              });

              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  text: "🖼️ Payment successful! Image unlocked and added to your gallery.",
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

    // Sync time credits every 30 seconds to ensure accuracy
    syncIntervalRef.current = setInterval(async () => {
      try {
        const credits = await apiFetch("/api/billing/credits/status/");
        if (credits && typeof credits.time_credits_seconds === "number") {
          const currentCredits = credits.time_credits_seconds;
          const now = Date.now();
          const elapsedSinceSync = Math.floor((now - lastSyncTime) / 1000);
          const adjustedCredits = Math.max(
            0,
            currentCredits - elapsedSinceSync
          );

          setTimeCreditsSeconds(currentCredits);
          // Only update display time if it's significantly different (more than 10 seconds)
          if (Math.abs(displayTime - adjustedCredits) > 10) {
            setDisplayTime(adjustedCredits);
          }
          setLastSyncTime(now);
          console.log(
            "Periodic sync - backend:",
            currentCredits,
            "adjusted:",
            adjustedCredits
          );
        }
      } catch (error) {
        console.error("Periodic time credit sync failed:", error);
      }
    }, 30000);

    return () => {
      if (authIntervalRef.current) clearInterval(authIntervalRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [navigate, lastSignOutTime]); // Removed lastSyncTime from dependencies

  // Real-time countdown timer
  useEffect(() => {
    if (displayTime <= 0) return;

    const interval = setInterval(() => {
      setDisplayTime((prev) => {
        const newTime = Math.max(0, prev - 1);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
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
          serverMessageId: msg.id, // Add server message ID for unlock functionality
          timestamp: msg.timestamp,
          blurred: msg.metadata?.unlocked !== true, // Blurred if NOT unlocked
          locked: msg.metadata?.unlocked !== true, // Locked if NOT unlocked
          has_image: msg.metadata?.has_image || false, // Whether message has an image
        }));

        const newMessages: Message[] =
          formatted.length > 0
            ? formatted
            : [
                {
                  id: 1,
                  text: "Hey there 👋 I'm Amber…",
                  sender: "ai" as const,
                },
                {
                  id: 2,
                  text: "Welcome back! Ready to continue? 😘",
                  sender: "ai" as const,
                },
                {
                  id: 3,
                  text: "What's on your mind today? 😈",
                  sender: "ai" as const,
                },
              ];

        setMessages((prev) => {
          if (
            prev.some(
              (m) =>
                m.text.includes("welcome back") ||
                m.text.includes("Payment successful")
            )
          ) {
            return [...prev, ...formatted];
          }
          return newMessages;
        });

        // Only add images to gallery if they are unlocked (paid for)
        const galleryImgs = formatted
          .filter((m) => m.image_url && !m.blurred && !m.locked)
          .map((m) => m.image_url)
          .filter((url) => url !== undefined) as string[];

        setGalleryImages(galleryImgs);

        // Scroll to bottom immediately after setting messages
        setTimeout(() => {
          scrollToBottom("auto");
        }, 50);

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
            // Scroll to bottom after adding new chat message
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
      setGalleryImages([]); // Clear gallery on logout
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || typing || !user) return;

    // Validate and sanitize message
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

    // Images are always allowed but blurred initially

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
        prompt: sanitizedMessage,
        session_key: `u${user.id}`,
        history: updatedMessages.slice(-10).map((msg) => ({
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

      // Calculate and increment time used right after successful response
      const processingTime = Math.floor((Date.now() - startTime) / 1000);
      // Report usage to backend (will deduct credits server-side).
      // Always use server's authoritative balance
      let updatedTimeCredits = timeCreditsSeconds;
      try {
        const usage = await apiFetch("/api/billing/usage/report/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { seconds_used: processingTime },
        });
        if (usage && typeof usage.time_credits_seconds === "number") {
          updatedTimeCredits = Math.max(0, usage.time_credits_seconds);
          const now = Date.now();
          setTimeCreditsSeconds(updatedTimeCredits);
          setDisplayTime(updatedTimeCredits);
          setLastSyncTime(now);
          console.log("Time credits updated from backend:", updatedTimeCredits);
        } else {
          // Fallback: use local decrement but still sync with backend
          updatedTimeCredits = Math.max(0, timeCreditsSeconds - processingTime);
          setTimeCreditsSeconds(updatedTimeCredits);
          setDisplayTime(updatedTimeCredits);
          console.log("Fallback time credits update:", updatedTimeCredits);
        }
      } catch (error) {
        console.error("Time credit usage report failed:", error);
        // On error, still try to sync with backend
        try {
          const currentCredits = await apiFetch("/api/billing/credits/status/");
          if (
            currentCredits &&
            typeof currentCredits.time_credits_seconds === "number"
          ) {
            updatedTimeCredits = Math.max(
              0,
              currentCredits.time_credits_seconds
            );
            const now = Date.now();
            setTimeCreditsSeconds(updatedTimeCredits);
            setDisplayTime(updatedTimeCredits);
            setLastSyncTime(now);
            console.log("Synced time credits after error:", updatedTimeCredits);
          } else {
            updatedTimeCredits = Math.max(
              0,
              timeCreditsSeconds - processingTime
            );
            setTimeCreditsSeconds(updatedTimeCredits);
            setDisplayTime(updatedTimeCredits);
          }
        } catch (syncError) {
          console.error("Failed to sync time credits:", syncError);
          updatedTimeCredits = Math.max(0, timeCreditsSeconds - processingTime);
          setTimeCreditsSeconds(updatedTimeCredits);
          setDisplayTime(updatedTimeCredits);
        }
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
        has_image: willHaveImage,
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

      // Only show upgrade prompt if user is actually out of time credits
      if (updatedTimeCredits <= 0) {
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
      console.error("Time credit purchase error:", e);
      toast.error("Payment failed. Please try again.");
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
            <h1 className="text-lg font-bold text-[#D1A75D]">Amber</h1>
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
            className="bg-[#D1A75D] text-[#4B1F1F] p-2 rounded-lg hover:bg-[#c49851] transition active:scale-95"
          >
            ☰
          </button>
        </div>
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

        {/* Time Credits Section */}
        <div className="mt-4 p-4 bg-gradient-to-br from-[#4B1F1F] to-[#3A1818] rounded-lg border border-[#D1A75D]/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⏱️</span>
            <span className="font-bold text-[#D1A75D]">Time Credits</span>
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
            <span className="text-[#D1A75D] font-medium">
              $4.99 each when unlocked
            </span>
          </div>

          {/* Time purchase buttons */}
          <div className="space-y-2">
            <div className="text-xs text-[#E7D8C1]/70 mb-2">
              {displayTime < 300
                ? "⚠️ Time running low! Add more credits:"
                : "Add more time credits:"}
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
              <h1 className="text-xl font-bold text-[#D1A75D]">Amber</h1>
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
              {msg.has_image && (
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
                        src={
                          msg.blurred
                            ? `/api/chat/messages/${msg.serverMessageId}/protected_image/`
                            : msg.image_url || `/api/chat/messages/${msg.serverMessageId}/protected_image/`
                        }
                        alt="AI generated"
                        className="rounded-lg w-full aspect-[1/1] object-cover cursor-pointer hover:opacity-90 transition touch-pan-y"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!msg.blurred) {
                            setModalImage(
                              msg.image_url || `/api/chat/messages/${msg.serverMessageId}/protected_image/`
                            );
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
                                // Redirect to Stripe checkout for payment
                                window.location.href = res.checkout_url;
                              } else if (res?.ok === true && res?.image_url) {
                                // Image is already unlocked
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.serverMessageId === msg.serverMessageId
                                      ? { ...m, blurred: false, locked: false }
                                      : m
                                  )
                                );
                              } else {
                                // Any other response means payment failed or error
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
