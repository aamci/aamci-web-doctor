'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Role = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'HOSPITAL' | 'ADMIN' | 'FACILITY_MANAGER' | 'SECRETARY';

type AuthUser = {
  id: string;
  email: string;
  role?: Role;
  fullName?: string | null;
  avatarUrl?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  // Si vide, utilise le proxy Next.js (/api -> localhost:3001)
  return base;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user from backend on mount (cookie is sent automatically)
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const apiBase = getApiBase();
      const url = apiBase ? `${apiBase}/auth/me` : '/api/auth/me';

      const token = localStorage.getItem('token');

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        credentials: 'include',
        headers,
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
        // Clear invalid token
        if (token) {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    // Refetch user after login (cookie is already set by backend)
    await fetchUser();
  };

  const logout = async () => {
    try {
      const apiBase = getApiBase();
      const url = apiBase ? `${apiBase}/auth/logout` : '/api/auth/logout';

      // Get token from localStorage
      const token = localStorage.getItem('token');

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(url, {
        method: 'POST',
        credentials: 'include', // Send cookies with request
        headers,
      });

      // Clear token from localStorage
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (data: Partial<AuthUser>) => {
    setUser((prev) =>
      prev ? { ...prev, ...data } : (data as AuthUser),
    );
  };

  const value: AuthContextValue = {
    user,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Safe hook that returns auth context with fallback for SSR/prerender
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback for SSR/prerender/errors
    return {
      user: null,
      loading: false,
      login: async () => {},
      logout: async () => {},
      updateUser: () => {},
    };
  }
  return ctx;
}
