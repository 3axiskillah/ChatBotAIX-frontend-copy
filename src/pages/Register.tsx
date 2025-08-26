import { useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { validateEmail, validatePasswordStrength } from "../utils/security";

type RegisterProps = {
  onSwitchToLogin: () => void;
  onClose?: () => void;
};

export default function Register({ onSwitchToLogin, onClose }: RegisterProps) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (form.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return false;
    }
    if (!validateEmail(form.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    const passwordValidation = validatePasswordStrength(form.password);
    if (!passwordValidation.isValid) {
      toast.error(
        `Password requirements: ${passwordValidation.errors.join(", ")}`
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
      };

      const response = await apiFetch("/api/accounts/register/", {
        method: "POST",
        body: payload,
      });

      if (response.detail) {
        // Store email for verification
        localStorage.setItem("pending_email", form.email);
        toast.success(
          response.detail || "✅ Account created! Check your email."
        );

        if (onClose) onClose();
        navigate("/accounts/email-verify?status=sent");
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md text-white border border-gray-700"
    >
      <h2 className="text-3xl font-extrabold text-center text-red-500 mb-2">
        Create Account
      </h2>
      <p className="text-center text-gray-300 mb-6">Join our community today</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-gray-300">Username</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter 3+ characters"
            className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
            minLength={3}
            maxLength={20}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-300">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-300">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
            minLength={8}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Creating Account...
            </>
          ) : (
            "Register"
          )}
        </button>
      </div>

      <p className="text-center text-sm text-gray-300 mt-4">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-red-400 hover:text-red-300 hover:underline focus:outline-none"
          disabled={isLoading}
        >
          Sign In
        </button>
      </p>
    </form>
  );
}
