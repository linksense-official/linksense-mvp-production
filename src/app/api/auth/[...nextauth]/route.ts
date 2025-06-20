import { NextRequest } from 'next/server'
import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaClient } from '@prisma/client'

// 🔴 本番環境チェック
const isProduction = process.env.NODE_ENV === 'production'

// 🔴 本番環境では詳細ログを無効化
if (!isProduction) {
  console.log('🚀 LinkSense MVP - Development Mode')
  console.log('🔧 NextAuth Provider確認:', {
    azureClientId: !!process.env.AZURE_AD_CLIENT_ID,
    azureTenantId: !!process.env.AZURE_AD_TENANT_ID,
    nextauthUrl: process.env.NEXTAUTH_URL
  });
}

// 🔴 Prisma接続の最適化（本番環境対応）
const prisma = new PrismaClient({
  log: isProduction ? ['error'] : ['query', 'info', 'warn', 'error'],
  errorFormat: isProduction ? 'minimal' : 'pretty',
})

// 型定義の拡張
interface ExtendedProfile {
  tid?: string;
  companyName?: string;
  organizationName?: string;
  tenantDisplayName?: string;
  userPrincipalName?: string;
  hd?: string;
  guild?: { id: string; name: string };
  team?: { id: string; name: string };
  user?: {
    id: string;
    name: string;
    email: string;
    image_192?: string;
  };
}

// 🔴 環境変数検証関数
const validateEnvVars = () => {
  const required = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'SLACK_CLIENT_ID',
    'SLACK_CLIENT_SECRET',
    'AZURE_AD_CLIENT_ID',
    'AZURE_AD_CLIENT_SECRET',
    'AZURE_AD_TENANT_ID'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('🚨 Missing environment variables:', missing);
    if (isProduction) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
  
  return missing.length === 0;
};

// 🔴 環境変数検証実行
validateEnvVars();

