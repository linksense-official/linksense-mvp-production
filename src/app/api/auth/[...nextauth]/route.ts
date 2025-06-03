import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import type { User, Account, Profile, Session, AuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import type { AzureADProfile } from 'next-auth/providers/azure-ad';
import crypto from 'crypto';

// 🔧 環境変数デバッグ（開発時のみ）
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 NextAuth Environment Check:');
  console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('- NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ 設定済み' : '❌ 未設定');
  console.log('- AZURE_AD_CLIENT_ID:', process.env.AZURE_AD_CLIENT_ID ? '✅ 設定済み' : '❌ 未設定');
  console.log('- GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ 設定済み' : '❌ 未設定');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ 設定済み' : '❌ 未設定');
}

// 環境設定
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = process.env.NEXTAUTH_URL || 
  (isProduction 
    ? 'https://linksense-mvp.vercel.app' 
    : 'http://localhost:3000'
  );

// デバッグ用ログ追加
console.log('🔧 NextAuth Base URL:', baseUrl);
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🔧 NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

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
  emailVerified?: Date | null;
  requiresEmailVerification?: boolean;
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

// メール認証トークン生成（userIdベース）
async function generateEmailVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

  try {
    // 既存トークンを削除
    await prisma.emailVerificationToken.deleteMany({
      where: { userId }
    });

    // 新しいトークン作成
    await prisma.emailVerificationToken.create({
      data: {
        userId,
        token,
        expires
      }
    });

    return token;
  } catch (error) {
    console.error('メール認証トークン生成エラー:', error);
    throw new Error('トークン生成に失敗しました');
  }
}

// メール認証送信
async function sendVerificationEmail(userId: string, email: string, name?: string): Promise<boolean> {
  try {
    const token = await generateEmailVerificationToken(userId);
    const success = await emailService.sendVerificationEmail(email, token, name);
    
    if (success) {
      console.log(`✅ 認証メール送信成功: ${email}`);
    } else {
      console.error(`❌ 認証メール送信失敗: ${email}`);
    }
    
    return success;
  } catch (error) {
    console.error('認証メール送信エラー:', error);
    return false;
  }
}

