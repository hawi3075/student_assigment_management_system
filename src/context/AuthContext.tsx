import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api.js';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  department?: string;
  bio?: string;
  is_active: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (e) {
          // Token invalid or expired
          logout();
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        return true;
      }
      setError(res.data.error || 'Login failed.');
      return false;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials or server error.');
      return false;
    }
  };

  const register = async (data: any): Promise<boolean> => {
    setError(null);
    try {
      const res = await authApi.register(data);
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        return true;
      }
      setError(res.data.error || 'Registration failed.');
      return false;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.');
      return false;
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        error,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
