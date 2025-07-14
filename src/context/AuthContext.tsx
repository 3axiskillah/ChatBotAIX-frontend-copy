import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type User = {
  id: number;
  email: string;
  username: string;
  is_premium?: boolean;
  is_staff?: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = async (): Promise<void> => {
    try {
      const user = await apiFetch("/api/accounts/me/");
      setUser(user);
    } catch (error) {
      setUser(null);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiFetch("/api/accounts/logout/", { method: "POST" });
      setUser(null);
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await fetchUser();
        
        // If coming from activation, redirect to chat
        if (window.location.pathname.includes('activate') && user) {
          navigate('/chat');
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};