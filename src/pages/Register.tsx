// Register.tsx
import { useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Register({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      await apiFetch("/api/accounts/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.toLowerCase().trim(),
          password: form.password,
          anon_id: sessionStorage.getItem("anon_id"),
        }),
        credentials: "include",
      });

      toast.success("✅ Account created! Check your email to verify.");
      sessionStorage.setItem("pending_email", form.email);
      sessionStorage.setItem("anon_migration_needed", "true");
      navigate("/accounts/email-verify?status=sent");

    } catch (err: any) {
      const errorMsg = err.message.includes("409") 
        ? "Email already registered" 
        : "Registration failed. Please try again.";
      toast.error(`❌ ${errorMsg}`);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 text-[#E7D8C1]">
      <div className="space-y-2">
        <label className="block text-sm">Username</label>
        <input
          name="username"
          type="text"
          value={form.username}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded border border-[#D1A75D] bg-[#4B1F1F]"
          required
          minLength={3}
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm">Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded border border-[#D1A75D] bg-[#4B1F1F]"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm">Password</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded border border-[#D1A75D] bg-[#4B1F1F]"
          required
          minLength={8}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-[#D1A75D] text-[#4B1F1F] rounded disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register"}
      </button>

      <p className="text-center text-sm">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#D1A75D] underline"
        >
          Login
        </button>
      </p>
    </form>
  );
}