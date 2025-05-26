'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, APIResponse, LoginResponse } from '@/types/api';
import mockApi from '@/lib/mockApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

function validateAndNormalizeUser(userData: any): User {
  if (!userData || typeof userData !== 'object') {
    throw new Error('無効なユーザーデータです');
  }

  const requiredFields = ['id', 'email', 'name'];
  for (const field of requiredFields) {
    if (!userData[field]) {
      throw new Error(`必須フィールド '${field}' が不足しています`);
    }
  }

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    avatar: userData.avatar || undefined,
    role: userData.role || 'member',
    department: userData.department || '未設定',
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: userData.updatedAt || new Date().toISOString(),
    settings: userData.settings || undefined,
    subscription: userData.subscription || undefined,
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }

        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');

        if (savedUser && savedToken) {
          try {
            const userData = JSON.parse(savedUser);
            const normalizedUser = validateAndNormalizeUser(userData);
            setUser(normalizedUser);
          } catch (parseError) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
          }
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(initializeAuth, 10);
    return () => clearTimeout(timer);
  }, []);

  const login = async (credentials: LoginRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const response: APIResponse<LoginResponse> = await mockApi.login(credentials);

      if (response.success && response.data) {
        const { user: userData, token, refreshToken } = response.data;
        const normalizedUser = validateAndNormalizeUser(userData);
        
        setUser(normalizedUser);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          localStorage.setItem('token', token);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
        }

        return { success: true };
      } else {
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'ログインに失敗しました';
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ログイン処理中にエラーが発生しました';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

  const updateUser = (userData: User) => {
    try {
      const normalizedUser = validateAndNormalizeUser(userData);
      setUser(normalizedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      }
    } catch (error) {
      console.error('ユーザー更新失敗:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};