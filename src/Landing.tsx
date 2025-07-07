import { useState, useEffect, useRef } from "react";
import Modal from "./components/Modal";
import Register from "./pages/Register";
import Login from "./pages/Login";
import LandingChatPreview from "./components/LandingChatPreview";

type ChatMessage = {
  id: number;
  text: string;
  sender: "user" | "ai";
};

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showChatPreview, setShowChatPreview] = useState(false);
  const chatPreviewRef = useRef<HTMLDivElement>(null);

  const initialMessages: ChatMessage[] = [
    { id: 1, text: "Hey there 👋 I'm Amber...", sender: "ai" },
    { id: 2, text: "Let's dive into your wildest fantasies...", sender: "ai" },
  ];

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem("amber_chat_messages");
      return saved ? JSON.parse(saved) : initialMessages;
    } catch {
      return initialMessages;
    }
  });

  const [chatTimeLeft, setChatTimeLeft] = useState<number>(() => {
    try {
      const savedTime = sessionStorage.getItem("amber_chat_timeLeft");
      return savedTime ? parseInt(savedTime, 10) : 600;
    } catch {
      return 600;
    }
  });

  const [showRegisterPrompt, setShowRegisterPrompt] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("amber_register_prompt") === "true";
    } catch {
      return false;
    }
  });

  // sync state
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "amber_chat_messages",
        JSON.stringify(chatMessages)
      );
    } catch (error) {
      console.error("Error saving chat messages:", error);
    }
  }, [chatMessages]);

  useEffect(() => {
    try {
      sessionStorage.setItem("amber_chat_timeLeft", chatTimeLeft.toString());
    } catch (error) {
      console.error("Error saving chat time:", error);
    }
  }, [chatTimeLeft]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "amber_register_prompt",
        showRegisterPrompt.toString()
      );
    } catch (error) {
      console.error("Error saving register prompt:", error);
    }
  }, [showRegisterPrompt]);

  // filter out invalid messages
  const validMessages = chatMessages.filter(
    (msg): msg is ChatMessage =>
      msg !== null &&
      typeof msg === "object" &&
      "id" in msg &&
      "text" in msg &&
      "sender" in msg &&
      (msg.sender === "user" || msg.sender === "ai")
  );

  useEffect(() => {
    if (!showChatPreview && chatPreviewRef.current) {
      chatPreviewRef.current.scrollTop =
        chatPreviewRef.current.scrollHeight;
    }
  }, [validMessages, showChatPreview]);

  return (
    <div className="min-h-screen bg-[#4B1F1F] text-[#E7D8C1] flex flex-col">
      {/* Navbar */}
      <header className="w-full flex justify-between items-center px-8 py-4 border-b border-[#D1A75D]">
        <h1 className="text-2xl font-bold text-[#D1A75D]">amber</h1>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#chat" className="hover:text-[#D1A75D]">
            Chat
          </a>
          <a href="#features" className="hover:text-[#D1A75D]">
            Features
          </a>
          <a href="#reviews" className="hover:text-[#D1A75D]">
            Reviews
          </a>
          <button
            onClick={() => setShowLogin(true)}
            className="hover:text-[#D1A75D]"
          >
            Login
          </button>
          <button
            onClick={() => setShowRegister(true)}
            className="bg-[#D1A75D] text-[#4B1F1F] px-4 py-2 rounded hover:bg-[#b88e4f] font-semibold"
          >
            Start Consultation
          </button>
        </nav>
      </header>

      {/* Main Section */}
      <main className="flex-1 flex flex-col lg:flex-row justify-between px-10 py-16 gap-12 w-full">
        <div className="lg:w-1/2">
          <h2 className="text-4xl font-extrabold text-[#D1A75D] mb-4 leading-tight">
            Your Personal Companion – Amber's Seductive Journey
          </h2>
          <p className="text-sm text-[#E7D8C1] mb-6">4.9/5 ★★★★★ · 1M+ conversations</p>
          <ul className="text-md space-y-3 mb-8">
            <li>💋 Expert Erotic Guidance</li>
            <li>✨ Personalized Fantasy Scenarios</li>
            <li>💞 Seductive Companionship Support</li>
          </ul>
          <p className="text-[#E7D8C1]">
            Explore your desires with Amber, trained to fulfill emotional and
            sensual connections.
          </p>
        </div>

        {/* Scrollable Chat Preview */}
        <div
          className="lg:w-1/2 bg-[#2B1A1A] rounded-2xl p-6 shadow-xl cursor-pointer hover:scale-105 transition-all flex flex-col"
          onClick={() => setShowChatPreview(true)}
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-[#D1A75D]">Amber</span>
            <span className="text-xs text-green-400">Online</span>
          </div>

          <div
            ref={chatPreviewRef}
            className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar"
            style={{ minHeight: "150px" }}
          >
            {validMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg mb-2 w-fit max-w-[80%] ${
                  msg.sender === "user"
                    ? "ml-auto bg-[#E7D8C1] text-[#4B1F1F]"
                    : "bg-[#D14A3C] text-white"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {validMessages.length > 0 &&
              validMessages[validMessages.length - 1].sender === "user" && (
                <div className="text-sm italic text-[#E7D8C1]">
                  Amber is typing...
                </div>
              )}
          </div>

          <div className="mt-auto">
            <input
              type="text"
              placeholder="Ask about your wildest desires..."
              className="w-full p-2 rounded border text-sm bg-[#4B1F1F] text-[#E7D8C1] placeholder-[#E7D8C1] border-[#D1A75D]"
              disabled
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {showLogin && (
        <Modal onClose={() => setShowLogin(false)}>
          <Login
            onClose={() => setShowLogin(false)}
            onSwitchToRegister={() => {
              setShowLogin(false);
              setShowRegister(true);
            }}
          />
        </Modal>
      )}

      {showRegister && (
        <Modal onClose={() => setShowRegister(false)}>
          <Register
            onClose={() => setShowRegister(false)}
            onSwitchToLogin={() => {
              setShowRegister(false);
              setShowLogin(true);
            }}
          />
        </Modal>
      )}

      {showChatPreview && (
        <LandingChatPreview
          onClose={() => setShowChatPreview(false)}
          onRegisterClick={() => {
            setShowChatPreview(false);
            setShowRegister(true);
          }}
          messages={validMessages}
          setMessages={setChatMessages}
          timeLeft={chatTimeLeft}
          setTimeLeft={setChatTimeLeft}
          showRegisterPrompt={showRegisterPrompt}
          setShowRegisterPrompt={setShowRegisterPrompt}
        />
      )}
    </div>
  );
}
