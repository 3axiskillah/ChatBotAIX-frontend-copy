import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function EmailVerify() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    if (status === "success") {
      alert("✅ Email verified! You can now log in.");
    } else if (status === "invalid") {
      alert("❌ Invalid or expired verification link.");
    } else {
      alert("❌ User not found.");
    }

    // Redirect to login after 3 seconds
    setTimeout(() => {
      navigate("/login");
    }, 3000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#4B1F1F] text-[#E7D8C1]">
      <p className="text-lg">Verifying email...</p>
    </div>
  );
}
