import { useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";

export default function Register({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void;
}) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiFetch("/api/accounts/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          anon_id: sessionStorage.getItem("anon_id"),
        }),
        credentials: "include",
      });

      toast.success("✅ Account created! Check your email to verify.");
      sessionStorage.setItem("pending_username", form.username);
      sessionStorage.setItem("pending_password", form.password);
      sessionStorage.setItem("anon_migration_needed", "true");

      // Optionally switch to verify screen
      window.location.href = "/accounts/email-verify?status=sent";
    } catch (err: any) {
      toast.error("❌ Registration failed: " + (err.message || "Unknown error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 text-[#E7D8C1]">
      <input
        name="username"
        type="text"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        className="w-full px-4 py-2 rounded border border-[#D1A75D] bg-[#4B1F1F]"
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="w-full px-4 py-2 rounded border border-[#D1A75D] bg-[#4B1F1F]"
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        className="w-full px-4 py-2 rounded border border-[#D1A75D] bg-[#4B1F1F]"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-[#D1A75D] text-[#4B1F1F] rounded hover:bg-[#c49851] disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register"}
      </button>
      <p className="text-sm text-center mt-2">
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
