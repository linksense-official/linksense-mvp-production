import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { User, Account, Profile, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// 本番環境検証
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = process.env.NEXTAUTH_URL || (isProduction ? 'https://linksense-mvp.vercel.app' : 'http://localhost:3000');

// NextAuth用のUser型を拡張
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

// 本番環境用のセキュリティ設定
const productionSecurityConfig = {
  // セッション設定
  session: {
    strategy: 'jwt' as const,
    maxAge: isProduction ? 24 * 60 * 60 : 30 * 24 * 60 * 60, // 本番: 1日, 開発: 30日
    updateAge: isProduction ? 60 * 60 : 24 * 60 * 60, // 本番: 1時間, 開発: 1日
  },
  // Cookie設定
  cookies: {
    sessionToken: {
      name: isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: isProduction,
        domain: isProduction ? '.linksense-mvp.vercel.app' : undefined,
      },
    },
    callbackUrl: {
      name: isProduction ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: isProduction,
        domain: isProduction ? '.linksense-mvp.vercel.app' : undefined,
      },
    },
    csrfToken: {
      name: isProduction ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: isProduction,
      },
    },
  },
};

// IP アドレス取得ユーティリティ（本番環境対応）
function getClientIp(req?: NextRequest): string {
  if (!req) return 'unknown';
  
  // Vercel本番環境でのIP取得
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip'); // Cloudflare対応
  const vercelForwardedFor = req.headers.get('x-vercel-forwarded-for'); // Vercel対応
  
  return (
  vercelForwardedFor?.split(',')[0]?.trim() ||
  cfConnectingIp ||
  forwardedFor?.split(',')[0]?.trim() ||
  realIp ||
  'unknown'
);
}

// User Agent取得ユーティリティ
function getUserAgent(req?: NextRequest): string {
  return req?.headers.get('user-agent') || 'unknown';
}

