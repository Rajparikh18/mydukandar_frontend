"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "SHOP_OWNER";
  phone?: string;
}

interface Shop {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  shop: Shop | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string; role: string }) => Promise<void>;
  logout: () => void;
  updateShop: (shop: Shop) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser(t: string) {
    try {
      const data = await api<{ user: User; shop: Shop | null }>("/api/auth/me", { token: t });
      setUser(data.user);
      setShop(data.shop);
    } catch {
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await api<{ token: string; user: User; shop: Shop | null }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    setShop(data.shop);
  }

  async function register(regData: { email: string; password: string; name: string; phone?: string; role: string }) {
    const data = await api<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(regData),
    });
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    setShop(null);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setShop(null);
  }

  function updateShop(newShop: Shop) {
    setShop(newShop);
  }

  return (
    <AuthContext.Provider value={{ user, shop, token, loading, login, register, logout, updateShop }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
