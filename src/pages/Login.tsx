import { useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  onClose?: () => void;
  onSwitchToRegister?: () => void;
}

interface LoginForm {
  email: string;
  password: string;
}

export default function Login({ onClose, onSwitchToRegister }: LoginProps) {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof LoginForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      // ✅ Login via POST
      await apiFetch("/api/accounts/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      // ✅ Fetch user
      const user = await apiFetch("/api/accounts/me/", {
        method: "GET",
        credentials: "include",
      });

      toast.success("Logged in successfully!");

      if (onClose) {
        onClose();
        await new Promise((res) => setTimeout(res, 50));
      }

      const targetPath = user?.is_staff ? "/admin/dashboard" : "/chat";
      navigate(targetPath);
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Login failed, please try again.";

      toast.error(errorMessage);

      if (errorMessage.toLowerCase().includes("email")) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.toLowerCase().includes("password")) {
        setErrors({ password: errorMessage });
      }
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
        Welcome Back!
      </h2>
      <p className="text-center text-gray-300 mb-6">
        Sign in to continue your journey
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-gray-300">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className={`w-full px-4 py-2 border ${
              errors.email ? "border-red-500" : "border-gray-600"
            } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            required
            disabled={isLoading}
            autoComplete="username"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-300">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className={`w-full px-4 py-2 border ${
              errors.password ? "border-red-500" : "border-gray-600"
            } bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            required
            disabled={isLoading}
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-400">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="inline-flex items-center">
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
              Signing In...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </div>

      <p className="text-center text-sm text-gray-300 mt-4">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-red-400 hover:text-red-300 hover:underline focus:outline-none"
          disabled={isLoading}
        >
          Sign Up
        </button>
      </p>
    </form>
  );
}
