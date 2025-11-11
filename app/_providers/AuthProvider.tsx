'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import jwtDecode from 'jwt-decode'; // ✅ version CJS, pas d'accolades

type Role = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'HOSPITAL' | 'ADMIN';

type Decoded = {
  sub: string;
  email: string;
  role?: Role;
  avatarUrl?: string;
  fullName?: string;
};

type AuthUser = {
  id: string;
  email: string;
  role?: Role;
  avatarUrl?: string | null;
  fullName?: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void; // ✅ nouveau
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('token');
    if (stored) {
      try {
        const decoded = jwtDecode<Decoded>(stored);
        setToken(stored);
        setUser({
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          avatarUrl: decoded.avatarUrl ?? null,
          fullName: decoded.fullName ?? null,
        });
      } catch {
        localStorage.removeItem('token');
      }
    }
  }, []);

  function login(newToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
    }
    try {
      const decoded = jwtDecode<Decoded>(newToken);
      setToken(newToken);
      setUser({
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        avatarUrl: decoded.avatarUrl ?? null,
        fullName: decoded.fullName ?? null,
      });
    } catch {
      // ignore
    }
  }

  function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setUser(null);
  }

  // ✅ pour mettre à jour depuis /account
  function updateUser(partial: Partial<AuthUser>) {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}