import { NextRequest } from 'next/server'
import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import SlackProvider from 'next-auth/providers/slack'
import DiscordProvider from 'next-auth/providers/discord'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaClient } from '@prisma/client'

console.log('🚀 LinkSense MVP - 緊急復旧版')

const prisma = new PrismaClient()

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
    }),
    
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
    }),

    {
      id: "chatwork",
      name: "ChatWork",
      type: "oauth" as const,
      authorization: {
        url: "https://www.chatwork.com/packages/oauth2/login.php",
        params: {
          scope: "users.profile.me:read",
          response_type: "code",
        }
      },
      token: "https://oauth.chatwork.com/token",
      userinfo: {
        async request(context: { tokens: { access_token?: string; [key: string]: any } }) {
          const { tokens } = context;
          const response = await fetch("https://api.chatwork.com/v2/me", {
            headers: {
              'X-ChatWorkToken': tokens.access_token!,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`ChatWork API Error: ${response.status}`);
          }
          
          return await response.json();
        }
      },
      clientId: process.env.CHATWORK_CLIENT_ID!,
      clientSecret: process.env.CHATWORK_CLIENT_SECRET!,
      profile(profile: any) {
        return {
          id: profile.account_id?.toString() || profile.id || 'unknown',
          name: profile.name || 'ChatWork User',
          email: `chatwork-${profile.account_id || 'unknown'}@linksense.local`,
          image: profile.avatar_image_url || null,
        }
      },
    },
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
  console.log('🔄 signIn コールバック開始:', {
    provider: account?.provider,
    email: user?.email,
    hasAccessToken: !!account?.access_token,
    accessTokenLength: account?.access_token?.length || 0,
    scope: account?.scope,
    timestamp: new Date().toISOString()
  });
  
  if (!account) {
    console.error('❌ account が null です');
    return false;
  }
  
  if (!user?.email) {
    console.error('❌ user.email が null です');
    return false;
  }
  
  if (!account.access_token) {
    console.error('❌ access_token が null です');
    return false;
  }
  
  try {
    console.log('📝 データベース保存開始');
    
    let userEmail = user.email;
    let userName = user.name || '';
    
    if (account.provider === 'chatwork' && user.email?.includes('linksense.local')) {
      console.log('📧 ChatWork用メール処理');
    }

    console.log('👤 ユーザー保存中...', { email: userEmail });
    const userData = await prisma.user.upsert({
      where: { email: userEmail },
      update: {
        name: userName,
        image: user.image,
        updatedAt: new Date(),
      },
      create: {
        email: userEmail,
        name: userName,
        image: user.image,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ ユーザー保存完了:', userData.id);

    console.log('🔗 統合情報確認中...');
    const existingIntegration = await prisma.integration.findUnique({
      where: {
        userId_service: {
          userId: userData.id,
          service: account.provider as any,
        },
      },
    });
    console.log('既存統合:', existingIntegration ? '更新' : '新規作成');

    const integrationData = {
      accessToken: account.access_token,
      refreshToken: account.refresh_token || '',
      scope: account.scope || '',
      tokenType: account.token_type || 'Bearer',
      isActive: true,
      updatedAt: new Date(),
      teamId: null,
      teamName: null,
    };

    console.log('💾 保存データ:', {
      provider: account.provider,
      accessTokenLength: integrationData.accessToken.length,
      hasRefreshToken: !!integrationData.refreshToken,
      scope: integrationData.scope
    });

    if (existingIntegration) {
      console.log('🔄 既存統合更新中...');
      const updated = await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: integrationData,
      });
      console.log('✅ 更新完了:', { id: updated.id, hasToken: !!updated.accessToken });
    } else {
      console.log('🆕 新規統合作成中...');
      const created = await prisma.integration.create({
        data: {
          userId: userData.id,
          service: account.provider as any,
          ...integrationData,
          createdAt: new Date(),
        },
      });
      console.log('✅ 作成完了:', { id: created.id, hasToken: !!created.accessToken });
    }

    console.log('🎉 認証・保存完了:', {
      provider: account.provider,
      userId: userData.id,
      tokenSaved: true
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ signIn エラー詳細:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      provider: account?.provider,
      timestamp: new Date().toISOString()
    });
    
    // エラーでも認証は継続
    return true;
  }
},
    
    async redirect({ url, baseUrl }) {
      if (url.includes('error=')) {
        return `${baseUrl}/integrations?error=oauth_failed`
      }
      return `${baseUrl}/dashboard`
    },
    
    async jwt({ token, user, account }) {
      if (account && user) {
        if (user.email) {
          try {
            const userData = await prisma.user.findUnique({
              where: { email: user.email }
            })
            if (userData) {
              token.userId = userData.id
            }
          } catch (error) {
            console.error('JWT生成エラー:', error)
          }
        }
      }
      return token
    },
    
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId as string,
        },
      }
    },
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }