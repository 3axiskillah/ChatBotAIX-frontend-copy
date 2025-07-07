import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BillingSuccess() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Processing your subscription...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (sessionId) {
      // optionally, confirm on your backend:
      fetch(`http://localhost:8000/api/billing/confirm/?session_id=${sessionId}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setMessage("✅ Subscription activated! Enjoy chatting with Amber.");
          } else {
            setMessage("⚠️ There was an issue confirming your payment.");
          }
        })
        .catch(() => {
          setMessage("⚠️ Something went wrong while confirming your payment.");
        });
    } else {
      setMessage("⚠️ Invalid session.");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#4B1F1F] text-[#E7D8C1] p-8">
      <h1 className="text-3xl font-bold text-[#D1A75D] mb-4">Thank you!</h1>
      <p className="mb-6 text-center text-lg">{message}</p>
      <button
        onClick={() => navigate("/chat")}
        className="bg-[#D1A75D] text-[#4B1F1F] px-6 py-3 rounded hover:bg-[#c49851] font-bold"
      >
        Go to Chat
      </button>
    </div>
  );
}
