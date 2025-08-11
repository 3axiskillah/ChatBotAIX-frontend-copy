import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function BillingSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Prevent scroll during processing
    document.body.style.overflow = 'hidden';
    
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");

      try {
        if (!sessionId) throw new Error("Missing session ID");

        // 1. Confirm payment with backend
        const confirmResponse = await apiFetch(`/api/billing/confirm/?session_id=${sessionId}`);
        if (!confirmResponse.success) throw new Error("Payment confirmation failed");

        // 2. Refresh user data (using your existing endpoint)
        const userData = await apiFetch("/api/accounts/me/?force_refresh=true");
        
        // 3. Verify premium status
        if (!userData?.is_premium) {
          throw new Error("Premium status not activated");
        }

        // 4. Immediate redirect to chat
        window.location.href = "/chat?payment_success=true";

      } catch (err) {
        console.error("Payment verification error:", err);
        window.location.href = "/addons?payment_error=true";
      } finally {
        document.body.style.overflow = '';
      }
    };

    verifyPayment();

    return () => {
      document.body.style.overflow = '';
    };
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#4B1F1F] text-[#E7D8C1]">
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D1A75D] mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-[#D1A75D]">Processing Payment</h1>
        <p className="mt-2">Upgrading your experience...</p>
      </div>
    </div>
  );
}