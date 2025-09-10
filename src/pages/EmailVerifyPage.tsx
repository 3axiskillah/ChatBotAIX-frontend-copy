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
      case "sent":
        return "Check your email for the verification link";
      case "invalid":
        return "Invalid or expired verification link";
      case "error":
        return "Activation failed - please try again";
      default:
        return "Email verification";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="p-8 max-w-md w-full bg-gray-900 rounded-lg border border-red-600 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          {status === "sent" ? "Check Your Email" : "Account Verification"}
        </h2>
        <p className="text-gray-300 mb-6">{getMessage()}</p>

        {status === "invalid" && (
          <button
            onClick={() => navigate("/accounts/register")}
            className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Register Again
          </button>
        )}
      </div>
    </div>
  );
}