// ログイン履歴を記録する関数（本番環境強化版）
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
    // 本番環境では詳細なメタデータも記録
    const enhancedMetadata = {
      ...metadata,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      baseUrl,
      ...(isProduction && {
        securityLevel: 'production',
        vercelRegion: process.env.VERCEL_REGION,
      }),
    };

   await prisma.loginHistory.create({
  data: {
    userId,
    ipAddress: ipAddress || 'unknown',
    userAgent: userAgent || 'unknown',
    success,
    reason: provider ? `${reason} (${provider})` : reason,
    metadata: enhancedMetadata ? JSON.stringify(enhancedMetadata) : null,
  }
});

    // 本番環境では重要なログイン失敗を外部監視システムに通知
    if (isProduction && !success && ['アカウントがロックされています', '認証システムエラー'].some(r => reason?.includes(r))) {
      console.error('SECURITY_ALERT:', {
        userId,
        ipAddress,
        reason,
        provider,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('ログイン履歴記録エラー:', error);
    
    // 本番環境ではログ記録失敗も監視
    if (isProduction) {
      console.error('LOGGING_FAILURE:', {
        originalUserId: userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// ユーザーの最終ログイン情報を更新（本番環境強化版）
async function updateLastLogin(userId: string, ipAddress: string, metadata?: Record<string, any>) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        loginAttempts: 0, // 成功時はリセット
        ...(isProduction && {
          lastLoginMetadata: JSON.stringify({
  ...metadata,
  environment: 'production',
  vercelRegion: process.env.VERCEL_REGION,
}),
        }),
      }
    });
  } catch (error) {
    console.error('最終ログイン更新エラー:', error);
  }
}

// ログイン試行回数を増加（本番環境強化版）
async function incrementLoginAttempts(email: string, ipAddress: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      const newAttempts = (user.loginAttempts || 0) + 1;
      const lockDuration = isProduction ? 60 * 60 * 1000 : 30 * 60 * 1000; // 本番: 1時間, 開発: 30分
      const shouldLock = newAttempts >= (isProduction ? 3 : 5); // 本番環境ではより厳格

      await prisma.user.update({
        where: { email },
        data: {
          loginAttempts: newAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + lockDuration) : null,
        }
      });

      // 本番環境でアカウントロック時は即座にアラート
      if (isProduction && shouldLock) {
        console.warn('ACCOUNT_LOCKED:', {
          email,
          ipAddress,
          attempts: newAttempts,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('ログイン試行回数更新エラー:', error);
  }
}

// カスタムPrismaAdapter（アカウント連携対応版）
function createCustomPrismaAdapter() {
  const adapter = PrismaAdapter(prisma);
  
  return {
    ...adapter,
    async linkAccount(account: any) {
      try {
        // 既存のアカウント連携チェック
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (existingAccount) {
          console.log('アカウント既に連携済み:', account.provider);
          return existingAccount;
        }

        // 新しいアカウント連携を作成
        const newAccount = await prisma.account.create({
          data: {
            userId: account.userId,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state,
            ext_expires_in: account.ext_expires_in,
          },
        });

        console.log('新しいアカウント連携作成:', account.provider);
        return newAccount;
      } catch (error) {
        console.error('アカウント連携エラー:', error);
        throw error;
      }
    },
  };
}

const handler = NextAuth({
  adapter: createCustomPrismaAdapter(),
  
  // 本番環境用セキュリティ設定
  ...productionSecurityConfig,
  
  providers: [
    // Google OAuth Provider（本番環境最適化）
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile",
          ...(isProduction && {
            // 本番環境では追加のセキュリティパラメータ
            hd: process.env.GOOGLE_HOSTED_DOMAIN, // 特定ドメインのみ許可（オプション）
          }),
        }
      },
      // 本番環境用プロファイル最適化
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // 本番環境では最小限の情報のみ
          ...(isProduction && {
            emailVerified: profile.email_verified,
          }),
        };
      },
    }),

    // GitHub OAuth Provider（本番環境最適化）
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "read:user user:email",
          ...(isProduction && {
            // 本番環境では組織制限（オプション）
            login: process.env.GITHUB_ALLOWED_ORGS,
          }),
        }
      },
      // 本番環境用プロファイル最適化
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email || '',
          image: profile.avatar_url,
          // 本番環境では追加検証
          ...(isProduction && {
            company: profile.company || undefined,
            verified: profile.verified,
          }),
        };
      },
    }),

    // Microsoft Azure AD Provider（本番環境最適化）
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid email profile",
          ...(isProduction && {
            // 本番環境では追加のAzure設定
            prompt: "select_account",
            domain_hint: process.env.AZURE_DOMAIN_HINT,
          }),
        }
      },
      // 本番環境用プロファイル最適化
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email || profile.preferred_username,
          image: profile.picture,
          // 本番環境では企業情報も取得
          ...(isProduction && {
            company: profile.company_name,
            jobTitle: profile.job_title,
          }),
        };
      },
    }),

    // 通常のログイン（メール・パスワード）- 本番環境強化版
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
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user.password) {
            await recordLoginHistory('unknown', ipAddress, userAgent, false, 'ユーザーが見つかりません', 'credentials');
            return null;
          }

          // アカウントロック確認（本番環境では厳格）
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            await recordLoginHistory(user.id, ipAddress, userAgent, false, 'アカウントがロックされています', 'credentials');
            return null;
          }

          // メール認証確認
          if (!user.emailVerified) {
            await recordLoginHistory(user.id, ipAddress, userAgent, false, 'メール認証が完了していません', 'credentials');
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

          // 2FAが有効な場合は、2FA検証が必要であることを示す
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

          // 2FAが無効な場合は通常ログイン完了
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

    // 2FA検証用プロバイダー（本番環境強化版）
    CredentialsProvider({
      id: '2fa-verification',
      name: '2fa-verification',
      credentials: {
        userId: { label: 'ユーザーID', type: 'text' },
        token: { label: '認証コード', type: 'text' },
        isBackupCode: { label: 'バックアップコード', type: 'text' }
      },
      async authorize(credentials, req): Promise<ExtendedUser | null> {
        if (!credentials?.userId || !credentials?.token) {
          return null;
        }

        const ipAddress = getClientIp(req as NextRequest);
        const userAgent = getUserAgent(req as NextRequest);

        try {
          const user = await prisma.user.findUnique({
            where: { id: credentials.userId }
          });

          if (!user || !user.twoFactorEnabled) {
            await recordLoginHistory(credentials.userId, ipAddress, userAgent, false, '2FA設定が見つかりません', '2fa-verification');
            return null;
          }

          // 2FA検証API呼び出し
          const verificationResponse = await fetch(`${baseUrl}/api/auth/2fa/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(isProduction && {
                'X-API-Key': process.env.INTERNAL_API_KEY, // 本番環境では内部API認証
              }),
            },
            body: JSON.stringify({
              userId: credentials.userId,
              token: credentials.token,
              isBackupCode: credentials.isBackupCode === 'true'
            })
          });

          const verificationResult = await verificationResponse.json();

          if (!verificationResult.success) {
            await recordLoginHistory(credentials.userId, ipAddress, userAgent, false, '2FA認証に失敗しました', '2fa-verification');
            return null;
          }

          // 2FA認証成功
          await updateLastLogin(user.id, ipAddress);
          await recordLoginHistory(user.id, ipAddress, userAgent, true, '2FA認証成功', '2fa-verification');

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            company: user.company || undefined,
            twoFactorEnabled: true,
            requiresTwoFactor: false,
            provider: '2fa-verification'
          };
        } catch (error) {
          console.error('2FA認証エラー:', error);
          await recordLoginHistory(credentials.userId, ipAddress, userAgent, false, '2FA認証システムエラー', '2fa-verification');
          return null;
        }
      }
    })
  ],

  pages: {
    signIn: '/login',
    error: '/login',
    ...(isProduction && {
      // 本番環境では専用エラーページ
      signOut: '/logout',
    }),
  },

  callbacks: {
    async jwt({ token, user, account, trigger }: {
      token: JWT;
      user?: User | ExtendedUser;
      account?: Account | null;
      trigger?: 'signIn' | 'signUp' | 'update';
    }) {
      if (user) {
        token.id = user.id;
        token.company = (user as ExtendedUser).company;
        token.twoFactorEnabled = (user as ExtendedUser).twoFactorEnabled;
        token.requiresTwoFactor = (user as ExtendedUser).requiresTwoFactor;
        token.provider = account?.provider || (user as ExtendedUser).provider;
        token.providerId = account?.providerAccountId || (user as ExtendedUser).providerId;
        
        // 本番環境では追加のセキュリティトークン
        if (isProduction) {
          token.securityLevel = 'production';
          token.issuedAt = Date.now();
        }
      }

      // 本番環境ではトークンの有効期限をより厳格に管理
      if (isProduction && trigger === 'update') {
        const tokenAge = Date.now() - (token.issuedAt as number || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24時間
        
        if (tokenAge > maxAge) {
          // トークンが古すぎる場合は再認証を要求
          throw new Error('Token expired, re-authentication required');
        }
      }

      return token;
    },

    async session({ session, token }: {
      session: Session;
      token: JWT;
    }) {
      if (token && session.user) {
        // 基本プロパティ
        session.user.id = token.id as string;
        session.user.company = token.company as string;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.requiresTwoFactor = token.requiresTwoFactor as boolean;
        
        // 拡張プロパティ
        (session.user as any).provider = token.provider as string;
        (session.user as any).providerId = token.providerId as string;
        
        // 本番環境では追加のセッション情報
        if (isProduction) {
          (session.user as any).securityLevel = token.securityLevel;
          (session.user as any).sessionStart = token.issuedAt;
        }
      }
      return session;
    },

    async signIn({ user, account, profile }: {
      user: User | ExtendedUser;
      account?: Account | null;
      profile?: Profile;
    }) {
      try {
        // 2FA検証が必要な場合は、通常のサインインを一時停止
        if ((user as ExtendedUser).requiresTwoFactor) {
          return false;
        }

        // ソーシャルログインの場合は常に許可
        if (account && ['google', 'github', 'azure-ad'].includes(account.provider)) {
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

    async redirect({ url, baseUrl }: {
      url: string;
      baseUrl: string;
    }) {
      // 本番環境ではより厳格なリダイレクト制御
      if (isProduction) {
        const allowedUrls = [
          baseUrl,
          'https://linksense-mvp.vercel.app',
          'https://www.linksense-mvp.vercel.app',
        ];
        
        // 相対URLの場合
        if (url.startsWith("/")) {
          return `${baseUrl}${url}`;
        }
        
        // 絶対URLの場合は許可リストをチェック
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
      
      // 開発環境では従来の処理
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },

  events: {
    async signIn({ user, account, isNewUser }: {
      user: User;
      account?: Account | null;
      isNewUser?: boolean;
    }) {
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
              { isNewUser: true, environment: process.env.NODE_ENV }
            );
          }
        } catch (error) {
          console.error('新規ユーザーログイン履歴記録エラー:', error);
        }
      }

      // 本番環境では成功ログインを監視システムに通知
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

    async signOut({ token }: { token?: JWT }) {
      if (token?.id) {
        try {
          const provider = token.provider as string || 'unknown';
          await prisma.loginHistory.create({
            data: {
              userId: token.id as string,
              ipAddress: 'unknown',
              userAgent: 'unknown',
              success: true,
              reason: `ログアウト (${provider})`,
              metadata: JSON.stringify({
                environment: process.env.NODE_ENV,
                sessionDuration: Date.now() - (token.issuedAt as number || 0),
              }),
            }
          });

          // 本番環境ではログアウトも監視
          if (isProduction) {
            console.info('USER_LOGOUT:', {
              userId: token.id,
              provider,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('ログアウト履歴記録エラー:', error);
        }
      }
    },

    async createUser({ user }: { user: User }) {
      console.log(`新規ユーザーが作成されました: ${user.email}`);
      
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: new Date(), // ソーシャルログインの場合は自動認証
            ...(isProduction && {
              // 本番環境では追加の初期設定
              createdAt: new Date(),
              environment: 'production',
            }),
          }
        });

        // 本番環境では新規ユーザー作成を監視
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

    async linkAccount({ user, account }: {
      user: User;
      account: Account;
    }) {
      console.log(`アカウント連携: ${user.email} - ${account.provider}`);
      
      try {
        await recordLoginHistory(
          user.id,
          'unknown',
          'unknown',
          true,
          'アカウント連携',
          account.provider,
          { linkAccount: true, environment: process.env.NODE_ENV }
        );

         // 本番環境ではアカウント連携を監視
        if (isProduction) {
          console.info('ACCOUNT_LINKED:', {
            userId: user.id,
            email: user.email,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('アカウント連携履歴記録エラー:', error);
          
          // 本番環境ではアカウント連携エラーもアラート
        if (isProduction) {
          console.error('ACCOUNT_LINK_ERROR:', {
            userId: user.id,
            email: user.email,
            provider: account.provider,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          });
        }
      }
    },

    async session({ session, token }: {
      session: Session;
      token: JWT;
    }) {
      // 本番環境ではセッション更新を監視
      if (isProduction && token?.id) {
        console.debug('SESSION_UPDATED:', {
          userId: token.id,
          provider: token.provider,
          sessionAge: Date.now() - (token.issuedAt as number || 0),
          timestamp: new Date().toISOString(),
        });
      }
    },
  },

  // 本番環境では詳細ログを無効化、開発環境では有効
  debug: process.env.NODE_ENV === 'development',
  
  // 本番環境用の追加設定
  ...(isProduction && {
    // セキュリティヘッダー
    useSecureCookies: true,
    
    // ログ設定
    logger: {
      error(code: string, metadata?: any) {
        console.error('NEXTAUTH_ERROR:', { code, metadata, timestamp: new Date().toISOString() });
      },
      warn(code: string) {
        console.warn('NEXTAUTH_WARNING:', { code, timestamp: new Date().toISOString() });
      },
      debug(code: string, metadata?: any) {
        // 本番環境では debug ログは出力しない
      },
    },
    
    // 本番環境用のテーマ設定
    theme: {
      colorScheme: 'auto',
      brandColor: '#0070f3',
      logo: '/logo.png',
    },
  }),
} as any);

export { handler as GET, handler as POST };

// 本番環境用のヘルスチェック関数
export async function healthCheck() {
  if (!isProduction) return { status: 'ok', environment: 'development' };
  
  try {
    // データベース接続確認
    await prisma.$queryRaw`SELECT 1`;
    
    // 環境変数確認
    const requiredEnvVars = [
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'AZURE_AD_CLIENT_ID',
      'AZURE_AD_CLIENT_SECRET',
      'AZURE_AD_TENANT_ID',
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    }
    
    return {
      status: 'ok',
      environment: 'production',
      timestamp: new Date().toISOString(),
      database: 'connected',
      envVars: 'configured',
    };
  } catch (error) {
    console.error('HEALTH_CHECK_FAILED:', error);
    return {
      status: 'error',
      environment: 'production',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 本番環境用のメトリクス収集関数
export async function collectMetrics() {
  if (!isProduction) return { message: 'Metrics collection disabled in development' };
  
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // 過去24時間のログイン統計
    const loginStats = await prisma.loginHistory.groupBy({
      by: ['success', 'reason'],
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
      _count: {
        id: true,
      },
    });
    
    // アクティブユーザー数
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });
    
    // プロバイダー別ログイン統計
    const providerStats = await prisma.loginHistory.groupBy({
      by: ['reason'],
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
        success: true,
      },
      _count: {
        id: true,
      },
    });
    
    const metrics = {
      timestamp: now.toISOString(),
      period: '24h',
      activeUsers,
      loginStats: loginStats.map((stat: any) => ({
        success: stat.success,
        reason: stat.reason,
        count: stat._count.id,
      })),
      providerStats: providerStats.map((stat: any) => ({
        provider: stat.reason?.split('(')[1]?.replace(')', '') || 'unknown',
        count: stat._count.id,
      })),
    };
    
    console.info('METRICS_COLLECTED:', metrics);
    return metrics;
  } catch (error) {
    console.error('METRICS_COLLECTION_FAILED:', error);
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}