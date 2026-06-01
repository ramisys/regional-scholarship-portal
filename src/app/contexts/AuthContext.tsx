import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { setAccessToken, clearAccessToken } from '../utils/authStore';

interface User {
  id: string;
  email: string;
  role: 'student' | 'coordinator';
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'student' | 'coordinator';
  honeypot?: string;
  profile?: { full_name?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeUser = (u: any) => {
    if (!u) return null;
    const p = u.profile || {};
    const full = p.full_name || '';
    const parts = full.split(' ').filter(Boolean);
    const firstName = parts.length ? parts[0] : '';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      firstName,
      lastName,
      profile: p,
    };
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        // Try to obtain access token via httpOnly refresh cookie
        const refreshResp = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (refreshResp.ok) {
          const json = await refreshResp.json();
          const access = json?.data?.access ?? json?.access;
          if (access) {
            setAccessToken(access);
          }
        }

        const response = await api.get('/auth/profile');
        const raw = response.data?.data ?? response.data;

        if (isMounted) {
          const n = normalizeUser(raw);
          setUser(n);
          localStorage.setItem('user', JSON.stringify(n));
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
          clearAccessToken();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await resp.json();

      if (!resp.ok) {
        const error = new Error(json?.message || 'Login failed');
        (error as any).response = { status: resp.status, data: json };
        throw error;
      }

      const payload = json?.data ?? json;
      const newToken = payload?.access;
      const newUser = payload?.user;

      if (newToken) {
        setAccessToken(newToken);
        setToken(newToken);
      }

      if (newUser) {
        const n = normalizeUser(newUser);
        setUser(n);
        localStorage.setItem('user', JSON.stringify(n));
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    if (data.honeypot) {
      throw new Error('Invalid submission');
    }

    try {
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await resp.json();

      if (!resp.ok) {
        const error = new Error(json?.message || 'Registration failed');
        (error as any).response = { status: resp.status, data: json };
        throw error;
      }

      // Auto-login after registration
      await login(data.email, data.password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    try {
      void fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('user');
    clearAccessToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
