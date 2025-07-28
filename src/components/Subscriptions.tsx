import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { loadStripe } from "@stripe/stripe-js";

const PLANS = {
  monthly: {
    id: 'monthly',
    stripePriceId: 'price_monthly_12',
    name: '1 Month',
    price: '$12/month',
    originalPrice: '$15',
    description: 'Billed monthly',
    highlight: false
  },
  quarterly: {
    id: 'quarterly',
    stripePriceId: 'price_quarterly_10',
    name: '3 Months',
    price: '$10/month',
    originalPrice: '$30 billed quarterly',
    description: 'Save 17% vs monthly',
    highlight: false
  },
  annual: {
    id: 'annual',
    stripePriceId: 'price_annual_8',
    name: '1 Year',
    price: '$8/month',
    originalPrice: '$96 billed yearly',
    description: 'Best value (33% savings)',
    highlight: true
  }
};

export default function Subscriptions() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState({ page: true, button: false });
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
        setIsLoading(prev => ({ ...prev, page: false }));
      }
    };
    loadStatus();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    try {
      setIsLoading(prev => ({ ...prev, button: true }));
      const stripe = await loadStripe("pk_live_51QbghtDGzHpWMy7sKMwPXAnv82i3nRvMqejIiNy2WNnXmlyLZ5pAcmykuB7hWO8WwpS9nT1hpeuvvWQdRyUpg2or00x6xR1JgX");
      
      const { sessionId } = await apiFetch("/api/billing/create-checkout-session/", {
        method: "POST",
        body: JSON.stringify({ price_id: priceId }),
      });

      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error("Subscription error:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, button: false }));
    }
  };

  if (isLoading.page) {
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
        Up to <span className="text-[#D1A75D] font-bold">33%</span> off for first subscription
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {Object.entries(PLANS).map(([planKey, plan]) => (
          <div 
            key={planKey}
            className={`bg-[#3A1818] rounded-lg p-6 border-2 ${selectedPlan === planKey ? "border-[#D1A75D]" : "border-transparent"} transition-all cursor-pointer`}
            onClick={() => setSelectedPlan(planKey)}
          >
            <div className="flex justify-between items-start">
              <div>
                {plan.highlight && (
                  <div className="bg-[#D1A75D] text-[#4B1F1F] px-2 py-1 rounded text-xs font-bold inline-block mb-2">
                    BEST VALUE
                  </div>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
              </div>
            </div>
            
            <div className="mt-4">
              {plan.originalPrice && (
                <p className="text-[#E7D8C1]/60 line-through">{plan.originalPrice}</p>
              )}
              <p className="text-2xl font-bold">{plan.price}</p>
              {plan.description && (
                <p className="text-sm mt-2">{plan.description}</p>
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubscribe(plan.stripePriceId);
              }}
              disabled={isLoading.button}
              className={`w-full mt-6 py-2 rounded font-bold ${selectedPlan === planKey ? "bg-[#D1A75D] text-[#4B1F1F]" : "bg-[#2e1414] text-[#E7D8C1]"}`}
            >
              {isLoading.button ? "Processing..." : "Select Plan"}
            </button>
          </div>
        ))}
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