import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import SlackProvider from 'next-auth/providers/slack'
import DiscordProvider from 'next-auth/providers/discord'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaClient } from '@prisma/client'

console.log('🚀 LinkSense MVP - 本番環境OAuth統合版（7サービス）')
console.log('🌐 NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
console.log('🔧 Environment:', process.env.NODE_ENV)

// Prismaクライアント初期化
const prisma = new PrismaClient()

export const authOptions: AuthOptions = {
  providers: [
    // Google OAuth (Google Meet統合も兼用)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    }),
    
    // Slack OAuth
    SlackProvider({
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: 'channels:read users:read team:read'  // 修正: 無効なスコープを削除
    }
  }
}),
    
    // Discord OAuth
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds messages.read'
        }
      }
    }),
    
    // Azure AD (Teams) OAuth
    AzureADProvider({
  clientId: process.env.AZURE_AD_CLIENT_ID!,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
  tenantId: process.env.AZURE_AD_TENANT_ID!,
  authorization: {
    params: {
      scope: 'openid profile email User.Read'  // 修正: 基本スコープのみ
    }
  }
}),
  ],
  
  debug: process.env.NODE_ENV === 'development',
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('✅ OAuth認証成功:', {
        provider: account?.provider,
        email: user?.email,
        name: user?.name,
        timestamp: new Date().toISOString()
      })
      
      try {
        if (account && user?.email) {
          // ユーザー情報をデータベースに保存/更新
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
              emailVerified: new Date(), // OAuth認証済みとして扱う
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })

          // サービス統合情報を保存（既存のスキーマフィールドのみ使用）
          await prisma.integration.upsert({
            where: {
              userId_service: {
                userId: userData.id,
                service: account.provider as any,
              },
            },
            update: {
              accessToken: account.access_token || '',
              refreshToken: account.refresh_token || '',
              isActive: true,
              updatedAt: new Date(),
            },
            create: {
              userId: userData.id,
              service: account.provider as any,
              accessToken: account.access_token || '',
              refreshToken: account.refresh_token || '',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })

          console.log('💾 統合情報保存完了:', {
            userId: userData.id,
            service: account.provider,
            hasToken: !!account.access_token
          })
        }
      } catch (error) {
        console.error('❌ データベース保存エラー:', error)
        // 認証は成功させるが、エラーをログに記録
      }
      
      return true
    },
    
    async redirect({ url, baseUrl }) {
      console.log('🔄 認証後リダイレクト:', { url, baseUrl })
      
      // エラーハンドリング
      if (url.includes('error=')) {
        console.error('🚨 OAuth認証エラー:', url)
        return `${baseUrl}/login?error=oauth_failed`
      }
      
      // 認証成功後は統合管理画面へ
      return `${baseUrl}/integrations?success=true`
    },
    
    async jwt({ token, user, account }) {
      if (account && user) {
        console.log('🔑 JWT生成:', {
          provider: account.provider,
          user: user.email
        })
        
        // ユーザーIDを取得してトークンに追加
        if (user.email) {
          try {
            const userData = await prisma.user.findUnique({
              where: { email: user.email }
            })
            if (userData) {
              token.userId = userData.id
            }
          } catch (error) {
            console.error('JWT生成時のユーザー取得エラー:', error)
          }
        }
        
        // アカウント情報をトークンに追加
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    
    async session({ session, token }) {
      console.log('📱 セッション確立:', {
        user: session.user?.email,
        provider: token.provider
      })
      
      // セッションに追加情報を含める
      const extendedSession = {
        ...session,
        user: {
          ...session.user,
          id: token.userId as string,
        },
        ...(token.provider && {
          provider: token.provider as string,
          providerAccountId: token.providerAccountId as string
        })
      }
      
      return extendedSession
    },
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('🎉 サインインイベント:', {
        user: user.email,
        provider: account?.provider,
        isNewUser,
        timestamp: new Date().toISOString()
      })
    },
    async signOut({ token }) {
      console.log('👋 サインアウトイベント:', {
        user: token?.email,
        timestamp: new Date().toISOString()
      })
    },
  },
  
  logger: {
    error(code: any, metadata: any) {
      console.error('🚨 NextAuth ERROR:', { 
        code, 
        metadata, 
        timestamp: new Date().toISOString() 
      })
    },
    warn(code: any) {
      console.warn('⚠️ NextAuth WARNING:', { 
        code, 
        timestamp: new Date().toISOString() 
      })
    },
    debug(code: any, metadata: any) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 NextAuth DEBUG:', { code, metadata })
      }
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }