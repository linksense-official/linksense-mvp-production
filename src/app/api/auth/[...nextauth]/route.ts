import { NextRequest } from 'next/server'
import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaClient } from '@prisma/client'

console.log('🚀 LinkSense MVP - 完全修正版')

const prisma = new PrismaClient()

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

export const authOptions: AuthOptions = {
  providers: [
    // Slack カスタムプロバイダー
    {
      id: 'slack',
      name: 'Slack',
      type: 'oauth',
      authorization: {
        url: 'https://slack.com/oauth/v2/authorize',
        params: {
          scope: '',
          user_scope: 'identity.basic,identity.email,identity.avatar',
          response_type: 'code'
        }
      },
      token: {
        url: 'https://slack.com/api/oauth.v2.access',
        async request({ params, provider }) {
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
        }
      },
      userinfo: {
        url: 'https://slack.com/api/users.identity',
        async request({ tokens }) {
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

    // Discord設定
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds"
        }
      }
    }),
    
    // Google設定
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
    
    // Azure AD設定（最もシンプル版）
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  
  debug: false,
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔧 認証開始:', {
        provider: account?.provider,
        email: user?.email,
        hasToken: !!account?.access_token
      });
      
      // 基本検証
      if (!account?.provider || !user?.email) {
        console.log('❌ 認証情報不足');
        return false;
      }

      // トークンなしでもセッション作成
      if (!account?.access_token) {
        console.log('⚠️ トークンなし - セッションのみ作成');
        return true;
      }

      try {
        // ユーザー確保
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

        console.log('🔍 サービス名確認:', {
          originalProvider: account.provider,
          normalizedService: serviceName,
          email: user.email
        });

        // 対応サービスチェック
        if (!['teams', 'slack', 'discord', 'google'].includes(serviceName)) {
          console.log('❌ 未対応サービス:', serviceName);
          return true;
        }
        
        // 統合保存
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

        console.log('✅ 統合保存完了:', serviceName);
        return true;

      } catch (error: unknown) {
        console.error('❌ 統合保存エラー:', error);
        return true;
      }
    },
    
    async redirect({ url, baseUrl }) {
      console.log('🔄 リダイレクト:', { url, baseUrl });
      if (url.includes('error=')) {
        console.error('🚨 OAuth認証エラー:', url);
        return `${baseUrl}/integrations?error=oauth_failed`;
      }
      return `${baseUrl}/integrations?success=true`;
    },
    
    async jwt({ token, user, account }) {
      if (account && user) {
        console.log('🔑 JWT生成:', {
          provider: account.provider,
          user: user.email,
          hasAccessToken: !!account.access_token
        });
        
        if (user.email) {
          try {
            const userData = await prisma.user.findUnique({
              where: { email: user.email }
            });
            if (userData) {
              token.userId = userData.id;
            }
          } catch (error) {
            console.error('JWT生成エラー:', error);
          }
        }
        
        token.provider = account.provider;
        token.scope = account.scope;
        token.accessToken = account.access_token;
      }
      return token;
    },
    
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId as string,
        },
        provider: token.provider as string,
        scope: token.scope as string,
      };
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }