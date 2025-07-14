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
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof LoginForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
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
      // 1. Login
      const loginResponse = await apiFetch("/api/accounts/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.message || "Login failed");
      }

      // 2. Fetch user data
      const userData = await apiFetch("/api/accounts/me/", {
        method: "GET",
        credentials: "include",
      });

      if (!userData.ok) {
        throw new Error("Failed to fetch user data");
      }

      const user = await userData.json();

      // 3. Handle migration (if needed)
      try {
        const migrationFlag = localStorage.getItem("anon_migration_needed");
        const anonChat = sessionStorage.getItem("anon_chat");

        if (migrationFlag === "true" && anonChat) {
          const migrationResponse = await apiFetch("/api/chat/migrate_anon/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: anonChat,
          });

          if (migrationResponse.ok) {
            sessionStorage.removeItem("anon_chat");
            localStorage.removeItem("anon_migration_needed");
          }
        }
      } catch (migrationError) {
        console.warn("Migration failed (non-critical):", migrationError);
      }

      // 4. Show success message
      toast.success("Logged in successfully!");

      // 5. Close modal first (if exists)
      if (onClose) {
        onClose();
        // Small delay to ensure modal is fully closed before navigation
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // 6. Navigate based on user role
      const targetPath = user.is_admin ? "/admin/dashboard" : "/chat";
      console.log("Navigating to:", targetPath);
      navigate(targetPath);
      
    } catch (err: unknown) {
      console.error("Login error:", err);
      
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Invalid email or password";
        
      toast.error(errorMessage);
      
      // Set field-level errors if available
      if (err instanceof Error && err.message.includes("email")) {
        setErrors({ email: err.message });
      } else if (err instanceof Error && err.message.includes("password")) {
        setErrors({ password: err.message });
      }
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
        Welcome Back!
      </h2>
      <p className="text-center text-[#E7D8C1]/70 mb-6">
        Sign in to continue your journey
      </p>
      
      <div className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className={`w-full px-4 py-2 border ${
              errors.email ? "border-red-500" : "border-[#D1A75D]"
            } bg-[#3A1A1A] text-[#E7D8C1] rounded-lg`}
            required
            disabled={isLoading}
            autoComplete="username"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className={`w-full px-4 py-2 border ${
              errors.password ? "border-red-500" : "border-[#D1A75D]"
            } bg-[#3A1A1A] text-[#E7D8C1] rounded-lg`}
            required
            disabled={isLoading}
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-400">{errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#D1A75D] hover:bg-[#b88b35] text-[#4B1F1F] py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#4B1F1F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing In...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </div>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-[#E7D8C1]/70 mt-4">
        Don't have an account?{" "}
        <button
          type="button"
          className="text-[#D1A75D] hover:underline focus:outline-none"
          onClick={() => {
            onClose?.();
            onSwitchToRegister?.();
          }}
          disabled={isLoading}
        >
          Sign Up
        </button>
      </p>
    </form>
  );
}