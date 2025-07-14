import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";

export default function EmailVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("status");
  const access = params.get("access");
  const refresh = params.get("refresh");

  useEffect(() => {
    const completeActivation = async () => {
      if (status === "success" && access && refresh) {
        try {
          // ✅ Set tokens manually from URL params (in case not set via redirect)
          document.cookie = `access_token=${access}; path=/; Secure; SameSite=None; HttpOnly`;
          document.cookie = `refresh_token=${refresh}; path=/; Secure; SameSite=None; HttpOnly`;

          // ✅ Fetch user info to confirm login
          const user = await apiFetch("/api/accounts/me/", { credentials: "include" });
          if (!user?.is_active) throw new Error("Account not active");

          // ✅ Migrate anonymous chat if needed
          const migrationFlag = localStorage.getItem("anon_migration_needed");
          const anonChat = sessionStorage.getItem("anon_chat");
          if (migrationFlag === "true" && anonChat) {
            await apiFetch("/api/chat/migrate_anon/", {
              method: "POST",
              credentials: "include",
              body: anonChat,
            });
            sessionStorage.removeItem("anon_chat");
            localStorage.removeItem("anon_migration_needed");
          }

          sessionStorage.removeItem("pending_email");
          toast.success("🎉 Account activated and logged in!");
          navigate(user.is_staff ? "/admin/dashboard" : "/chat");

        } catch (error) {
          console.error("Activation failed:", error);
          toast.error("Activation failed. Please try logging in.");
          navigate("/accounts/login");
        }
      } else if (status === "error" || status === "invalid") {
        toast.error("Activation link invalid or expired.");
      }
    };

    completeActivation();
  }, [status, access, refresh, navigate]);

  const getMessage = () => {
    switch (status) {
      case "sent": return "Check your email for the verification link.";
      case "success": return "Finalizing your account...";
      case "invalid": return "Invalid or expired verification link.";
      case "error": return "Activation failed - please try again.";
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

        {status === "invalid" || status === "error" ? (
          <button
            onClick={() => navigate("/accounts/register")}
            className="w-full py-2 bg-[#D1A75D] text-[#4B1F1F] rounded hover:bg-[#b88b35]"
          >
            Register Again
          </button>
        ) : null}
      </div>
    </div>
  );
}
