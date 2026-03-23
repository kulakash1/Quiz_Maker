import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AuthState, User } from '../types';
import api from '../api';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadFromStorage(): AuthState {
  try {
    const token = localStorage.getItem('quiz_token');
    const userStr = localStorage.getItem('quiz_user');
    if (token && userStr) {
      return { token, user: JSON.parse(userStr) };
    }
  } catch {
    // Ignore
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadFromStorage);

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem('quiz_token', token);
    localStorage.setItem('quiz_user', JSON.stringify(user));
    setAuth({ token, user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    localStorage.removeItem('quiz_state');
    setAuth({ token: null, user: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        login,
        logout,
        isAdmin: auth.user?.role === 'admin',
        isAuthenticated: !!auth.token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// Convenience auth API calls
export const authApi = {
  adminLogin: (username: string, password: string) =>
    api.post('/auth/admin/login', { username, password }),
  register: (username: string, password: string, email: string) =>
    api.post('/auth/register', { username, password, email }),
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
};
