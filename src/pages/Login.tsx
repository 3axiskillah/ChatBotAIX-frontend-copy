import { useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";

export default function Login({
  onClose,
  onSwitchToRegister,
}: {
  onClose?: () => void;
  onSwitchToRegister?: () => void;
}) {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/accounts/login/", {
        method: "POST",
        body: JSON.stringify(form),
      });

      toast.success("Logged in successfully!");

      const userData = await apiFetch("/api/accounts/me/");

      const anonChat = sessionStorage.getItem("anon_chat");
      const cameFromLanding = sessionStorage.getItem("amber_chat_initialized");

      // Only migrate if chat exists and it's not an admin
      if (anonChat && cameFromLanding && !userData.is_admin) {
        try {
          await apiFetch("/api/chat/migrate_anon/", {
            method: "POST",
            body: JSON.parse(anonChat),
          });
          console.log("✅ Migrated anonymous chat");
          sessionStorage.removeItem("anon_chat");
          sessionStorage.removeItem("amber_chat_initialized");
        } catch (err) {
          console.warn("Migration failed (non-critical):", err);
        }
      }

      // Admin users go to dashboard
      if (userData.is_admin) {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/chat";
      }

      if (onClose) onClose();
    } catch (err) {
      console.error("Login failed:", err);
      toast.error("Invalid email or password.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#4B1F1F] p-8 rounded-2xl shadow-2xl w-full max-w-md text-[#E7D8C1] border border-[#D1A75D]"
    >
      <h2 className="text-3xl font-extrabold text-center text-[#D1A75D] mb-2">
        Welcome Back!
      </h2>
      <p className="text-center text-[#E7D8C1]/70 mb-6">
        Sign in to continue your journey
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className="w-full px-4 py-2 border border-[#D1A75D] bg-[#3A1A1A] text-[#E7D8C1] rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className="w-full px-4 py-2 border border-[#D1A75D] bg-[#3A1A1A] text-[#E7D8C1] rounded-lg"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#D1A75D] text-[#4B1F1F] py-2 rounded-lg hover:bg-[#b88b35] font-semibold"
        >
          Sign In
        </button>
      </div>
      <p className="text-center text-sm text-[#E7D8C1]/70 mt-4">
        Don’t have an account?{" "}
        <span
          className="text-[#D1A75D] hover:underline cursor-pointer"
          onClick={() => {
            if (onClose) onClose();
            if (onSwitchToRegister) onSwitchToRegister();
          }}
        >
          Sign Up
        </span>
      </p>
    </form>
  );
}
