'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  company?: string;
  twoFactorEnabled?: boolean;
  requiresTwoFactor?: boolean;
  securityLevel?: number;
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  securityLevel: number;
  twoFactorEnabled: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const loading = status === 'loading';

  useEffect(() => {
    if (session?.user) {
      // 型安全なアクセスのためのキャスト
      const userWithCustomProps = session.user as any;
      
      setUser({
        id: session.user.id || '',
        name: session.user.name,
        email: session.user.email,
        image: userWithCustomProps.image,
        company: userWithCustomProps.company,
        twoFactorEnabled: userWithCustomProps.twoFactorEnabled || false,
        requiresTwoFactor: userWithCustomProps.requiresTwoFactor || false,
        securityLevel: 1, // デフォルト値を設定
      });
    } else {
      setUser(null);
    }
  }, [session]);

  return {
    user,
    loading,
    isAuthenticated: !!session?.user,
    securityLevel: user?.securityLevel || 1,
    twoFactorEnabled: user?.twoFactorEnabled || false,
  };
};