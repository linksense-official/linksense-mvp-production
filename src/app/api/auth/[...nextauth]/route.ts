import { NextRequest } from 'next/server'
import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import SlackProvider from 'next-auth/providers/slack'
import DiscordProvider from 'next-auth/providers/discord'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaClient } from '@prisma/client'

console.log('🚀 LinkSense MVP - 完全再構築版')

const prisma = new PrismaClient()

// 🆕 型定義の拡張
interface ExtendedProfile {
  tid?: string;
  companyName?: string;
  organizationName?: string;
  tenantDisplayName?: string;
  userPrincipalName?: string;
  hd?: string;
  guild?: { id: string; name: string };
  team?: { id: string; name: string };
}

export const authOptions: AuthOptions = {
  providers: [
    // 🔧 Slack設定の完全修正
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
      authorization: {
        params: {
          // 最小限のスコープから開始
          scope: 'identify users:read users:read.email',
        }
      }
    }),

    // 🔧 Discord設定の分離
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds"
        }
      }
    }),
    
    // 🔧 Google設定の分離
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
    
    // 🔧 Azure AD設定の分離
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
      authorization: {
        params: {
          scope: 'openid profile email User.Read User.Read.All',
          prompt: 'consent'
        }
      }
    }),
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  
  debug: process.env.NODE_ENV === 'development',
  
  callbacks: {
    // 🆕 完全に分離されたsignInコールバック
    async signIn({ user, account, profile }) {
      console.log('🔄 分離版signIn開始:', {
        provider: account?.provider,
        email: user?.email,
        hasAccessToken: !!account?.access_token,
        timestamp: new Date().toISOString()
      });
      
      // 🆕 厳密な検証
      if (!account?.provider) {
        console.error('❌ プロバイダーが特定できません');
        return false;
      }
      
      if (!user?.email) {
        console.error('❌ ユーザーメールが取得できません');
        return false;
      }
      
      if (!account.access_token) {
        console.error('❌ アクセストークンが取得できません');
        return false;
      }
      
      // 🆕 有効なプロバイダーのみ許可
      const validProviders = ['slack', 'discord', 'google', 'azure-ad'];
      if (!validProviders.includes(account.provider)) {
        console.error('❌ 無効なプロバイダー:', account.provider);
        return false;
      }
      
      try {
        console.log(`📝 ${account.provider} 専用処理開始`);
        
        // ユーザー確保
        const userData = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name || '',
            image: user.image,
            updatedAt: new Date(),
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

        console.log('✅ ユーザー確保:', userData.id);

        // 🆕 現在のプロバイダーのみの統合を処理
        const extendedProfile = profile as ExtendedProfile;
        const teamId = getTeamId(account, extendedProfile);
        const teamName = getTeamName(account, extendedProfile);

        const integrationData = {
          accessToken: account.access_token,
          refreshToken: account.refresh_token || '',
          scope: account.scope || '',
          tokenType: account.token_type || 'Bearer',
          isActive: true,
          updatedAt: new Date(),
          teamId,
          teamName,
        };

        console.log(`💾 ${account.provider} 統合データ保存:`, {
          hasToken: !!integrationData.accessToken,
          tokenLength: integrationData.accessToken.length,
          scope: integrationData.scope
        });

        // 🆕 プロバイダー専用の統合処理
        const integration = await prisma.integration.upsert({
          where: {
            userId_service: {
              userId: userData.id,
              service: account.provider,
            },
          },
          update: integrationData,
          create: {
            userId: userData.id,
            service: account.provider,
            ...integrationData,
            createdAt: new Date(),
          },
        });

        console.log(`✅ ${account.provider} 統合完了:`, {
          id: integration.id,
          service: integration.service,
          hasToken: !!integration.accessToken
        });
        
        return true;
        
      } catch (error) {
        console.error(`❌ ${account.provider} 統合エラー:`, error);
        return false; // 🆕 エラー時は認証を拒否
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
          user: user.email
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
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
}

// ヘルパー関数
function getTeamId(account: any, profile: ExtendedProfile): string | null {
  switch (account.provider) {
    case 'discord':
      return profile?.guild?.id || null;
    case 'slack':
      return profile?.team?.id || null;
    case 'azure-ad':
      return profile?.tid || null;
    default:
      return null;
  }
}

function getTeamName(account: any, profile: ExtendedProfile): string | null {
  switch (account.provider) {
    case 'discord':
      return profile?.guild?.name || null;
    case 'slack':
      return profile?.team?.name || null;
    case 'azure-ad':
      return profile?.companyName || profile?.organizationName || null;
    case 'google':
      return profile?.hd || null;
    default:
      return null;
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }