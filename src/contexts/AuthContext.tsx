import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/services/api';

export type UserRole = 'user' | 'admin' | 'distributor' | 'reseller';

export interface UserAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  cpf?: string;
  address?: UserAddress;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  cpf: string;
  address: UserAddress;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await api.get<any>('/api/users/me');
      const mapped: User = {
        id: data._id || data.id,
        name: data.nome || data.name || data.email || '',
        email: data.email || '',
        role: data.role || 'user',
        avatar: data.avatar,
        cpf: data.cpf,
        address: data.address,
      };
      localStorage.setItem('auth_user', JSON.stringify(mapped));
      setUser(mapped);
    } catch {
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        try { setUser(JSON.parse(savedUser)); } catch { /* ignore */ }
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ accessToken: string; refreshToken?: string; token?: string; user: any }>('/api/auth/login', { email, password });
    const token = data.accessToken || data.token;
    if (!token) throw new Error('Token não recebido do servidor');
    const mapped: User = {
      id: data.user._id || data.user.id,
      name: data.user.nome || data.user.name || data.user.email,
      email: data.user.email,
      role: data.user.role || 'user',
      avatar: data.user.avatar,
      cpf: data.user.cpf,
      address: data.user.address,
    };
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(mapped));
    setUser(mapped);
  };

  const register = async (regData: RegisterData) => {
    const data = await api.post<{ accessToken: string; refreshToken?: string; token?: string; user: any }>('/api/auth/register', {
      name: regData.name,
      email: regData.email,
      password: regData.password,
      cpf: regData.cpf,
      address: regData.address,
    });
    const token = data.accessToken || data.token;
    if (token) {
      const mapped: User = {
        id: data.user._id || data.user.id,
        name: data.user.nome || data.user.name || regData.name,
        email: data.user.email || regData.email,
        role: data.user.role || 'user',
        avatar: data.user.avatar,
        cpf: data.user.cpf || regData.cpf,
        address: data.user.address || regData.address,
      };
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(mapped));
      setUser(mapped);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