// 🔴 セキュリティ強化されたAuthOptions
export const authOptions: AuthOptions = {
  providers: [
    // 🔴 Slack プロバイダー（本番対応版）
{
  id: 'slack',
  name: 'Slack',
  type: 'oauth',
  authorization: {
    url: 'https://slack.com/oauth/v2/authorize',
    params: {
      scope: '',  // 空のままにする
      user_scope: 'identity.basic,identity.email,identity.avatar',  // カンマ区切りに修正
      response_type: 'code'
    }
  },
      token: {
        url: 'https://slack.com/api/oauth.v2.access',
        async request({ params, provider }) {
          try {
            const response = await fetch('https://slack.com/api/oauth.v2.access', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: process.env.SLACK_CLIENT_ID!,
                client_secret: process.env.SLACK_CLIENT_SECRET!,
                code: params.code!,
                redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/slack`
              })
            });
            
            const tokens = await response.json();
            
            if (!tokens.ok) {
              throw new Error(`Slack OAuth error: ${tokens.error}`);
            }
            
            return {
              tokens: {
                access_token: tokens.authed_user?.access_token,
                token_type: 'bearer',
                scope: tokens.authed_user?.scope,
                team_id: tokens.team?.id,
                team_name: tokens.team?.name
              }
            };
          } catch (error) {
            console.error('🚨 Slack token request failed:', error);
            throw error;
          }
        }
      },
      userinfo: {
        url: 'https://slack.com/api/users.identity',
        async request({ tokens }) {
          try {
            const response = await fetch('https://slack.com/api/users.identity', {
              headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
              }
            });
            
            const user = await response.json();
            
            if (!user.ok) {
              throw new Error(`Slack user info error: ${user.error}`);
            }
            
            return {
              id: user.user?.id,
              name: user.user?.name,
              email: user.user?.email,
              image: user.user?.image_192,
              team: {
                id: user.team?.id,
                name: user.team?.name
              }
            };
          } catch (error) {
            console.error('🚨 Slack userinfo request failed:', error);
            throw error;
          }
        }
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.image
        };
      },
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!
    },

    // 🔴 Discord設定（本番対応版）
    DiscordProvider({
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: "identify email"  // guildsを削除
    }
  }
}),
    
    // 🔴 Google設定（本番対応版）
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          prompt: 'consent',
          access_type: 'offline',
        },
      },
    }),
    
    // 🔴 Azure AD設定（本番対応版）
    {
      id: 'azure-ad',
      name: 'Microsoft Teams',
      type: 'oauth',
      authorization: {
        url: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
        params: {
          scope: 'openid profile email User.Read offline_access',
          response_type: 'code',
          prompt: 'consent'
        }
      },
      token: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
      userinfo: 'https://graph.microsoft.com/v1.0/me',
      profile(profile) {
        return {
          id: profile.id,
          name: profile.displayName,
          email: profile.mail || profile.userPrincipalName,
          image: undefined,
        }
      },
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    },
  ],
  
  // 🔴 本番用セッション設定
  session: {
    strategy: 'jwt',
    maxAge: isProduction ? 24 * 60 * 60 : 30 * 24 * 60 * 60, // 本番: 24時間, 開発: 30日
    updateAge: isProduction ? 60 * 60 : 24 * 60 * 60, // 本番: 1時間, 開発: 24時間
  },
  
  // 🔴 本番環境ではデバッグ無効化
  debug: !isProduction,
  
  // 🔴 セキュリティ強化されたコールバック
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // 🔴 本番環境では詳細ログを制限
        if (!isProduction) {
          console.log('🔧 認証開始:', {
            provider: account?.provider,
            email: user?.email,
            hasToken: !!account?.access_token
          });
        }
        
        // 基本検証強化
        if (!account?.provider || !user?.email) {
          console.error('❌ 認証情報不足:', { provider: account?.provider, hasEmail: !!user?.email });
          return false;
        }

        // 🔴 メールドメイン検証（必要に応じて）
        if (isProduction) {
          const email = user.email.toLowerCase();
          // 必要に応じて特定ドメインのみ許可
          // const allowedDomains = ['company.com', 'organization.org'];
          // if (!allowedDomains.some(domain => email.endsWith(`@${domain}`))) {
          //   console.error('❌ 許可されていないドメイン:', email);
          //   return false;
          // }
        }

        // トークンなしでもセッション作成（基本認証のみ）
        if (!account?.access_token) {
          if (!isProduction) {
            console.log('⚠️ トークンなし - セッションのみ作成');
          }
          return true;
        }

        // データベース操作（エラーハンドリング強化）
        const userData = await prisma.user.upsert({
          where: { email: user.email },
          update: { 
            name: user.name || '',
            image: user.image,
            updatedAt: new Date() 
          },
          create: {
            email: user.email,
            name: user.name || '',
            image: user.image,
            emailVerified: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // サービス名正規化
        const serviceName = account.provider === 'azure-ad' ? 'teams' : account.provider;

        // 🔴 対応サービス厳格チェック
        const supportedServices = ['teams', 'slack', 'discord', 'google'];
        if (!supportedServices.includes(serviceName)) {
          console.error('❌ 未対応サービス:', serviceName);
          return true; // 認証は成功させるが統合は保存しない
        }
        
        // 統合情報保存
        await prisma.integration.upsert({
          where: {
            userId_service: {
              userId: userData.id,
              service: serviceName,
            },
          },
          update: {
            accessToken: account.access_token,
            refreshToken: account.refresh_token || null,
            scope: account.scope || null,
            tokenType: account.token_type || 'Bearer',
            isActive: true,
            updatedAt: new Date(),
          },
          create: {
            userId: userData.id,
            service: serviceName,
            accessToken: account.access_token,
            refreshToken: account.refresh_token || null,
            scope: account.scope || null,
            tokenType: account.token_type || 'Bearer',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        if (!isProduction) {
          console.log('✅ 統合保存完了:', serviceName);
        }
        return true;

      } catch (error: unknown) {
        console.error('❌ 認証処理エラー:', error);
        // 🔴 本番環境では認証失敗時の処理を厳格化
        return !isProduction; // 開発環境では続行、本番環境では失敗
      }
    },
    
    async redirect({ url, baseUrl }) {
      try {
        if (!isProduction) {
          console.log('🔄 リダイレクト:', { url, baseUrl });
        }
        
        if (url.includes('error=')) {
          console.error('🚨 OAuth認証エラー:', url);
          return `${baseUrl}/integrations?error=oauth_failed`;
        }
        
        // 🔴 リダイレクトURL検証強化
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        
        if (url.startsWith(baseUrl)) {
          return url;
        }
        
        return `${baseUrl}/integrations?success=true`;
      } catch (error) {
        console.error('❌ リダイレクトエラー:', error);
        return `${baseUrl}/integrations`;
      }
    },
    
    async jwt({ token, user, account }) {
      try {
        if (account && user) {
          if (!isProduction) {
            console.log('🔑 JWT生成:', {
              provider: account.provider,
              user: user.email,
              hasAccessToken: !!account.access_token
            });
          }
          
          if (user.email) {
            const userData = await prisma.user.findUnique({
              where: { email: user.email }
            });
            if (userData) {
              token.userId = userData.id;
            }
          }
          
          token.provider = account.provider;
          token.scope = account.scope;
          // 🔴 本番環境ではトークンをJWTに含めない（セキュリティ強化）
          if (!isProduction) {
            token.accessToken = account.access_token;
          }
        }
        return token;
      } catch (error) {
        console.error('❌ JWT生成エラー:', error);
        return token;
      }
    },
    
    async session({ session, token }) {
      try {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.userId as string,
          },
          provider: token.provider as string,
          scope: token.scope as string,
          // 🔴 本番環境ではアクセストークンをセッションに含めない
          ...((!isProduction && token.accessToken) ? { accessToken: token.accessToken } : {})
        };
      } catch (error) {
        console.error('❌ セッション生成エラー:', error);
        return session;
      }
    },
  },

  // 🔴 本番用セキュリティ設定
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/',
  },

  // 🔴 本番用イベントハンドラー
  events: {
    async signIn(message) {
      if (isProduction) {
        // 本番環境では監査ログ記録
        console.log(`✅ ユーザーログイン: ${message.user.email} (${message.account?.provider})`);
      }
    },
    async signOut(message) {
      if (isProduction) {
        // 本番環境では監査ログ記録
        console.log(`👋 ユーザーログアウト: ${message.session?.user?.email}`);
      }
    },
  },

  // 🔴 本番用Cookie設定
  cookies: {
    sessionToken: {
      name: isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction, // 本番環境ではHTTPSのみ
        domain: isProduction ? '.vercel.app' : undefined, // 本番環境ではドメイン指定
      },
    },
    callbackUrl: {
      name: isProduction ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
        domain: isProduction ? '.vercel.app' : undefined,
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
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }