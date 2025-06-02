import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { User, Account, Profile, Session, AuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// 環境設定
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = process.env.NEXTAUTH_URL || (isProduction ? 'https://linksense-mvp.vercel.app' : 'http://localhost:3000');

// データベース接続確認
const isDatabaseAvailable = async (): Promise<boolean> => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured');
      return false;
    }
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

// 拡張User型
interface ExtendedUser extends User {
  id: string;
  email: string;
  name: string;
  company?: string;
  twoFactorEnabled?: boolean;
  requiresTwoFactor?: boolean;
  provider?: string;
  providerId?: string;
}

// IP取得ユーティリティ
function getClientIp(req?: NextRequest): string {
  if (!req) return 'unknown';
  
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  const vercelForwardedFor = req.headers.get('x-vercel-forwarded-for');
  
  return (
    vercelForwardedFor?.split(',')[0]?.trim() ||
    cfConnectingIp ||
    forwardedFor?.split(',')[0]?.trim() ||
    realIp ||
    'unknown'
  );
}

// User Agent取得
function getUserAgent(req?: NextRequest): string {
  return req?.headers.get('user-agent') || 'unknown';
}

// ログイン履歴記録（データベース依存なし）
async function recordLoginHistory(
  userId: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  reason?: string,
  provider?: string,
  metadata?: Record<string, any>
) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      console.log('Login attempt logged (DB unavailable):', { userId, success, reason, provider });
      return;
    }

    await prisma.loginHistory.create({
      data: {
        userId,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        success,
        reason: provider ? `${reason} (${provider})` : reason,
        metadata: metadata ? JSON.stringify({
          ...metadata,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
        }) : null,
      }
    });
  } catch (error) {
    console.error('ログイン履歴記録エラー:', error);
  }
}

// 最終ログイン更新
async function updateLastLogin(userId: string, ipAddress: string) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        loginAttempts: 0,
      }
    });
  } catch (error) {
    console.error('最終ログイン更新エラー:', error);
  }
}

// ログイン試行回数増加
async function incrementLoginAttempts(email: string, ipAddress: string) {
  try {
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) return;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      const newAttempts = (user.loginAttempts || 0) + 1;
      const lockDuration = isProduction ? 60 * 60 * 1000 : 30 * 60 * 1000;
      const shouldLock = newAttempts >= (isProduction ? 3 : 5);

      await prisma.user.update({
        where: { email },
        data: {
          loginAttempts: newAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + lockDuration) : null,
        }
      });
    }
  } catch (error) {
    console.error('ログイン試行回数更新エラー:', error);
  }
}

