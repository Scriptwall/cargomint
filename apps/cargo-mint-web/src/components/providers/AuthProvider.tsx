"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  login: (token: string, userData: any) => void;
  logout: () => void;
  getAuthToken: () => string;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for cookie and user data in localStorage
    const userData = localStorage.getItem('cm_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  const resolvePortalPath = (userData: any) => {
    const roles = Array.isArray(userData?.roles) ? userData.roles : [];
    const userType = (userData?.userType ?? '').toString().toLowerCase();

    if (roles.includes('Admin') || roles.includes('SuperAdmin')) return '/admin-console';
    if (roles.includes('TenantAdmin')) return '/tenant-console';
    if (roles.includes('Operator') || roles.includes('ServiceCentreAdmin') || roles.includes('DeskOperator') || roles.includes('HubManager')) return '/ops-dashboard';
    if (roles.includes('Partner') || userType === 'partner') return '/merchant-portal';
    if (roles.includes('Captain') || userType === 'captain' || userType === 'systemuser') return '/captain-portal';
    return '/consumer-portal';
  };

  const getAuthToken = () => {
    const tokenCookie = document.cookie
      .split('; ')
      .find((item) => item.startsWith('auth_token='))
      ?.split('=')[1];

    if (tokenCookie) {
      return tokenCookie;
    }

    return localStorage.getItem('cm_token') ?? '';
  };

  const login = (token: string, userData: any) => {
    // Set cookie (client side for simplicity in this demo, real world uses HttpOnly)
    document.cookie = `auth_token=${token}; path=/; max-age=3600; SameSite=Lax`;
    const portalPath = resolvePortalPath(userData);
    const destination = userData?.mustChangePassword ? '/set-password' : portalPath;
    document.cookie = `cm_portal=${destination}; path=/; max-age=3600; SameSite=Lax`;
    localStorage.setItem('cm_token', token);
    localStorage.setItem('cm_user', JSON.stringify(userData));
    setUser(userData);
    router.push(destination);
  };

  const logout = () => {
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "cm_portal=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem('cm_token');
    localStorage.removeItem('cm_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getAuthToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