// ログイン履歴記録
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
  // アダプターなし（JWTのみ使用）
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
    // Azure AD OAuth（Microsoft 365）
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID ? [
  AzureADProvider({
  clientId: process.env.AZURE_AD_CLIENT_ID,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  tenantId: process.env.AZURE_AD_TENANT_ID,
  allowDangerousEmailAccountLinking: true,
  authorization: {
    params: {
      scope: "openid email profile User.Read",
      prompt: "select_account",
      response_type: "code",
    }
  },
  token: {
    url: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
  },
    userinfo: {
      url: "https://graph.microsoft.com/v1.0/me",
      async request({ tokens, provider }) {
        try {
          console.log('🔧 Microsoft Graph API 呼び出し開始');
          
          const response = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            console.error('❌ Microsoft Graph API エラー:', response.status, response.statusText);
            throw new Error(`Microsoft Graph API request failed: ${response.status}`);
          }
          
          const user = await response.json();
          console.log('✅ Microsoft Graph API レスポンス:', user);
          
          return {
            sub: user.id || user.oid || 'unknown',
            oid: user.oid || user.id,
            email: user.mail || user.userPrincipalName,
            name: user.displayName,
            preferred_username: user.userPrincipalName,
            nickname: user.displayName || user.userPrincipalName,
            picture: undefined,
            id: user.id,
            displayName: user.displayName,
            mail: user.mail,
            userPrincipalName: user.userPrincipalName,
          } as unknown as AzureADProfile;
        } catch (error) {
          console.error('❌ Microsoft Graph API 呼び出しエラー:', error);
          throw error;
        }
      },
    },
    profile(profile: AzureADProfile, tokens) {
      console.log('🔧 Microsoft365 プロファイル処理:', profile);
      
      const userId = (profile as any).oid || profile.sub || (profile as any).id || '';
      const email = (profile as any).email || (profile as any).mail || (profile as any).preferred_username || '';
      const name = (profile as any).name || (profile as any).displayName || email;
      
      if (!userId) {
        console.error('❌ Microsoft365: ユーザーIDが取得できません', profile);
        throw new Error('Microsoft365: ユーザーIDが取得できません');
      }
      
      if (!email) {
        console.error('❌ Microsoft365: メールアドレスが取得できません', profile);
        throw new Error('Microsoft365: メールアドレスが取得できません');
      }
      
      console.log('✅ Microsoft365 認証成功:', { userId, email, name });
      
      return {
        id: userId,
        email: email,
        name: name,
        image: undefined,
      };
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
          // デモアカウント
          if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
            return {
              id: 'demo-user-id',
              email: 'demo@example.com',
              name: 'Demo User',
              company: 'Demo Company',
              twoFactorEnabled: false,
              requiresTwoFactor: false,
              provider: 'credentials',
              emailVerified: new Date(),
              requiresEmailVerification: false,
            };
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

          // メール認証確認
          if (!user.emailVerified) {
            await recordLoginHistory(user.id, ipAddress, userAgent, false, 'メール認証が必要です', 'credentials');
            return {
              id: user.id,
              email: user.email,
              name: user.name || user.email,
              company: user.company || undefined,
              twoFactorEnabled: false,
              requiresTwoFactor: false,
              provider: 'credentials',
              emailVerified: null,
              requiresEmailVerification: true,
            };
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
              provider: 'credentials',
              emailVerified: user.emailVerified,
              requiresEmailVerification: false,
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
            provider: 'credentials',
            emailVerified: user.emailVerified,
            requiresEmailVerification: false,
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
    verifyRequest: '/verify-email',
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
        token.emailVerified = (user as ExtendedUser).emailVerified;
        token.requiresEmailVerification = (user as ExtendedUser).requiresEmailVerification;
        
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
        (session.user as any).company = token.company as string;
        (session.user as any).twoFactorEnabled = token.twoFactorEnabled as boolean;
        (session.user as any).requiresTwoFactor = token.requiresTwoFactor as boolean;
        (session.user as any).emailVerified = token.emailVerified as Date;
        
        (session.user as any).provider = token.provider as string;
        (session.user as any).providerId = token.providerId as string;
        (session.user as any).requiresEmailVerification = token.requiresEmailVerification as boolean;
        
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
      console.log('2FA認証が必要です:', user.email);
      return '/login?error=TwoFactorRequired';
    }

    // メール認証必要時は一時停止
    if ((user as ExtendedUser).requiresEmailVerification) {
      console.log('メール認証が必要です:', user.email);
      // 認証メール再送信
      if (user.id) {
        await sendVerificationEmail(user.id, user.email!, user.name || undefined);
      }
      return '/login?error=EmailVerificationRequired';
    }

    // ソーシャルログインの処理（Google と Azure AD のみ）
    if (account && ['google', 'azure-ad'].includes(account.provider)) {
      console.log(`🔧 ${account.provider} ログイン処理開始:`, {
        email: user.email,
        name: user.name,
        providerId: account.providerAccountId,
      });

      if (!user.email) {
        console.error('❌ ソーシャルログイン: メールアドレスが取得できません', { 
          provider: account.provider, 
          profile: profile,
          user: user 
        });
        return `/login?error=NoEmail&provider=${account.provider}`;
      }

      try {
        // 既存ユーザーを確認
        let existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        let isNewUser = false;

        if (!existingUser) {
          // 新規ユーザー作成
          console.log(`新規ユーザー作成開始: ${user.email}`);
          
          existingUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || user.email,
              image: user.image,
              emailVerified: new Date(), // ソーシャルログインは自動認証
              role: 'user',
            }
          });

          isNewUser = true;
          console.log(`✅ 新規ユーザー作成成功: ${user.email} (ID: ${existingUser.id})`);

          // ウェルカムメール送信
          try {
            await emailService.sendWelcomeEmail(user.email, user.name || undefined);
            console.log(`✅ ウェルカムメール送信成功: ${user.email}`);
          } catch (emailError) {
            console.error('ウェルカムメール送信エラー:', emailError);
            // メール送信失敗してもログインは継続
          }
        } else {
          console.log(`既存ユーザーログイン: ${user.email} (ID: ${existingUser.id})`);
          
          // ソーシャルログイン時は自動的にメール認証済みにする
          if (!existingUser.emailVerified) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: new Date() }
            });
            console.log(`✅ メール認証ステータス更新: ${user.email}`);
          }
        }

        // アカウント連携を確認・作成
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            }
          }
        });

        if (!existingAccount) {
          console.log(`アカウント連携作成開始: ${account.provider} - ${user.email}`);
          
          await prisma.account.create({
            data: {
              userId: existingUser.id,
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
            }
          });

          console.log(`✅ アカウント連携作成成功: ${account.provider} - ${user.email}`);
        } else {
          console.log(`既存アカウント連携確認: ${account.provider} - ${user.email}`);
        }

        // ユーザー情報を更新
        user.id = existingUser.id;

        // ログイン履歴記録
        await recordLoginHistory(
          existingUser.id,
          'unknown', // ソーシャルログインではIP取得困難
          'unknown',
          true,
          'ソーシャルログイン成功',
          account.provider,
          {
            providerId: account.providerAccountId,
            isNewUser: isNewUser,
            profileData: profile
          }
        );

        console.log(`✅ ${account.provider} ログイン成功: ${user.email}`);
        return true;
      } catch (dbError) {
        console.error(`❌ ${account.provider} ログイン処理エラー:`, dbError);
        return '/login?error=DatabaseError';
      }
    }

    return true;
  } catch (error) {
    console.error('サインインコールバックエラー:', error);
    return '/login?error=CallbackError';
  }
},

    async redirect({ url, baseUrl }) {
  console.log('🔧 Redirect処理:', { url, baseUrl, actualBaseUrl: process.env.NEXTAUTH_URL });
  
  // エラーパラメータがある場合はログインページに戻す
  if (url.includes('error=')) {
    console.log('🔧 エラーリダイレクト:', url);
    return url.startsWith('/') ? `${baseUrl}${url}` : url;
  }

  if (isProduction) {
    const allowedUrls = [
      baseUrl,
      'https://linksense-mvp.vercel.app',
      // 🔧 修正: 現在のVercelデプロイメントURLも許可
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ].filter(Boolean);
    
    console.log('🔧 許可されたURL:', allowedUrls);
    
    if (url.startsWith("/")) {
      const finalUrl = `${baseUrl}${url}`;
      console.log('✅ 相対URLリダイレクト:', finalUrl);
      return finalUrl;
    }
    
    try {
      const urlObj = new URL(url);
      const isAllowed = allowedUrls.some(allowedUrl => 
        urlObj.origin === new URL(allowedUrl!).origin
      );
      
      if (isAllowed) {
        console.log('✅ 許可されたURLリダイレクト:', url);
        return url;
      } else {
        console.warn('⚠️ REDIRECT_BLOCKED:', { url, baseUrl, allowedUrls });
        return `${baseUrl}/dashboard`;
      }
    } catch (error) {
      console.error('❌ URLパースエラー:', error);
      return `${baseUrl}/dashboard`;
    }
  }
  
  // 開発環境
  if (url.startsWith("/")) return `${baseUrl}${url}`;
  else if (new URL(url).origin === baseUrl) return url;
  return baseUrl;
}
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      const provider = account?.provider || 'unknown';
      console.log(`✅ ユーザー ${user.email} が ${provider} でログインしました`);
      
      if (isNewUser) {
        console.log(`🎉 新規ユーザー ${user.email} が ${provider} で作成されました`);
        
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

    async signOut({ token }) {
      console.log(`ユーザーがログアウトしました: ${token?.email}`);
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
        if (process.env.NEXTAUTH_DEBUG === 'true') {
          console.debug('NEXTAUTH_DEBUG:', { code, metadata, timestamp: new Date().toISOString() });
        }
      },
    },
  }),
};

const handler = NextAuth(authConfig);

// authOptionsをエクスポート
export const authOptions = authConfig;

export { handler as GET, handler as POST };