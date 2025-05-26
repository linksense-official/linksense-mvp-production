'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../types/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージから認証情報を復元
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          // 既存のユーザーデータに不足している必須フィールドを追加
          const completeUser: User = {
            ...parsedUser,
            avatar: parsedUser.avatar || '/api/placeholder/40/40',
            status: parsedUser.status || 'active',
            createdAt: parsedUser.createdAt || new Date().toISOString(),
            updatedAt: parsedUser.updatedAt || new Date().toISOString()
          };
          setUser(completeUser);
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          localStorage.removeItem('user');
        }
      }
    }
    setIsLoading(false);
    return undefined;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 Login attempt:', { email, password }); // デバッグログ追加
    
    try {
      // モック認証
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'demo@company.com',
          name: 'デモユーザー',
          avatar: '/api/placeholder/40/40',
          role: 'member',
          department: '開発部',
          status: 'active',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: new Date().toISOString(),
          subscription: {
            id: 'sub_demo_1',
            plan: 'basic',
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: new Date().toISOString(),
            features: ['basicDashboard', 'advancedAnalytics', 'customReports'],
            limits: {
              teamMembers: 20,
              reports: 4,
              storage: 1024
            }
          }
        },
        {
          id: '2',
          email: 'admin@company.com',
          name: '管理者',
          avatar: '/api/placeholder/40/40',
          role: 'admin',
          department: '管理部',
          status: 'active',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: new Date().toISOString(),
          subscription: {
            id: 'sub_admin_1',
            plan: 'enterprise',
            status: 'active',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: new Date().toISOString(),
            features: ['basicDashboard', 'advancedAnalytics', 'predictiveAnalysis', 'customDashboard', 'apiAccess', 'ssoIntegration', 'prioritySupport', 'customReports'],
            limits: {
              teamMembers: -1,
              reports: -1,
              storage: -1
            }
          }
        },
        {
          id: '3',
          email: 'manager@company.com',
          name: 'マネージャー',
          avatar: '/api/placeholder/40/40',
          role: 'manager',
          department: '開発部',
          status: 'active',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: new Date().toISOString(),
          subscription: {
            id: 'sub_manager_1',
            plan: 'premium',
            status: 'active',
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: new Date().toISOString(),
            features: ['basicDashboard', 'advancedAnalytics', 'predictiveAnalysis', 'customDashboard', 'apiAccess', 'prioritySupport', 'customReports'],
            limits: {
              teamMembers: 100,
              reports: -1,
              storage: 10240
            }
          }
        }
      ];

      console.log('👥 Available users:', mockUsers.map(u => ({ email: u.email, role: u.role }))); // デバッグログ

      const foundUser = mockUsers.find(u => u.email === email);
      console.log('🔍 Found user:', foundUser ? { email: foundUser.email, role: foundUser.role } : 'Not found'); // デバッグログ
      
      // パスワード検証を簡素化
      const validPasswords = ['demo123', 'admin123', 'manager123'];
      const isValidPassword = validPasswords.includes(password);
      
      console.log('🔑 Password validation:', { password, isValid: isValidPassword }); // デバッグログ
      
      if (foundUser && isValidPassword) {
        console.log('✅ Login successful'); // デバッグログ
        setUser(foundUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(foundUser));
        }
        return true;
      }
      
      console.log('❌ Login failed'); // デバッグログ
      return false;
    } catch (error) {
      console.error('💥 Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isLoading }}>
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