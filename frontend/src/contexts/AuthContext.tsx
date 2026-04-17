/**
 * AuthContext.tsx — единый контекст для авторизации.
 *
 * Зачем он нужен:
 * - чтобы не передавать user/login/logout через кучу пропсов;
 * - чтобы все компоненты получали авторизацию из одного источника;
 * - чтобы состояние пользователя было единым для всего приложения.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { saveTokens, clearTokens } from '../services/api';
import {
  getCurrentUser,
  loginRequest,
  registerRequest,
} from '../services/auth';
import type { IUser } from '../types';

interface AuthContextValue {
  user: IUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password1: string,
    password2: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
  const data = await loginRequest(email, password);

  saveTokens(data.access, data.refresh);

  setUser(data.user);
};



  const register = async (
    username: string, 
    email: string,
    password1: string,
    password2: string) => {
  const data = await registerRequest(username, email, password1, password2);

  saveTokens(data.access, data.refresh);

  setUser(data.user);
};


  const logout = async () => {
  clearTokens();
  setUser(null);
};


  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }

  return context;
};
