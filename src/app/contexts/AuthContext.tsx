'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/types/api';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresTwoFactor?: boolean; userId?: string; error?: string }>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  isLoading: boolean;
  // NextAuth統合用の追加プロパティ
  nextAuthSession: any;
  isNextAuthAuthenticated: boolean;
  registerUser: (userData: {
    name: string;
    email: string;
    password: string;
    company?: string;
  }) => Promise<{ success: boolean; error?: string; user?: any }>;
  // 2FA関連の新機能
  verifyTwoFactor: (userId: string, token: string, isBackupCode?: boolean) => Promise<{ success: boolean; error?: string }>;
  requiresTwoFactor: boolean;
  setRequiresTwoFactor: (requires: boolean) => void;
  // ソーシャルログイン関連の新機能
  socialLoginProvider: string | null;
  socialLoginProviderId: string | null;
  getSocialProviderName: (provider: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [socialLoginProvider, setSocialLoginProvider] = useState<string | null>(null);
  const [socialLoginProviderId, setSocialLoginProviderId] = useState<string | null>(null);
  
  // NextAuth.jsセッション統合
   const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const isNextAuthAuthenticated = !!nextAuthSession && !requiresTwoFactor;

  // ソーシャルプロバイダー名の取得（GitHubを削除）
  const getSocialProviderName = (provider: string): string => {
    switch (provider) {
      case 'google': return 'Google';
      case 'azure-ad': return 'Microsoft';
      case 'credentials': return 'メールアドレス';
      case '2fa-verification': return '2要素認証';
      default: return provider;
    }
  };

  // プロバイダー別のデフォルト部署を取得（GitHubを削除）
  const getDepartmentByProvider = (provider: string): string => {
    switch (provider) {
      case 'google': return 'Google Workspace';
      case 'azure-ad': return 'Microsoft 365';
      default: return '開発部';
    }
  };

  // プロバイダー別のサブスクリプションプランを取得（GitHubを削除）
  const getSubscriptionPlanByProvider = (provider: string): 'free' | 'basic' | 'premium' | 'enterprise' => {
    switch (provider) {
      case 'google': return 'premium';
      case 'azure-ad': return 'enterprise';
      default: return 'basic';
    }
  };

  // プロバイダー別の機能を取得（GitHubを削除）
  const getFeaturesByProvider = (provider: string): string[] => {
    switch (provider) {
      case 'google': return ['Google統合', 'カレンダー連携', 'ドライブ連携'];
      case 'azure-ad': return ['Microsoft統合', 'Teams連携', 'SharePoint連携'];
      default: return ['基本機能', 'アラート機能'];
    }
  };

  // プロバイダー別の制限を取得（GitHubを削除）
  const getLimitsByProvider = (provider: string) => {
    switch (provider) {
      case 'google':
      case 'azure-ad':
        return {
          teamMembers: 100,
          reports: 10,
          storage: 5120
        };
      default:
        return {
          teamMembers: 20,
          reports: 4,
          storage: 1024
        };
    }
  };

  // NextAuth.jsセッションからユーザー情報を同期
  useEffect(() => {
    if (nextAuthSession?.user && !user) {
      // 2FA検証が必要かチェック（カスタムプロパティの安全な確認）
      const userWithCustomProps = nextAuthSession.user as any;
      if (userWithCustomProps.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setIsLoading(false);
        return;
      }

      // ソーシャルログイン情報の取得
      const provider = userWithCustomProps.provider || 'credentials';
      const providerId = userWithCustomProps.providerId || null;
      
      setSocialLoginProvider(provider);
      setSocialLoginProviderId(providerId);

      // NextAuth.jsのセッションから既存のUser型に変換
      const nextAuthUser: User = {
        id: nextAuthSession.user.id || 'nextauth-user',
        email: nextAuthSession.user.email || '',
        name: nextAuthSession.user.name || '',
        avatar: (nextAuthSession.user as any).image || '/api/placeholder/40/40',
        role: 'member',
        department: (nextAuthSession.user as any).company || getDepartmentByProvider(provider),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
          id: `sub-${nextAuthSession.user.id}`,
          plan: getSubscriptionPlanByProvider(provider),
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          features: getFeaturesByProvider(provider),
          limits: getLimitsByProvider(provider)
        }
      };
      
      setUser(nextAuthUser);
      setRequiresTwoFactor(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(nextAuthUser));
        localStorage.setItem('socialProvider', provider);
        if (providerId) {
          localStorage.setItem('socialProviderId', providerId);
        }
      }
      console.log('✅ NextAuth.jsセッションからユーザー情報を同期:', {
        user: nextAuthUser,
        provider,
        providerId
      });
    }
  }, [nextAuthSession, user]);

  // 既存のローカルストレージからの復元
  useEffect(() => {
    if (typeof window !== 'undefined' && !nextAuthSession) {
      const savedUser = localStorage.getItem('user');
      const savedProvider = localStorage.getItem('socialProvider');
      const savedProviderId = localStorage.getItem('socialProviderId');
      
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
          setSocialLoginProvider(savedProvider);
          setSocialLoginProviderId(savedProviderId);
          
          console.log('✅ ローカルストレージから認証状態復元:', {
            user: completeUser,
            provider: savedProvider,
            providerId: savedProviderId
          });
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('socialProvider');
          localStorage.removeItem('socialProviderId');
        }
      }
    }
    
    // NextAuth.jsの読み込み完了を待つ
    if (nextAuthStatus !== 'loading') {
      setIsLoading(false);
    }
  }, [nextAuthSession, nextAuthStatus]);

  const login = async (email: string, password: string): Promise<{ success: boolean; requiresTwoFactor?: boolean; userId?: string; error?: string }> => {
    console.log('🔐 Login attempt:', { email, password });
    
    try {
      // まずNextAuth.jsで認証を試行
      const nextAuthResult = await nextAuthSignIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (nextAuthResult && !nextAuthResult.error) {
        // 2FA確認のためのAPI呼び出し
        const checkResponse = await fetch('/api/auth/check-2fa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email })
        });

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          
          if (checkData.requiresTwoFactor) {
            // 2FA認証が必要
            setRequiresTwoFactor(true);
            console.log('🔐 2FA認証が必要です');
            return { 
              success: false, 
              requiresTwoFactor: true, 
              userId: checkData.userId 
            };
          }
        }

        console.log('✅ NextAuth.js login successful');
        setRequiresTwoFactor(false);
        setSocialLoginProvider('credentials');
        setSocialLoginProviderId(null);
        return { success: true };
      }

      // NextAuth.jsで失敗した場合、既存のモックユーザーで試行
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

      console.log('👥 Fallback to mock users:', mockUsers.map(u => ({ email: u.email, role: u.role })));

      const foundUser = mockUsers.find(u => u.email === email);
      console.log('🔍 Found user:', foundUser ? { email: foundUser.email, role: foundUser.role } : 'Not found');
      
      const validPasswords = ['demo123', 'admin123', 'manager123'];
      const isValidPassword = validPasswords.includes(password);
      
      console.log('🔑 Password validation:', { password, isValid: isValidPassword });
      
      if (foundUser && isValidPassword) {
        console.log('✅ Mock login successful');
        setUser(foundUser);
        setRequiresTwoFactor(false);
        setSocialLoginProvider('credentials');
        setSocialLoginProviderId(null);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(foundUser));
          localStorage.setItem('socialProvider', 'credentials');
        }
        return { success: true };
      }
      
      console.log('❌ Login failed');
      return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' };
    } catch (error) {
      console.error('💥 Login error:', error);
      return { success: false, error: 'ログイン処理中にエラーが発生しました' };
    }
  };

  const verifyTwoFactor = async (userId: string, token: string, isBackupCode: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 2FA verification attempt:', { userId, isBackupCode });

      const result = await nextAuthSignIn('2fa-verification', {
        userId,
        token: token.trim(),
        isBackupCode: isBackupCode.toString(),
        redirect: false
      });

      if (result && !result.error) {
        console.log('✅ 2FA verification successful');
        setRequiresTwoFactor(false);
        setSocialLoginProvider('2fa-verification');
        return { success: true };
      } else {
        console.log('❌ 2FA verification failed:', result?.error);
        return { 
          success: false, 
          error: isBackupCode ? 'バックアップコードが正しくありません' : '認証コードが正しくありません' 
        };
      }
    } catch (error) {
      console.error('💥 2FA verification error:', error);
      return { success: false, error: '認証処理中にエラーが発生しました' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // NextAuth.jsセッションがある場合はサインアウト
      if (nextAuthSession) {
        await nextAuthSignOut({ redirect: false });
        console.log('✅ NextAuth.js logout successful');
      }
      
      // ローカル状態をクリア
      setUser(null);
      setRequiresTwoFactor(false);
      setSocialLoginProvider(null);
      setSocialLoginProviderId(null);
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('socialProvider');
        localStorage.removeItem('socialProviderId');
      }
      console.log('✅ Local logout successful');
    } catch (error) {
      console.error('💥 Logout error:', error);
    }
  };

  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // 新規登録機能（NextAuth.js統合）
  const registerUser = async (userData: {
    name: string;
    email: string;
    password: string;
    company?: string;
  }): Promise<{ success: boolean; error?: string; user?: any }> => {
    try {
      console.log('📝 Registration attempt:', { 
        name: userData.name, 
        email: userData.email,
        company: userData.company 
      });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Registration successful:', data.user);
        return { 
          success: true, 
          user: data.user 
        };
      } else {
        console.log('❌ Registration failed:', data.error);
        return { 
          success: false, 
          error: data.error || '新規登録に失敗しました' 
        };
      }
    } catch (error) {
      console.error('💥 Registration error:', error);
      return { 
        success: false, 
        error: '新規登録中にエラーが発生しました。もう一度お試しください。' 
      };
    }
  };

 // isAuthenticated を計算済みの値として定義
  const calculatedIsAuthenticated = (user !== null || isNextAuthAuthenticated) && !requiresTwoFactor;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: calculatedIsAuthenticated,
      login, 
      logout, 
      updateUser, 
      isLoading: isLoading || nextAuthStatus === 'loading',
      // NextAuth統合用の追加プロパティ
      nextAuthSession,
      isNextAuthAuthenticated,
      registerUser,
      // 2FA関連の新機能
      verifyTwoFactor,
      requiresTwoFactor,
      setRequiresTwoFactor,
      // ソーシャルログイン関連の新機能
      socialLoginProvider,
      socialLoginProviderId,
      getSocialProviderName
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