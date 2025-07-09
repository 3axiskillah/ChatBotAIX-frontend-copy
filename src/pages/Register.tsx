import { useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";

export default function Register({
  onClose,
  onSwitchToLogin,
}: {
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    re_password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/accounts/register/", {
        method: "POST",
        body: JSON.stringify(form),
      });

      toast.success("Check your email to verify your account before logging in.");

      const anon = sessionStorage.getItem("anon_chat");
      if (anon) {
        localStorage.setItem("anon_migration_needed", "true");
      }

      if (onClose) onClose();
      if (onSwitchToLogin) onSwitchToLogin();
    } catch (err) {
      toast.error("Registration failed. Please check your details.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#4B1F1F] p-8 rounded-2xl shadow-2xl w-full max-w-md text-[#E7D8C1] border border-[#D1A75D]"
    >
      <h2 className="text-3xl font-extrabold text-center text-[#D1A75D] mb-2">
        Create an Account
      </h2>
      <p className="text-center text-[#E7D8C1]/70 mb-6">
        Start chatting with Amber in just a few moments...
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
            placeholder="Create a password"
            className="w-full px-4 py-2 border border-[#D1A75D] bg-[#3A1A1A] text-[#E7D8C1] rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Repeat Password</label>
          <input
            type="password"
            name="re_password"
            value={form.re_password}
            onChange={handleChange}
            placeholder="Repeat your password"
            className="w-full px-4 py-2 border border-[#D1A75D] bg-[#3A1A1A] text-[#E7D8C1] rounded-lg"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#D1A75D] text-[#4B1F1F] py-2 rounded-lg hover:bg-[#b88b35] font-semibold"
        >
          Register
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
