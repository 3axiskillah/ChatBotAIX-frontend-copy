import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function EmailVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("status");

  useEffect(() => {
    if (status === "success") {
      toast.success("✅ Email verified! Logging you in…");

      // grab stored credentials
      const savedUsername = localStorage.getItem("pending_username");
      const savedPassword = localStorage.getItem("pending_password");

      if (savedUsername && savedPassword) {
        // attempt login with saved credentials
        fetch("/api/accounts/login/", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: savedUsername,
            password: savedPassword,
          }),
        })
          .then(async (res) => {
            if (res.ok) {
              // if migration flagged, move the anon conversation
              const migrationFlag = localStorage.getItem("anon_migration_needed");
              const anonChat = sessionStorage.getItem("anon_chat");
              if (migrationFlag === "true" && anonChat) {
                await fetch("/api/chat/migrate_anon/", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: anonChat,
                });
                console.log("✅ Migrated anonymous chat after verify");
                sessionStorage.removeItem("anon_chat");
                localStorage.removeItem("anon_migration_needed");
              }

              // cleanup
              localStorage.removeItem("pending_username");
              localStorage.removeItem("pending_password");

              // redirect
              navigate("/chat");
            } else {
              toast.error("Could not log in automatically — please sign in manually.");
              navigate("/accounts/login");
            }
          })
          .catch(() => {
            toast.error("Network error during auto-login.");
            navigate("/accounts/login");
          });
      } else {
        // no credentials saved, fallback
        navigate("/accounts/login");
      }
    }
  }, [status, navigate]);

  let message = "";
  if (status === "sent") {
    message = "We sent you an email. Please click the link to verify your account.";
  } else if (status === "success") {
    message = "Your email was verified! Logging you in…";
  } else if (status === "invalid") {
    message = "This verification link is invalid or expired.";
  } else if (status === "notfound") {
    message = "We couldn’t find your account.";
  } else {
    message = "Unknown verification status.";
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[#4B1F1F] text-[#E7D8C1]">
      <div className="p-6 border border-[#D1A75D] rounded-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        <p>{message}</p>
      </div>
    </div>
  );
}
