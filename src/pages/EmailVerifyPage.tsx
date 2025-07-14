import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";

export default function EmailVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("status");

  useEffect(() => {
    const completeActivation = async () => {
      if (status === "success") {
        try {
          const user = await apiFetch("/api/accounts/me/", {
            credentials: "include",
          });

          if (!user?.is_active) throw new Error("Account not active");

          // Migrate anonymous chat if flagged
          const migrationFlag = sessionStorage.getItem("anon_migration_needed");
          const anonChat = sessionStorage.getItem("anon_chat");
          if (migrationFlag === "true" && anonChat) {
            await apiFetch("/api/chat/migrate_anon/", {
              method: "POST",
              credentials: "include",
              body: anonChat,
            });
            sessionStorage.removeItem("anon_chat");
            sessionStorage.removeItem("anon_migration_needed");
          }

          sessionStorage.removeItem("pending_email");
          toast.success("🎉 Account activated successfully!");
          navigate(user.is_staff ? "/admin/dashboard" : "/chat");

        } catch (error) {
          console.error("Activation failed:", error);
          toast.error("Activation failed. Please try logging in.");
          navigate("/accounts/login");
        }
      }
    };

    completeActivation();
  }, [status, navigate]);

  const getMessage = () => {
    switch (status) {
      case "sent": return "Check your email for the verification link";
      case "success": return "Finalizing your account...";
      case "invalid": return "Invalid or expired verification link";
      case "error": return "Activation failed - please try again";
      default: return "Verifying your account...";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#4B1F1F]">
      <div className="p-8 max-w-md w-full bg-[#3A1A1A] rounded-lg border border-[#D1A75D] text-center">
        <h2 className="text-2xl font-bold text-[#D1A75D] mb-4">
          {status === "success" ? "Almost There!" : "Account Verification"}
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
