import { useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Register({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void;
}) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiFetch("/api/accounts/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    } finally {
      setIsLoading(false);
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
        Join us to begin your journey
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Choose a username"
            className="w-full px-4 py-2 border border-[#D1A75D] bg-[#3A1A1A] text-[#E7D8C1] rounded-lg"
            required
            minLength={3}
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
            placeholder="Create a password"
            className="w-full px-4 py-2 border border-[#D1A75D] bg-[#3A1A1A] text-[#E7D8C1] rounded-lg"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#D1A75D] text-[#4B1F1F] py-2 rounded-lg hover:bg-[#b88b35] font-semibold disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#4B1F1F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </span>
          ) : "Register"}
        </button>
      </div>

      <p className="text-center text-sm text-[#E7D8C1]/70 mt-4">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#D1A75D] hover:underline cursor-pointer focus:outline-none"
        >
          Sign In
        </button>
      </p>
    </form>
  );
}