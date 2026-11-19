import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AuthUser,
  loginApi,
  registerApi,
  fetchCurrentUserApi,
  logoutApi,
  updateAdminCredentialsApi,
} from "@/services/api";
import { toast } from "sonner";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthUser | null>;
  register: (data: { name: string; email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateAdminCredentials: (data: {
    currentPassword: string;
    newEmail?: string;
    newPassword?: string;
  }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "ae_auth_token_v1";
const USER_KEY = "ae_auth_user_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start with a server-safe anonymous state. Browser storage is restored only
  // after hydration, so the server and first client render use the same markup.
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore and verify the saved browser session after React has hydrated.
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      if (isMounted) setToken(storedToken);
      try {
        const freshUser = await fetchCurrentUserApi(storedToken);
        if (!isMounted) return;
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        } else {
          setUser(null);
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      } catch (err) {
        console.warn("Session verification warning:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: {
    email: string;
    password: string;
  }): Promise<AuthUser | null> => {
    setIsLoading(true);
    try {
      const res = await loginApi(credentials);
      if (res.success && res.user) {
        setUser(res.user);
        if (res.token) {
          setToken(res.token);
          localStorage.setItem(TOKEN_KEY, res.token);
        }
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        toast.success(`Welcome back, ${res.user.name}!`);
        return res.user;
      }
      return null;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid credentials");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await registerApi(data);
      if (res.success && res.user) {
        setUser(res.user);
        if (res.token) {
          setToken(res.token);
          localStorage.setItem(TOKEN_KEY, res.token);
        }
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        toast.success(`Account created successfully! Welcome, ${res.user.name}`);
        return true;
      }
      return false;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create account");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    toast.success("Signed out successfully");
    await logoutApi(token);
  };

  const updateAdminCredentials = async (data: {
    currentPassword: string;
    newEmail?: string;
    newPassword?: string;
  }): Promise<boolean> => {
    if (!token) {
      toast.error("Your session has expired. Please sign in again.");
      return false;
    }
    try {
      const res = await updateAdminCredentialsApi(token, data);
      setUser(res.user);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      if (res.token) {
        setToken(res.token);
        localStorage.setItem(TOKEN_KEY, res.token);
      }
      toast.success(res.message || "Admin credentials updated");
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update credentials");
      return false;
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        login,
        register,
        logout,
        updateAdminCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
