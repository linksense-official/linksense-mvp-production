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
      console.log('✅ 緊急復旧版認証:', {
        provider: account?.provider,
        email: user?.email,
      });
      
      try {
        if (account && user?.email) {
          let userEmail = user.email;
          let userName = user.name || '';
          
          if (account.provider === 'chatwork' && user.email?.includes('linksense.local')) {
            // ChatWorkの場合はそのまま
          }

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

          const existingIntegration = await prisma.integration.findUnique({
            where: {
              userId_service: {
                userId: userData.id,
                service: account.provider as any,
              },
            },
          });

          const integrationData = {
            accessToken: account.access_token || '',
            refreshToken: account.refresh_token || '',
            scope: account.scope || '',
            tokenType: account.token_type || 'Bearer',
            isActive: true,
            updatedAt: new Date(),
            teamId: null,
            teamName: null,
          };

          if (existingIntegration) {
            await prisma.integration.update({
              where: { id: existingIntegration.id },
              data: integrationData,
            });
          } else {
            await prisma.integration.create({
              data: {
                userId: userData.id,
                service: account.provider as any,
                ...integrationData,
                createdAt: new Date(),
              },
            });
          }

          console.log('✅ 緊急復旧版保存完了:', {
            provider: account.provider,
            hasToken: !!account.access_token
          });
        }
      } catch (error) {
        console.error('❌ 緊急復旧版エラー:', error);
      }
      
      return true;
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