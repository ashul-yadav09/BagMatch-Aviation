import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { safeStorage } from '../services/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { full_name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = safeStorage.getItem('bagmatch_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Failed retrieving session:', err);
      safeStorage.removeItem('bagmatch_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  const register = async (data: { full_name: string; email: string; password: string; phone?: string }) => {
    const res = await api.register(data);
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const quickLogin = async (role: UserRole) => {
    if (role === 'passenger') {
      await login('emma.watson@example.com', 'Passenger2026!');
    } else if (role === 'staff') {
      await login('officer.jenkins@bagmatch.aero', 'StaffPass2026!');
    } else if (role === 'admin') {
      await login('admin@bagmatch.aero', 'AeroAdmin2026!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        quickLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
