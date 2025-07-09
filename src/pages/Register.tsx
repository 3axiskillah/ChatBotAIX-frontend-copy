import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function Register({
  onClose,
  onSwitchToLogin,
}: {
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/api/accounts/register/", {
        method: "POST",
        body: JSON.stringify(form),
        credentials: "include",
      });

      toast.success("Account created! Check your email to verify.");

      const userData = await apiFetch("/api/accounts/me/", {
        credentials: "include",
      });

      const anonChat = sessionStorage.getItem("anon_chat");
      const migrationNeeded = localStorage.getItem("anon_migration_needed");

      if (userData && userData.email && migrationNeeded === "true" && anonChat) {
        await apiFetch("/api/chat/migrate_anon/", {
          method: "POST",
          credentials: "include",
          body: JSON.parse(anonChat),
        });
        sessionStorage.removeItem("anon_chat");
        localStorage.removeItem("anon_migration_needed");
        console.log("✅ Anonymous chat migrated");
      }

      if (onClose) onClose();
      window.location.href = userData.is_admin ? "/admin/dashboard" : "/chat";
    } catch (err) {
      toast.error("Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#4B1F1F] p-8 rounded-2xl shadow-2xl w-full max-w-md text-[#E7D8C1] border border-[#D1A75D]"
    >
      <h2 className="text-3xl font-extrabold text-center text-[#D1A75D] mb-2">
        Create Account
      </h2>
      <p className="text-center text-[#E7D8C1]/70 mb-6">
        Register to unlock full features
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter a username"
            className="w-full px-4 py-2 border border-[#D1A75D] bg-[#3A1A1A] text-[#E7D8C1] rounded-lg"
            required
          />
        </div>
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
            placeholder="Choose a strong password"
            className="w-full px-4 py-2 border border-[#D1A75D] bg-[#3A1A1A] text-[#E7D8C1] rounded-lg"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D1A75D] text-[#4B1F1F] py-2 rounded-lg hover:bg-[#b88b35] font-semibold"
        >
          {loading ? "Creating..." : "Register"}
        </button>
      </div>
      <p className="text-center text-sm text-[#E7D8C1]/70 mt-4">
        Already have an account?{" "}
        <span
          className="text-[#D1A75D] hover:underline cursor-pointer"
          onClick={() => {
            if (onClose) onClose();
            if (onSwitchToLogin) onSwitchToLogin();
          }}
        >
          Sign In
        </span>
      </p>
    </form>
  );
}