// NextAuth設定
const authConfig: AuthOptions = {
  // データベースが利用可能な場合のみアダプターを使用
  ...(process.env.DATABASE_URL && { adapter: PrismaAdapter(prisma) }),
  
  session: {
    strategy: 'jwt',
    maxAge: isProduction ? 24 * 60 * 60 : 30 * 24 * 60 * 60,
    updateAge: isProduction ? 60 * 60 : 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name: isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
    callbackUrl: {
      name: isProduction ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
    csrfToken: {
      name: isProduction ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
  },
  
  providers: [
    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
            scope: "openid email profile",
          }
        },
      })
    ] : []),

    // Azure AD OAuth
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID ? [
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        tenantId: process.env.AZURE_AD_TENANT_ID,
        allowDangerousEmailAccountLinking: true,
        authorization: {
          params: {
            scope: "openid email profile",
            prompt: "select_account",
          }
        },
      })
    ] : []),

    // Credentials Provider
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' }
      },
      async authorize(credentials, req): Promise<ExtendedUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const ipAddress = getClientIp(req as NextRequest);
        const userAgent = getUserAgent(req as NextRequest);

        try {
          // データベースが利用できない場合はデモ認証
          const dbAvailable = await isDatabaseAvailable();
          if (!dbAvailable) {
            console.warn('Database not available, using demo authentication');
            if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
              return {
                id: 'demo-user-id',
                email: 'demo@example.com',
                name: 'Demo User',
                company: 'Demo Company',
                twoFactorEnabled: false,
                requiresTwoFactor: false,
                provider: 'credentials'
              };
            }
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user.password) {
            await recordLoginHistory('unknown', ipAddress, userAgent, false, 'ユーザーが見つかりません', 'credentials');
            return null;
          }

          // アカウントロック確認
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            await recordLoginHistory(user.id, ipAddress, userAgent, false, 'アカウントがロックされています', 'credentials');
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            await incrementLoginAttempts(credentials.email, ipAddress);
            await recordLoginHistory(user.id, ipAddress, userAgent, false, 'パスワードが正しくありません', 'credentials');
            return null;
          }

          // 2FA確認
          if (user.twoFactorEnabled) {
            await recordLoginHistory(user.id, ipAddress, userAgent, false, '2FA認証待ち', 'credentials');
            return {
              id: user.id,
              email: user.email,
              name: user.name || user.email,
              company: user.company || undefined,
              twoFactorEnabled: true,
              requiresTwoFactor: true,
              provider: 'credentials'
            };
          }

          // ログイン成功
          await updateLastLogin(user.id, ipAddress);
          await recordLoginHistory(user.id, ipAddress, userAgent, true, 'ログイン成功', 'credentials');

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            company: user.company || undefined,
            twoFactorEnabled: false,
            requiresTwoFactor: false,
            provider: 'credentials'
          };
        } catch (error) {
          console.error('認証エラー:', error);
          await recordLoginHistory('unknown', ipAddress, userAgent, false, '認証システムエラー', 'credentials');
          return null;
        }
      }
    }),
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.company = (user as ExtendedUser).company;
        token.twoFactorEnabled = (user as ExtendedUser).twoFactorEnabled;
        token.requiresTwoFactor = (user as ExtendedUser).requiresTwoFactor;
        token.provider = account?.provider || (user as ExtendedUser).provider;
        token.providerId = account?.providerAccountId || (user as ExtendedUser).providerId;
        
        if (isProduction) {
          token.securityLevel = 'production';
          token.issuedAt = Date.now();
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.company = token.company as string;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.requiresTwoFactor = token.requiresTwoFactor as boolean;
        
        (session.user as any).provider = token.provider as string;
        (session.user as any).providerId = token.providerId as string;
        
        if (isProduction) {
          (session.user as any).securityLevel = token.securityLevel;
          (session.user as any).sessionStart = token.issuedAt;
        }
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      try {
        // 2FA必要時は一時停止
        if ((user as ExtendedUser).requiresTwoFactor) {
          return false;
        }

        // ソーシャルログイン許可（GoogleとAzure ADのみ）
        if (account && ['google', 'azure-ad'].includes(account.provider)) {
          if (!user.email) {
            console.error('ソーシャルログイン: メールアドレスが取得できません');
            return false;
          }

          console.log(`ソーシャルログイン許可: ${user.email} - ${account.provider}`);
          return true;
        }

        return true;
      } catch (error) {
        console.error('サインインコールバックエラー:', error);
        return false;
      }
    },

    async redirect({ url, baseUrl }) {
      if (isProduction) {
        const allowedUrls = [
          baseUrl,
          'https://linksense-mvp.vercel.app',
        ];
        
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }
        
        try {
          const urlObj = new URL(url);
          const isAllowed = allowedUrls.some(allowedUrl => 
            urlObj.origin === new URL(allowedUrl).origin
          );
          
          if (isAllowed) {
            return url;
          } else {
            console.warn('REDIRECT_BLOCKED:', { url, baseUrl });
            return baseUrl;
          }
        } catch {
          return baseUrl;
        }
      }
      
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      const provider = account?.provider || 'unknown';
      console.log(`ユーザー ${user.email} が ${provider} でログインしました`);
      
      if (isNewUser) {
        console.log(`新規ユーザー ${user.email} が ${provider} で作成されました`);
        
        try {
          if (user.id) {
            await recordLoginHistory(
              user.id,
              'unknown',
              'unknown',
              true,
              '新規ユーザー作成',
              provider,
              { isNewUser: true }
            );
          }
        } catch (error) {
          console.error('新規ユーザーログイン履歴記録エラー:', error);
        }
      }

      if (isProduction) {
        console.info('SUCCESSFUL_LOGIN:', {
          userId: user.id,
          email: user.email,
          provider,
          isNewUser,
          timestamp: new Date().toISOString(),
        });
      }
    },

    async createUser({ user }) {
      console.log(`新規ユーザーが作成されました: ${user.email}`);
      
      try {
        const dbAvailable = await isDatabaseAvailable();
        if (dbAvailable) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailVerified: new Date(),
            }
          });
        }

        if (isProduction) {
          console.info('NEW_USER_CREATED:', {
            userId: user.id,
            email: user.email,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('新規ユーザーメール認証設定エラー:', error);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
  
  ...(isProduction && {
    useSecureCookies: true,
    
    logger: {
      error(code: string, metadata?: any) {
        console.error('NEXTAUTH_ERROR:', { code, metadata, timestamp: new Date().toISOString() });
      },
      warn(code: string) {
        console.warn('NEXTAUTH_WARNING:', { code, timestamp: new Date().toISOString() });
      },
      debug(code: string, metadata?: any) {
        // 本番環境ではdebugログは出力しない
      },
    },
  }),
};

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };

// ヘルスチェック関数
export async function healthCheck() {
  try {
    const requiredEnvVars = [
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ];
    
    const missingRequiredEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingRequiredEnvVars.length > 0) {
      return {
        status: 'error',
        message: `Missing required environment variables: ${missingRequiredEnvVars.join(', ')}`,
        timestamp: new Date().toISOString(),
      };
    }

    // データベース接続チェック
    const dbAvailable = await isDatabaseAvailable();
    
    // OAuthプロバイダー確認
    const configuredProviders = [];
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      configuredProviders.push('google');
    }
    if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
      configuredProviders.push('azure-ad');
    }
    
    return {
      status: 'ok',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: dbAvailable ? 'connected' : 'unavailable',
      providers: configuredProviders,
      authUrl: process.env.NEXTAUTH_URL,
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      databaseUrl: !!process.env.DATABASE_URL,
    };
  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}