import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function BillingSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing"|"success"|"failed">("processing");

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");

      if (!sessionId) {
        setStatus("failed");
        setTimeout(() => navigate("/subscriptions"), 3000);
        return;
      }

      try {
        // Step 1: Confirm payment with backend
        const { success } = await apiFetch(
          `/api/billing/confirm/?session_id=${sessionId}`
        );

        if (!success) throw new Error("Payment confirmation failed");

        // Step 2: Force refresh all user data
        await Promise.all([
          apiFetch("/api/accounts/me/?force_refresh=true"),
          apiFetch("/api/billing/subscription/status/?force_refresh=true")
        ]);

        // Step 3: Verify premium status
        const userData = await apiFetch("/api/accounts/me/");
        if (!userData?.is_premium) {
          throw new Error("Premium status not activated");
        }

        setStatus("success");
        setTimeout(() => {
          navigate("/chat?payment_success=true", { replace: true });
        }, 2000);

      } catch (err) {
        console.error("Payment verification error:", err);
        setStatus("failed");
        setTimeout(() => {
          navigate("/subscriptions?payment_error=true", { replace: true });
        }, 3000);
      }
    };

    verifyPayment();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#4B1F1F] text-[#E7D8C1]">
      {status === "processing" && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D1A75D] mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-[#D1A75D]">Processing Payment</h1>
          <p className="mt-2">Please wait while we verify your subscription</p>
        </div>
      )}
      
      {status === "success" && (
        <div className="text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-[#D1A75D]">Payment Successful!</h1>
          <p className="mt-2">Redirecting you to your chat...</p>
        </div>
      )}
      
      {status === "failed" && (
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">✗</div>
          <h1 className="text-2xl font-bold text-[#D1A75D]">Verification Failed</h1>
          <p className="mt-2">Your payment was received but we couldn't verify it.</p>
          <p>You'll be redirected to subscriptions page.</p>
        </div>
      )}
    </div>
  );
}