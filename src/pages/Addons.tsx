import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { loadStripe } from "@stripe/stripe-js";

export default function Addons() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleBuyTime = async (tier: string) => {
    try {
      setIsLoading(true);
      const stripe = await loadStripe(
        "pk_test_51RfN83Rmpew7aCdyjEfExfKKJwnfu1WdusdNbdECFskXUHkA2ChiiYzNgRqp4DKkIxQsoppUZHVikvwdefxhxv41003hlgqZu7"
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
    } catch (error) {
      alert("Checkout failed. Please try again.");
      console.error("Time credit purchase error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#4B1F1F] text-[#E7D8C1] p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-4 text-[#D1A75D] text-center">
        Time Credits
      </h1>
      <p className="text-[#E7D8C1] mb-8 text-center">
        Buy time credits to chat with Amber. Images are $4.99 each when
        unlocked.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <div className="bg-[#3A1818] rounded-lg p-6 border-2 border-transparent hover:border-[#D1A75D] transition-all">
          <h3 className="text-xl font-bold text-[#D1A75D] mb-2">10 Minutes</h3>
          <p className="text-2xl font-bold mb-4">$9.99</p>
          <p className="text-sm mb-4">Perfect for a quick chat session</p>
          <button
            onClick={() => handleBuyTime("10_min")}
            disabled={isLoading}
            className="w-full py-2 rounded bg-[#D1A75D] text-[#4B1F1F] font-bold hover:bg-[#b88e4f] transition disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Buy 10 Minutes"}
          </button>
        </div>

        <div className="bg-[#3A1818] rounded-lg p-6 border-2 border-[#D1A75D] transition-all">
          <div className="bg-[#D1A75D] text-[#4B1F1F] px-2 py-1 rounded text-xs font-bold inline-block mb-2">
            POPULAR
          </div>
          <h3 className="text-xl font-bold text-[#D1A75D] mb-2">30 Minutes</h3>
          <p className="text-2xl font-bold mb-4">$19.99</p>
          <p className="text-sm mb-4">Most popular choice</p>
          <button
            onClick={() => handleBuyTime("30_min")}
            disabled={isLoading}
            className="w-full py-2 rounded bg-[#D1A75D] text-[#4B1F1F] font-bold hover:bg-[#b88e4f] transition disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Buy 30 Minutes"}
          </button>
        </div>

        <div className="bg-[#3A1818] rounded-lg p-6 border-2 border-transparent hover:border-[#D1A75D] transition-all">
          <h3 className="text-xl font-bold text-[#D1A75D] mb-2">60 Minutes</h3>
          <p className="text-2xl font-bold mb-4">$29.99</p>
          <p className="text-sm mb-4">Extended conversation time</p>
          <button
            onClick={() => handleBuyTime("60_min")}
            disabled={isLoading}
            className="w-full py-2 rounded bg-[#D1A75D] text-[#4B1F1F] font-bold hover:bg-[#b88e4f] transition disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Buy 60 Minutes"}
          </button>
        </div>
      </div>

      <div className="mt-12 text-sm text-[#E7D8C1] text-center space-y-2 max-w-2xl">
        <p>✅ Credits never expire</p>
        <p>✅ Pay only for what you use</p>
        <p>✅ Images are $4.99 each when unlocked</p>
      </div>

      <button
        onClick={() => navigate("/chat")}
        className="mt-8 px-6 py-3 bg-[#3A1818] text-[#E7D8C1] rounded-xl font-semibold hover:bg-[#2e1414] transition"
      >
        Back to Chat
      </button>
    </div>
  );
}
