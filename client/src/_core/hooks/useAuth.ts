import { useState, useCallback, useEffect } from "react";

export interface User {
  id: number;
  openId: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(_options?: UseAuthOptions) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        // Преобразуем данные в формат User
        setUser({
          id: 1,
          openId: "mock-orlova-maria",
          name: data.user.name || "Орлова Мария",
          email: data.user.email || "orlova.maria@example.com",
          role: "user",
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setError("Failed to fetch user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: user !== null,
    logout,
    refresh: fetchUser,
  };
}
