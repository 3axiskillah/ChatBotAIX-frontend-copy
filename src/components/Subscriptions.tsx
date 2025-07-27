// Subscriptions.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { loadStripe } from "@stripe/stripe-js";

export default function Subscriptions() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await apiFetch("/api/billing/subscription/status/");
        setSubscriptionStatus(status);
      } catch (err) {
        console.error("Failed to load subscription status:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStatus();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    try {
      setIsLoading(true);
      const stripe = await loadStripe("pk_live_51QbghtDGzHpWMy7sKMwPXAnv82i3nRvMqejIiNy2WNnXmlyLZ5pAcmykuB7hWO8WwpS9nT1hpeuvvWQdRyUpg2or00x6xR1JgX");
      
      const { sessionId } = await apiFetch("/api/billing/create-checkout-session/", {
        method: "POST",
        body: JSON.stringify({ price_id: priceId }),
      });

      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#4B1F1F] text-[#E7D8C1] p-8 flex items-center justify-center">
        <p>Loading subscription information...</p>
      </div>
    );
  }

  if (subscriptionStatus?.is_premium) {
    return (
      <div className="min-h-screen bg-[#4B1F1F] text-[#E7D8C1] p-8 flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4 text-[#D1A75D] text-center">
          You're Already Premium!
        </h1>
        <p className="text-[#E7D8C1] mb-8 text-center text-lg">
          Enjoy unlimited access to all features
        </p>
        
        <div className="bg-[#3A1818] p-6 rounded-lg max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Premium Membership</h2>
              <p className="text-sm text-[#E7D8C1]/80">
                Active since {new Date(subscriptionStatus.premium_since).toLocaleDateString()}
              </p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Active
            </span>
          </div>
          
          <button
            onClick={() => navigate("/chat")}
            className="w-full bg-[#D1A75D] text-[#4B1F1F] py-2 rounded font-bold hover:bg-[#c49851] mt-4"
          >
            Continue to Chat
          </button>
          
          <a
            href="https://billing.stripe.com/p/login/test_4gM7sN62J7ou0nz26r00000"
            target="_blank"
            rel="noreferrer"
            className="block text-center text-[#D1A75D] hover:underline mt-4"
          >
            Manage My Subscription
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#4B1F1F] text-[#E7D8C1] p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-4 text-[#D1A75D] text-center">
        Choose your Plan
      </h1>
      <p className="text-[#E7D8C1] mb-2 text-center">
        100% anonymous. You can cancel anytime.
      </p>
      
      <h2 className="text-3xl font-bold mt-8 mb-2 text-[#D1A75D] text-center">
        Get An Exclusive Discount Only Today!
      </h2>
      <p className="text-[#E7D8C1] mb-8 text-center text-lg">
        Up to <span className="text-[#D1A75D] font-bold">75%</span> off for first subscription
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {/* Annual Plan */}
        <div 
          className={`bg-[#3A1818] rounded-lg p-6 border-2 ${selectedPlan === "annual" ? "border-[#D1A75D]" : "border-transparent"} transition-all cursor-pointer`}
          onClick={() => setSelectedPlan("annual")}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="bg-[#D1A75D] text-[#4B1F1F] px-2 py-1 rounded text-xs font-bold inline-block mb-2">
                BEST CHOICE
              </div>
              <h3 className="text-xl font-bold">12 months</h3>
              <p className="text-[#D1A75D] font-bold">75% OFF</p>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-[#E7D8C1]/60 line-through">$12.96</p>
            <p className="text-2xl font-bold">$3.99<span className="text-base font-normal">/month</span></p>
            <p className="text-sm mt-2">Annual payment billed as $47.88</p>
          </div>
          
          <button
            onClick={() => handleSubscribe("price_annual")}
            disabled={isLoading}
            className={`w-full mt-6 py-2 rounded font-bold ${selectedPlan === "annual" ? "bg-[#D1A75D] text-[#4B1F1F]" : "bg-[#2e1414] text-[#E7D8C1]"}`}
          >
            {isLoading ? "Processing..." : "Select Plan"}
          </button>
        </div>

        {/* Quarterly Plan */}
        <div 
          className={`bg-[#3A1818] rounded-lg p-6 border-2 ${selectedPlan === "quarterly" ? "border-[#D1A75D]" : "border-transparent"} transition-all cursor-pointer`}
          onClick={() => setSelectedPlan("quarterly")}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">3 months</h3>
              <p className="text-[#D1A75D] font-bold">40% OFF</p>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-[#E7D8C1]/60 line-through">$12.96</p>
            <p className="text-2xl font-bold">$7.99<span className="text-base font-normal">/month</span></p>
          </div>
          
          <button
            onClick={() => handleSubscribe("price_quarterly")}
            disabled={isLoading}
            className={`w-full mt-6 py-2 rounded font-bold ${selectedPlan === "quarterly" ? "bg-[#D1A75D] text-[#4B1F1F]" : "bg-[#2e1414] text-[#E7D8C1]"}`}
          >
            {isLoading ? "Processing..." : "Select Plan"}
          </button>
        </div>

        {/* Monthly Plan */}
        <div 
          className={`bg-[#3A1818] rounded-lg p-6 border-2 ${selectedPlan === "monthly" ? "border-[#D1A75D]" : "border-transparent"} transition-all cursor-pointer`}
          onClick={() => setSelectedPlan("monthly")}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">1 month</h3>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-2xl font-bold">$12.99<span className="text-base font-normal">/month</span></p>
          </div>
          
          <button
            onClick={() => handleSubscribe("price_monthly")}
            disabled={isLoading}
            className={`w-full mt-6 py-2 rounded font-bold ${selectedPlan === "monthly" ? "bg-[#D1A75D] text-[#4B1F1F]" : "bg-[#2e1414] text-[#E7D8C1]"}`}
          >
            {isLoading ? "Processing..." : "Select Plan"}
          </button>
        </div>
      </div>

      <div className="mt-12 text-sm text-[#E7D8C1] text-center space-y-2 max-w-2xl">
        <p>✅ No adult transaction in your bank statement</p>
        <p>✅ No hidden fees - Cancel subscription at any time</p>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <p className="text-[#E7D8C1] mb-4">Pay with Credit / Debit Card</p>
        <div className="flex space-x-4">
          <img src="/visa.png" alt="Visa" className="h-8" />
          <img src="/mastercard.png" alt="Mastercard" className="h-8" />
          <img src="/amex.png" alt="American Express" className="h-8" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <div className="bg-[#3A1818] p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-[#D1A75D]">Premium Benefits</h3>
          <ul className="space-y-2">
            <li>• Create your own AI Girlfriend(s)</li>
            <li>• Unlimited text messages</li>
            <li>• Get 100 FREE tokens / month</li>
            <li>• Remove image blur</li>
            <li>• Generate images</li>
            <li>• Make AI phone calls</li>
            <li>• Fast response time</li>
          </ul>
        </div>

        <div className="bg-[#3A1818] p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-[#D1A75D]">Why Choose Us?</h3>
          <ul className="space-y-2">
            <li>• 100% anonymous experience</li>
            <li>• No personal data required</li>
            <li>• Cancel anytime with one click</li>
            <li>• Secure payment processing</li>
            <li>• 24/7 customer support</li>
          </ul>
        </div>
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