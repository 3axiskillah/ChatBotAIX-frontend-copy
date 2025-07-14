// src/pages/Register.tsx
import { useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";

interface RegisterProps {
  onSwitchToLogin?: () => void;
  onClose?: () => void;
}

export default function Register({ onSwitchToLogin, onClose }: RegisterProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch("/api/accounts/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        toast.success("Registration successful! Please check your email to verify.");
        onClose?.();
        onSwitchToLogin?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#2B1A1A] p-6 rounded-lg w-full max-w-md">
      <h2 className="text-2xl font-bold text-[#D1A75D] mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 bg-[#4B1F1F]/70 border border-[#D1A75D]/30 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-[#4B1F1F]/70 border border-[#D1A75D]/30 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-[#4B1F1F]/70 border border-[#D1A75D]/30 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 bg-[#4B1F1F]/70 border border-[#D1A75D]/30 rounded-lg"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#D1A75D] text-[#4B1F1F] py-3 px-4 rounded-lg font-semibold disabled:opacity-70"
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
      {onSwitchToLogin && (
        <div className="mt-4 text-center text-sm">
          <span className="text-[#E7D8C1]/80">Already have an account? </span>
          <button
            onClick={onSwitchToLogin}
            className="text-[#D1A75D] hover:underline"
          >
            Login
          </button>
        </div>
      )}
    </div>
  );
}