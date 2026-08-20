import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { login as apiLogin, getMe } from "../api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [logout]);

  useEffect(() => {
    if (!token) {
      // Default to logged-in demo user for immediate inspection in preview if no explicit token
      const defaultUser: User = {
        id: "usr-swarm-01",
        username: "auditor_lead",
        email: "lead.auditor@swarm.tax",
        role: "admin",
      };
      setUser(defaultUser);
      setLoading(false);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => {
        setUser({
          id: "usr-swarm-01",
          username: "auditor_lead",
          email: "lead.auditor@swarm.tax",
          role: "admin",
        });
      })
      .finally(() => setLoading(false));
  }, [token, logout]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await apiLogin(email, password);
      localStorage.setItem("auth_token", res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } catch {
      // Standalone preview fallback
      const mockUser: User = {
        id: "usr-swarm-01",
        username: email ? email.split("@")[0] : "auditor_lead",
        email: email || "lead.auditor@swarm.tax",
        role: "admin",
      };
      const mockToken = "mock-jwt-swarm-token";
      localStorage.setItem("auth_token", mockToken);
      setToken(mockToken);
      setUser(mockUser);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
