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
  const [form, setForm] = useState({ username: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/accounts/login/", {
        method: "POST",
        body: JSON.stringify(form),
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast.success("Logged in successfully!");

      const userData = await apiFetch("/api/accounts/me/");

      const migrationFlag = localStorage.getItem("anon_migration_needed");
      const anonChat = sessionStorage.getItem("anon_chat");

      if (migrationFlag === "true" && anonChat) {
        await apiFetch("/api/chat/migrate_anon/", {
          method: "POST",
          body: JSON.parse(anonChat),
        });
        console.log("✅ Migrated anonymous chat to new user account");
        sessionStorage.removeItem("anon_chat");
        localStorage.removeItem("anon_migration_needed");
      }

      window.location.href = userData.is_admin ? "/admin/dashboard" : "/chat";

      if (onClose) onClose();
    } catch (err) {
      toast.error("Invalid username or password.");
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
          <label className="block text-sm mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter your username"
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
