import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import SlackProvider from 'next-auth/providers/slack'
import DiscordProvider from 'next-auth/providers/discord'
import AzureADProvider from 'next-auth/providers/azure-ad'

console.log('🚀 LinkSense MVP - 本番環境OAuth統合版（7サービス）')
console.log('🌐 NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
console.log('🔧 Environment:', process.env.NODE_ENV)

export const authOptions: AuthOptions = {
  providers: [
    // Google OAuth (Google Meet統合も兼用)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    }),
    
    // Slack OAuth
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
    }),
    
    // Discord OAuth
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    
    // Azure AD (Teams) OAuth
    AzureADProvider({
  clientId: process.env.AZURE_AD_CLIENT_ID!,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
  tenantId: process.env.AZURE_AD_TENANT_ID!,
  authorization: {
    params: {
      scope: 'openid profile email offline_access User.Read Calendars.Read Team.ReadBasic.All Channel.ReadBasic.All ChannelMessage.Read.All ChatMessage.Read.All'
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
      
      // TODO: データベースにユーザー情報保存
      // TODO: 統合サービス情報の記録
      
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
      return `${baseUrl}/integrations`
    },
    
    async jwt({ token, user, account }) {
      if (account && user) {
        console.log('🔑 JWT生成:', {
          provider: account.provider,
          user: user.email
        })
        
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
      
      // セッションに追加情報を含める（型安全な方法）
      const extendedSession = {
        ...session,
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