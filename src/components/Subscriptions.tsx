// Subscriptions.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function Subscriptions() {
  const navigate = useNavigate();
  const stripeContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

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

    if (!subscriptionStatus?.is_premium) {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/pricing-table.js";
      script.async = true;

      script.onload = () => {
        if (stripeContainerRef.current) {
          stripeContainerRef.current.innerHTML = `
            <stripe-pricing-table
              pricing-table-id="prctbl_1RiuLODGzHpWMy7sJ1ZNtgFz"
              publishable-key="pk_live_51QbghtDGzHpWMy7sKMwPXAnv82i3nRvMqejIiNy2WNnXmlyLZ5pAcmykuB7hWO8WwpS9nT1hpeuvvWQdRyUpg2or00x6xR1JgX"
              client-reference-id="${localStorage.getItem('user_id')}"
              customer-email="${localStorage.getItem('user_email')}"
            ></stripe-pricing-table>
          `;
        }
      };

      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [subscriptionStatus?.is_premium]);
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
        Get an Exclusive Discount Today!
      </h1>
      <p className="text-[#E7D8C1] mb-8 text-center text-lg">
        Up to <span className="text-[#D1A75D] font-bold">70%</span> off for your first subscription
      </p>

      <div className="w-full overflow-x-auto flex justify-center">
        <div
          ref={stripeContainerRef}
          style={{ minWidth: "900px" }}
        ></div>
      </div>

      <div className="mt-12 text-sm text-[#E7D8C1] text-center space-y-2">
        <p>✅ No adult transaction in your bank statement</p>
        <p>✅ No hidden fees · Cancel anytime</p>
      </div>

      <button
        onClick={() => navigate("/chat")}
        className="mt-8 px-6 py-3 bg-[#D1A75D] text-[#4B1F1F] rounded-xl font-semibold hover:bg-[#c49851] transition"
      >
        Back to Chat
      </button>

      <div className="mt-4 text-center">
        <a
          href="https://billing.stripe.com/p/login/test_4gM7sN62J7ou0nz26r00000"
          target="_blank"
          rel="noreferrer"
          className="text-[#D1A75D] hover:underline"
        >
          Manage My Subscription
        </a>
      </div>
    </div>
  );
}