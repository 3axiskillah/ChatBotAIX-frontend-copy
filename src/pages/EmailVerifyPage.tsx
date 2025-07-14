import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function EmailVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("status");

  useEffect(() => {
    if (status === "sent") {
      toast.success("Verification email sent! Check your inbox.");
    } else if (status === "invalid") {
      toast.error("Invalid or expired verification link");
    } else if (status === "error") {
      toast.error("Activation failed. Please try again.");
    }
  }, [status]);

  const getMessage = () => {
    switch (status) {
      case "sent": return "Check your email for the verification link";
      case "invalid": return "Invalid or expired verification link";
      case "error": return "Activation failed - please try again";
      default: return "Email verification";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#4B1F1F]">
      <div className="p-8 max-w-md w-full bg-[#3A1A1A] rounded-lg border border-[#D1A75D] text-center">
        <h2 className="text-2xl font-bold text-[#D1A75D] mb-4">
          {status === "sent" ? "Check Your Email" : "Account Verification"}
        </h2>
        <p className="text-[#E7D8C1] mb-6">{getMessage()}</p>

        {status === "invalid" && (
          <button
            onClick={() => navigate("/accounts/register")}
            className="w-full py-2 bg-[#D1A75D] text-[#4B1F1F] rounded hover:bg-[#b88b35]"
          >
            Register Again
          </button>
        )}
      </div>
    </div>
  );
}