import { NextRequest } from 'next/server'  // ← この行を追加
import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import SlackProvider from 'next-auth/providers/slack'
import DiscordProvider from 'next-auth/providers/discord'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaClient } from '@prisma/client'
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth'

console.log('🚀 LinkSense MVP - OAuth統合修正版（複数サービス同時接続対応）')
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
          prompt: 'consent', // 修正: select_account → consent（再同意を促す）
          access_type: 'offline',
        },
      },
    }),
    
    // Slack OAuth - 修正版
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'users:read team:read', // 修正: channels:read を削除（無効なスコープ）
          user_scope: 'identify' // 追加: ユーザースコープ
        }
      }
    }),
    
    // Discord OAuth
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email guilds' // 修正: messages.read を削除（権限過多）
        }
      }
    }),
    
    // Azure AD (Teams) OAuth - 修正版
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
          prompt: 'consent' // 追加: 再同意を促す
        }
      }
    }),
    // 一時的にコメントアウト
    /*
         // LINE WORKS OAuth - TypeScriptエラー修正版
    {
      id: "line-works",
      name: "LINE WORKS",
      type: "oauth",
      authorization: {
        url: "https://auth.worksmobile.com/oauth2/v2.0/authorize",
        params: {
          scope: "user.read user.profile.read user.email.read",
          response_type: "code",
          access_type: "offline",
        }
      },
      token: "https://auth.worksmobile.com/oauth2/v2.0/token",
      userinfo: {
        // 修正: request関数のみを定義
        async request({ tokens }) {
          const response = await fetch("https://www.worksapis.com/v1.0/users/me", {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.status}`);
          }
          
          return await response.json();
        }
      },
      clientId: process.env.LINE_WORKS_CLIENT_ID!,
      clientSecret: process.env.LINE_WORKS_CLIENT_SECRET!,
      profile(profile: any) {
        console.log('LINE WORKS Profile:', profile);
        return {
          id: profile.userId || profile.id,
          name: profile.displayName || profile.userName || profile.name,
          email: profile.email || profile.userEmail,
          image: profile.picture || profile.photoUrl || profile.avatarUrl,
        }
      },
    } as OAuthConfig<any>,
         */
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
              emailVerified: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })

          // 統合情報を保存（既存を無効化せずに追加）
          const existingIntegration = await prisma.integration.findUnique({
  where: {
    userId_service: {
      userId: userData.id,
      service: account.provider as any,
    },
  },
})

if (existingIntegration) {
  // 既存の統合を更新（他のサービスには影響しない）
  await prisma.integration.update({
    where: { id: existingIntegration.id },
    data: {  // 修正: 'update' → 'data'
      accessToken: account.access_token || '',
      refreshToken: account.refresh_token || '',
      isActive: true,
      updatedAt: new Date(),
    },
  })
} else {
  // 新規統合作成（他のサービスには影響しない）
  await prisma.integration.create({
    data: {
      userId: userData.id,
      service: account.provider as any,
      accessToken: account.access_token || '',
      refreshToken: account.refresh_token || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

console.log('💾 統合情報保存完了:', {
  userId: userData.id,
  service: account.provider,
  hasToken: !!account.access_token,
  action: existingIntegration ? 'updated' : 'created'
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
        return `${baseUrl}/integrations?error=oauth_failed`
      }
      
      // 認証成功後はダッシュボードへ（統合状況を即座反映）
      return `${baseUrl}/dashboard?success=true&service=${encodeURIComponent(url.includes('provider=') ? url.split('provider=')[1].split('&')[0] : 'unknown')}`
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
