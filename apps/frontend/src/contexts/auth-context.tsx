'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { User, Role } from '@/types/user'; // Supondo que você tenha um arquivo de tipos

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>; // <-- CORREÇÃO AQUI
  logout: () => void;
  checkPermission: (allowedRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          api.defaults.headers.Authorization = `Bearer ${token}`;
          const response = await api.get('/auth/profile');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user from token', error);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => { // <-- CORREÇÃO AQUI
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    api.defaults.headers.Authorization = `Bearer ${accessToken}`;
    
    setUser(user);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.Authorization;
  };

  const checkPermission = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};