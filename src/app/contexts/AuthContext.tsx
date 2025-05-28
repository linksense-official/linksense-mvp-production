'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          const completeUser: User = {
            ...parsedUser,
            avatar: parsedUser.avatar || '/api/placeholder/40/40',
            status: parsedUser.status || 'active',
            createdAt: parsedUser.createdAt || new Date().toISOString(),
            updatedAt: parsedUser.updatedAt || new Date().toISOString(),
            department: parsedUser.department || '開発部',
            settings: parsedUser.settings || {
              notifications: {
                emailNotifications: true,
                pushNotifications: true,
                weeklyReports: true,
                criticalAlerts: true,
                teamUpdates: false
              },
              privacy: {
                shareAnalytics: true,
                anonymizeData: false,
                dataRetention: true,
                exportData: true
              },
              theme: 'light',
              language: 'ja',
              timezone: 'Asia/Tokyo'
            },
            subscription: parsedUser.subscription || {
              id: 'sub-demo-001',
              plan: 'basic',
              status: 'active',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              features: ['基本機能', 'アラート機能'],
              limits: {
                teamMembers: 20,
                reports: 4,
                storage: 1024
              }
            }
          };
          setUser(completeUser);
          console.log('✅ 認証状態復元:', completeUser);
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
    console.log('🔐 Login attempt:', { email, password });
    
    try {
      const mockUsers: User[] = [
        {
          id: 'demo-user',
          email: 'demo@company.com',
          name: 'デモユーザー',
          avatar: '/api/placeholder/40/40',
          role: 'member',
          department: '開発部',
          status: 'active',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-05-25T00:00:00Z',
          settings: {
            notifications: {
              emailNotifications: true,
              pushNotifications: true,
              weeklyReports: true,
              criticalAlerts: true,
              teamUpdates: false
            },
            privacy: {
              shareAnalytics: true,
              anonymizeData: false,
              dataRetention: true,
              exportData: true
            },
            theme: 'light',
            language: 'ja',
            timezone: 'Asia/Tokyo'
          },
          subscription: {
            id: 'sub-demo-001',
            plan: 'basic',
            status: 'active',
            expiresAt: '2025-06-25T00:00:00Z',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-05-25T00:00:00Z',
            features: ['詳細分析', 'アラート機能', 'CSV出力'],
            limits: {
              teamMembers: 20,
              reports: 4,
              storage: 1024
            }
          }
        },
        {
          id: 'admin-user',
          email: 'admin@company.com',
          name: '管理者ユーザー',
          avatar: '/api/placeholder/40/40',
          role: 'admin',
          department: '経営企画',
          status: 'active',
          createdAt: '2024-12-01T00:00:00Z',
          updatedAt: '2025-05-25T00:00:00Z',
          settings: {
            notifications: {
              emailNotifications: true,
              pushNotifications: true,
              weeklyReports: true,
              criticalAlerts: true,
              teamUpdates: true
            },
            privacy: {
              shareAnalytics: true,
              anonymizeData: false,
              dataRetention: true,
              exportData: true
            },
            theme: 'light',
            language: 'ja',
            timezone: 'Asia/Tokyo'
          },
          subscription: {
            id: 'sub-admin-001',
            plan: 'enterprise',
            status: 'active',
            expiresAt: '2026-01-01T00:00:00Z',
            createdAt: '2024-12-01T00:00:00Z',
            updatedAt: '2025-05-25T00:00:00Z',
            features: ['全機能', '専用サポート', 'SSO連携'],
            limits: {
              teamMembers: -1,
              reports: -1,
              storage: -1
            }
          }
        },
        {
          id: 'manager-user',
          email: 'manager@company.com',
          name: 'マネージャーユーザー',
          avatar: '/api/placeholder/40/40',
          role: 'manager',
          department: '人事部',
          status: 'active',
          createdAt: '2025-02-01T00:00:00Z',
          updatedAt: '2025-05-25T00:00:00Z',
          settings: {
            notifications: {
              emailNotifications: true,
              pushNotifications: false,
              weeklyReports: true,
              criticalAlerts: true,
              teamUpdates: true
            },
            privacy: {
              shareAnalytics: false,
              anonymizeData: true,
              dataRetention: true,
              exportData: false
            },
            theme: 'dark',
            language: 'ja',
            timezone: 'Asia/Tokyo'
          },
          subscription: {
            id: 'sub-manager-001',
            plan: 'premium',
            status: 'active',
            expiresAt: '2025-08-01T00:00:00Z',
            createdAt: '2025-02-01T00:00:00Z',
            updatedAt: '2025-05-25T00:00:00Z',
            features: ['予測分析', 'カスタムダッシュボード', 'API連携'],
            limits: {
              teamMembers: 100,
              reports: -1,
              storage: 10240
            }
          }
        }
      ];

      console.log('👥 Available users:', mockUsers.map(u => ({ email: u.email, role: u.role })));

      const foundUser = mockUsers.find(u => u.email === email);
      console.log('🔍 Found user:', foundUser ? { email: foundUser.email, role: foundUser.role } : 'Not found');
      
      const validPasswords = ['demo123', 'admin123', 'manager123'];
      const isValidPassword = validPasswords.includes(password);
      
      console.log('🔑 Password validation:', { password, isValid: isValidPassword });
      
      if (foundUser && isValidPassword) {
        console.log('✅ Login successful');
        setUser(foundUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(foundUser));
        }
        return true;
      }
      
      console.log('❌ Login failed');
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
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated,
      login, 
      logout, 
      updateUser, 
      isLoading 
    }}>
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

export type { AuthContextType };