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
      setUser({
        id: session.user.id || '',
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        company: session.user.company,
        twoFactorEnabled: session.user.twoFactorEnabled || false,
        requiresTwoFactor: session.user.requiresTwoFactor || false,
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