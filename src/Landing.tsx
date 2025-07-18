import { useState, useEffect, useRef } from "react";
import LandingChatPreview from "./components/LandingChatPreview";

type ChatMessage = {
  id: number;
  text: string;
  sender: "user" | "ai";
  image_url?: string;
  blurred?: boolean;
};

type LandingProps = {
  onRegisterClick: () => void;
  onLoginClick: () => void;
};

export default function Landing({ onRegisterClick, onLoginClick }: LandingProps) {
  const [showChatPreview, setShowChatPreview] = useState(false);
  const chatPreviewRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize with default messages
  const initialMessages: ChatMessage[] = [
    { id: 1, text: "Hey there 👋 I'm Amber...", sender: "ai" },
    { id: 2, text: "Let's dive into your wildest fantasies...", sender: "ai" },
  ];

  // State management with sessionStorage persistence
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem("amber_chat_messages");
      return saved ? JSON.parse(saved) : initialMessages;
    } catch {
      return initialMessages;
    }
  });

  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  // Timer management - single source of truth
  const [chatTimeLeft, setChatTimeLeft] = useState<number>(() => {
    const savedTime = sessionStorage.getItem("amber_chat_timeLeft");
    return savedTime ? Math.max(0, parseInt(savedTime)) : 600; // 10 minutes default
  });

  // Persist messages and timer to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("amber_chat_messages", JSON.stringify(chatMessages));
    sessionStorage.setItem("amber_chat_timeLeft", chatTimeLeft.toString());
    sessionStorage.setItem("amber_register_prompt", showRegisterPrompt.toString());
  }, [chatMessages, chatTimeLeft, showRegisterPrompt]);

  // Filter valid messages
  const validMessages = chatMessages.filter(
    (msg): msg is ChatMessage =>
      msg && typeof msg === "object" && "id" in msg && 
      "text" in msg && "sender" in msg &&
      (msg.sender === "user" || msg.sender === "ai")
  );

  // Auto-scroll chat preview
  useEffect(() => {
    if (!showChatPreview && chatPreviewRef.current) {
      chatPreviewRef.current.scrollTop = chatPreviewRef.current.scrollHeight;
    }
  }, [validMessages, showChatPreview]);

  // Cleanup timer on unmount if not migrating
  useEffect(() => {
    return () => {
      if (!sessionStorage.getItem("anon_migration_needed")) {
        sessionStorage.removeItem("amber_chat_timeLeft");
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#4B1F1F] text-[#E7D8C1] flex flex-col">
      {/* Navbar - Mobile First */}
      <header className="w-full flex justify-between items-center px-4 sm:px-8 py-4 border-b border-[#D1A75D]">
        <h1 className="text-2xl font-bold text-[#D1A75D]">amber</h1>
        
        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden text-[#E7D8C1]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 text-sm">
          <a href="#chat" className="hover:text-[#D1A75D]">Chat</a>
          <a href="#features" className="hover:text-[#D1A75D]">Features</a>
          <a href="#reviews" className="hover:text-[#D1A75D]">Reviews</a>
          <button onClick={onLoginClick} className="hover:text-[#D1A75D]">Login</button>
          <button
            onClick={onRegisterClick}
            className="bg-[#D1A75D] text-[#4B1F1F] px-4 py-2 rounded hover:bg-[#b88e4f] font-semibold"
          >
            Start Consultation
          </button>
        </nav>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#2B1A1A] p-4 border-b border-[#D1A75D]">
          <div className="flex flex-col space-y-4">
            <a href="#chat" className="hover:text-[#D1A75D]" onClick={() => setMobileMenuOpen(false)}>Chat</a>
            <a href="#features" className="hover:text-[#D1A75D]" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#reviews" className="hover:text-[#D1A75D]" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
            <button onClick={() => { onLoginClick(); setMobileMenuOpen(false); }} className="text-left hover:text-[#D1A75D]">Login</button>
            <button
              onClick={() => { onRegisterClick(); setMobileMenuOpen(false); }}
              className="bg-[#D1A75D] text-[#4B1F1F] px-4 py-2 rounded hover:bg-[#b88e4f] font-semibold text-left"
            >
              Start Consultation
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row justify-between px-4 sm:px-10 py-8 sm:py-16 gap-8 sm:gap-12 w-full">
        <div className="lg:w-1/2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#D1A75D] mb-4 leading-tight">
            Your Personal Companion – Amber's Seductive Journey
          </h2>
          <p className="text-sm text-[#E7D8C1] mb-6">
            4.9/5 ★★★★★ · 1M+ conversations
          </p>
          <ul className="text-md space-y-3 mb-8">
            <li className="flex items-start">
              <span className="mr-2">💋</span>
              <span>Expert Erotic Guidance</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✨</span>
              <span>Personalized Fantasy Scenarios</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">💞</span>
              <span>Seductive Companionship Support</span>
            </li>
          </ul>
          <p className="text-[#E7D8C1] mb-6 sm:mb-0">
            Explore your desires with Amber, trained to fulfill emotional and
            sensual connections.
          </p>
        </div>

        {/* Chat Preview */}
        <div
          className="lg:w-1/2 bg-[#2B1A1A] rounded-2xl p-4 sm:p-6 shadow-xl cursor-pointer hover:scale-[1.02] transition-transform flex flex-col"
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
                className={`p-3 rounded-lg mb-2 w-fit max-w-[90%] sm:max-w-[80%] text-sm sm:text-base ${
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

      {/* Chat Preview Modal */}
      {showChatPreview && (
        <LandingChatPreview
          onClose={() => setShowChatPreview(false)}
          onRegisterClick={() => {
            setShowChatPreview(false);
            onRegisterClick();
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