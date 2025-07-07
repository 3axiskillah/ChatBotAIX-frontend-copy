import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Subscriptions() {
  const navigate = useNavigate();
  const stripeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;

    script.onload = () => {
      if (stripeContainerRef.current) {
        stripeContainerRef.current.innerHTML = `
          <stripe-pricing-table
            pricing-table-id="prctbl_1RfNQ1Rmpew7aCdy7XyxyOF7"
            publishable-key="pk_test_51RfN83Rmpew7aCdyjEfExfKKJwnfu1WdusdNbdECFskXUHkA2ChiiYzNgRqp4DKkIxQsoppUZHVikvwdefxhxv41003hlgqZu7"
          ></stripe-pricing-table>
        `;
      }
    };

    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-[#4B1F1F] text-[#E7D8C1] p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-4 text-[#D1A75D] text-center">
        Get an Exclusive Discount Today!
      </h1>
      <p className="text-[#E7D8C1] mb-8 text-center text-lg">
        Up to <span className="text-[#D1A75D] font-bold">70%</span> off for your first subscription
      </p>

      {/* Stripe Pricing Table in scrollable horizontal layout */}
      <div className="w-full overflow-x-auto flex justify-center">
        <div
          ref={stripeContainerRef}
          style={{ minWidth: "900px" }} // force horizontal display
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
