// EmailVerifyPage.tsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";

export default function EmailVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("status");
  const email = params.get("email");

  useEffect(() => {
    const handleVerification = async () => {
      if (status !== "success") return;

      try {
        // Verify the user is actually authenticated
        const user = await apiFetch("/api/accounts/me/", {
          credentials: "include",
        });

        if (user) {
          // Handle chat migration if needed
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

          // Clean up and redirect
          sessionStorage.removeItem("pending_email");
          navigate(user.is_staff ? "/admin/dashboard" : "/chat");
          toast.success("🎉 Welcome! You're now logged in.");
        } else {
          navigate("/accounts/login");
        }
      } catch (error) {
        console.error("Verification error:", error);
        navigate("/accounts/login");
      }
    };

    handleVerification();
  }, [status, navigate]);

  const getMessage = () => {
    switch (status) {
      case "sent":
        return email 
          ? `We've sent a verification link to ${email}`
          : "We've sent you a verification email";
      case "success":
        return "Email verified! Logging you in...";
      case "invalid":
        return "This verification link is invalid or expired";
      case "error":
        return "An error occurred during verification";
      default:
        return "Verification in progress...";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#4B1F1F]">
      <div className="p-8 max-w-md w-full bg-[#3A1A1A] rounded-lg border border-[#D1A75D]">
        <h1 className="text-2xl font-bold text-[#D1A75D] mb-4">
          {status === "success" ? "Verified!" : "Verify Your Email"}
        </h1>
        <p className="text-[#E7D8C1]">{getMessage()}</p>
        
        {status === "invalid" && (
          <button
            onClick={() => navigate("/accounts/register")}
            className="mt-4 w-full py-2 bg-[#D1A75D] text-[#4B1F1F] rounded"
          >
            Register Again
          </button>
        )}
      </div>
    </div>
  );
}