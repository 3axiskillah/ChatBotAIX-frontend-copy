import { useState, useRef, useEffect, type FormEvent } from "react";
import { apiFetch } from "../utils/api"; // ✅ adjust path if needed

type Message = {
  id: number;
  text: string;
  sender: "user" | "ai";
  image_url?: string;
};

type Props = {
  onClose: () => void;
  onRegisterClick: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  showRegisterPrompt: boolean;
  setShowRegisterPrompt: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function LandingChatPreview({
  onClose,
  onRegisterClick,
  messages,
  setMessages,
  timeLeft,
  setTimeLeft,
  showRegisterPrompt,
  setShowRegisterPrompt,
}: Props) {
  const [anonId] = useState<string>(() => {
    const storedId = localStorage.getItem("anon_id");
    if (storedId) return storedId;

    const newId = "anon_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("anon_id", newId);
    return newId;
  });
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showRegisterPrompt) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowRegisterPrompt(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showRegisterPrompt, setTimeLeft, setShowRegisterPrompt]);

  useEffect(() => {
    if (!sessionStorage.getItem("amber_chat_initialized") && messages.length === 0) {
      const initialMessages: Message[] = [
        { id: 1, text: "Hey there 👋 I'm Amber...", sender: "ai" },
        { id: 2, text: "Let's dive into your wildest fantasies...", sender: "ai" },
      ];
      let index = 0;

      const showNext = () => {
        if (index < initialMessages.length) {
          setIsTyping(true);
          setTimeout(() => {
            setMessages((prev) => [...prev, initialMessages[index]]);
            index += 1;
            setIsTyping(false);
            showNext();
          }, 1500);
        } else {
          sessionStorage.setItem("amber_chat_initialized", "true");
        }
      };
      showNext();
    }
  }, [messages, setMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || showRegisterPrompt) return;

    const newUserMessage: Message = {
      id: Date.now(),
      text: message,
      sender: "user",
    };
    const updated = [...messages, newUserMessage];
    setMessages(updated);
    setMessage("");
    setIsTyping(true);

    try {
      const respondRes = await apiFetch("/chat/respond", {
        method: "POST",
        body: JSON.stringify({
          user_id: 0,
          anon_id: anonId,
          prompt: newUserMessage.text,
          history: updated.slice(-10).map((msg) => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text,
          })),
        }),
      }, true); // useAI = true

      const data = await respondRes;

      const fullImageUrl =
        data.image_url && !data.image_url.startsWith("http")
          ? `${import.meta.env.VITE_AI_WORKER_URL}${data.image_url}`
          : data.image_url;

      const newAIMessage: Message = {
        id: Date.now() + 1,
        text: data.response || "I'm sorry, I can't respond right now.",
        sender: "ai",
        image_url: fullImageUrl || undefined,
      };
      setMessages((prev) => [...prev, newAIMessage]);

      sessionStorage.setItem("anon_chat", JSON.stringify([...updated, newAIMessage]));

      await apiFetch("/api/chat/submit/", {
        method: "POST",
        body: JSON.stringify({
          prompt: newUserMessage.text,
          reply: newAIMessage.text,
          anon_id: anonId,
          image_url: fullImageUrl || null,
        }),
      });
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage: Message = {
        id: Date.now() + 2,
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        sender: "ai",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRegisterClick = async () => {
    try {
      const anonHistory = sessionStorage.getItem("anon_chat");
      if (anonHistory) {
        await apiFetch("/api/chat/migrate_anon/", {
          method: "POST",
          body: anonHistory,
        });
      }
    } catch (e) {
      console.error("Failed to migrate anon conversation", e);
    }
    onRegisterClick();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/70 flex items-center justify-center">
      <div className="w-full max-w-2xl h-[80vh] bg-[#2B1A1A] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#D1A75D]">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-[#D1A75D] bg-[#4B1F1F]">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="font-semibold text-lg text-[#D1A75D]">Amber</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-[#D1A75D]/20 border border-[#D1A75D] px-2 py-1 rounded-md">
              <span className="text-xs font-mono text-[#D1A75D]">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={onClose}
              className="text-[#E7D8C1] hover:text-white text-2xl font-light"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 px-4 py-4 overflow-y-auto space-y-3">
          {messages.map((msg) => (
            <>
              {msg.text && (
                <div
                  key={msg.id}
                  className={`max-w-[80%] px-4 py-3 rounded-xl text-sm ${
                    msg.sender === "user"
                      ? "bg-[#E7D8C1] text-[#4B1F1F] self-end ml-auto"
                      : "bg-[#D14A3C] text-white self-start"
                  }`}
                >
                  {msg.text}
                </div>
              )}

              {msg.image_url && (
                <div
                  key={`${msg.id}-image`}
                  className="max-w-[80%] bg-[#D14A3C] rounded-xl p-2 self-start"
                >
                  <img
                    src={msg.image_url}
                    alt="AI generated"
                    className="rounded-xl shadow"
                  />
                </div>
              )}
            </>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-1 text-sm text-[#D1A75D] italic">
              <span>Amber is typing</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-[#D1A75D] animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-[#D1A75D] animate-bounce delay-200"></div>
                <div className="w-2 h-2 rounded-full bg-[#D1A75D] animate-bounce delay-400"></div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-[#D1A75D] bg-[#4B1F1F]">
          <div className="relative flex">
            <input
              disabled={showRegisterPrompt}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                showRegisterPrompt
                  ? "Please register to continue..."
                  : "Ask about your wildest desires..."
              }
              className="flex-1 p-3 pr-12 rounded-lg bg-[#4B1F1F] border border-[#D1A75D] text-[#E7D8C1] placeholder-[#E7D8C1]/70 focus:outline-none focus:ring-1 focus:ring-[#D1A75D] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!message.trim() || showRegisterPrompt}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-[#D1A75D] text-[#4B1F1F] hover:bg-[#b88e4f] disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </form>

        {/* Register Prompt */}
        {showRegisterPrompt && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 text-center px-6">
            <h2 className="text-2xl font-bold text-[#E7D8C1] mb-4">
              Your free session has ended 💔
            </h2>
            <p className="text-[#E7D8C1] mb-6">
              To keep chatting with Amber, please create an account. She’s waiting for you...
            </p>
            <button
              onClick={handleRegisterClick}
              className="bg-[#D1A75D] text-[#4B1F1F] px-6 py-3 rounded-lg hover:bg-[#b88e4f] font-semibold text-lg"
            >
              Register to Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
