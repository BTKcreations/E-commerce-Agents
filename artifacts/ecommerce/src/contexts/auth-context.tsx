import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useGetAuthMe, getGetAuthMeQueryKey } from '@workspace/api-client-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(null);
  
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  }, []);

  const { data: userData, isLoading, isError } = useGetAuthMe({
    query: {
      queryKey: getGetAuthMeQueryKey(),
      enabled: !!token,
      retry: false
    }
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if (isError) {
      logout();
    }
  }, [userData, isError, logout]);

  const login = (userData: User, newToken: string) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('auth_token', newToken);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
