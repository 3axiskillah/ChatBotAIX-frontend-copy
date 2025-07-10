import { useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Login({
  onClose,
  onSwitchToRegister,
}: {
  onClose?: () => void;
  onSwitchToRegister?: () => void;
}) {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Login
      await apiFetch("/api/accounts/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      toast.success("Logged in successfully!");

      // Fetch user data
      const userData = await apiFetch("/api/accounts/me/", {
        method: "GET",
        credentials: "include",
      })

      // Migrate anonymous chat
      const migrationFlag = localStorage.getItem("anon_migration_needed");
      const anonChat = sessionStorage.getItem("anon_chat");

      if (migrationFlag === "true" && anonChat) {
        await apiFetch("/api/chat/migrate_anon/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: anonChat,
        });
        sessionStorage.removeItem("anon_chat");
        localStorage.removeItem("anon_migration_needed");
        console.log("✅ Migrated anonymous chat to new user account");
      }

      if (onClose) onClose();
      navigate(userData.is_admin ? "/admin/dashboard" : "/chat");
    } catch (err) {
      console.error(err);
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
        Don’t have an account?{' '}
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
