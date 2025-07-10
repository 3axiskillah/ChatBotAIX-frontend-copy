import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function EmailVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("status");

  useEffect(() => {
    const verifyAndLogin = async () => {
      if (status !== "success") return;

      toast.success("✅ Email verified! Logging you in…");

      const savedUsername = localStorage.getItem("pending_username");
      const savedPassword = localStorage.getItem("pending_password");

      if (!savedUsername || !savedPassword) {
        navigate("/accounts/login");
        return;
      }

      try {
        const res = await fetch("/api/accounts/login/", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: savedUsername,
            password: savedPassword,
          }),
        });

        if (!res.ok) throw new Error("Login failed");

        // 🧠 Get user data
        const userRes = await fetch("/api/accounts/me/", {
          credentials: "include",
        });
        const user = await userRes.json();

        // ✅ Migrate anon chat if needed
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

        // 🔐 Clean up
        localStorage.removeItem("pending_username");
        localStorage.removeItem("pending_password");

        // 🎯 Redirect based on user type
        if (user?.is_superuser) {
          navigate("/admin/dashboard");
        } else {
          navigate("/chat");
        }
      } catch (error) {
        console.error(error);
        toast.error("❌ Could not log in — please sign in manually.");
        navigate("/accounts/login");
      }
    };

    verifyAndLogin();
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
