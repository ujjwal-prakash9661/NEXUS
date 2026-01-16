import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_URL } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export type UserRole = "admin" | "moderator" | "user" | "SUPER_ADMIN" | "ADMIN"; // Added explicit admin types just in case
export type UserStatus = "PENDING" | "APPROVED" | "LOCKED";

export interface User {
  id: string;
  name: string;
  email: string;
  nexusId: string; // Added nexusId
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  online: boolean;
  riskScore?: number;
  riskFlags?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  login: (idToken: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure your backend URL here
export const API_BASE_URL = `${API_URL}/api`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("nexus_token");
    const storedUser = localStorage.getItem("nexus_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (idToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (data.token) {
        setToken(data.token);
        localStorage.setItem("nexus_token", data.token);

        // Decode JWT to get user info (you may want to fetch user profile separately)
        // For now, we'll store basic info
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("nexus_user", JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginDemo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.token) {
        setToken(data.token);
        localStorage.setItem("nexus_token", data.token);

        if (data.user) {
          // The backend might return 'status' instead of 'user' object for demo, 
          // or we might need to fetch profile separately. 
          // For now, let's assume we construct a basic user object if missing
          const userData: User = data.user || {
            id: "demo-id",
            name: "Nexus Demo User",
            email: "demo@nexus.sys",
            nexusId: "NEX-DEMO-001",
            role: "user",
            status: "APPROVED",
            online: true
          };
          setUser(userData);
          localStorage.setItem("nexus_user", JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error("Demo Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
      }
    } catch (e) {
      console.error("Logout API failed", e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("nexus_token");
      localStorage.removeItem("nexus_user");
      localStorage.removeItem("nexus_active_tab");
      navigate("/login");
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isModerator = user?.role === "moderator" || user?.role === "admin" || user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isModerator,
        login,
        loginDemo,
        logout,
        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
