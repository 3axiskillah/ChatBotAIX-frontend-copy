// BillingSuccess.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function BillingSuccess() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Processing your subscription...");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    const confirmSubscription = async () => {
      if (!sessionId) {
        setMessage("⚠️ Invalid session.");
        return;
      }

      try {
        // Confirm with backend
        const data = await apiFetch(`/api/billing/confirm/?session_id=${sessionId}`);
        
        if (data.success) {
          setIsSuccess(true);
          setMessage("✅ Subscription activated! Enjoy chatting with Amber.");
          
          // Force refresh user data by clearing cache and reloading
          localStorage.removeItem('user_data_cache'); // Clear any cached user data
          await apiFetch("/api/accounts/me/", {}, false); // Force fresh fetch
          
          // Add small delay to ensure backend processes webhook
          setTimeout(() => {
            navigate("/chat", { replace: true });
          }, 1500);
        } else {
          setMessage("⚠️ There was an issue confirming your payment.");
        }
      } catch (err) {
        setMessage("⚠️ Something went wrong while confirming your payment.");
      }
    };

    confirmSubscription();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#4B1F1F] text-[#E7D8C1] p-8">
      <h1 className="text-3xl font-bold text-[#D1A75D] mb-4">
        {isSuccess ? "Welcome to Premium!" : "Processing Payment"}
      </h1>
      <p className="mb-6 text-center text-lg">{message}</p>
      
      {isSuccess ? (
        <div className="flex flex-col space-y-3 w-full max-w-xs">
          <button
            onClick={() => navigate("/chat", { replace: true })}
            className="bg-[#D1A75D] text-[#4B1F1F] px-6 py-3 rounded hover:bg-[#c49851] font-bold"
          >
            Start Chatting
          </button>
        </div>
      ) : (
        <button
          onClick={() => navigate("/subscriptions")}
          className="bg-[#3A1A1A] text-[#E7D8C1] px-6 py-3 rounded hover:bg-[#2e1414] font-bold"
        >
          Back to Subscriptions
        </button>
      )}
    </div>
  );
}