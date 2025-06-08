import { NextRequest } from 'next/server'
import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import SlackProvider from 'next-auth/providers/slack'
import DiscordProvider from 'next-auth/providers/discord'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaClient } from '@prisma/client'
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth'

console.log('🚀 LinkSense MVP - 拡張スコープ版（フレンド・チームメンバー取得対応）')
console.log('🌐 NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
console.log('🔧 Environment:', process.env.NODE_ENV)

// Prismaクライアント初期化
const prisma = new PrismaClient()

export const authOptions: AuthOptions = {
  providers: [
    // Google OAuth (拡張スコープ版)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email', 
            'profile',
            'https://www.googleapis.com/auth/admin.directory.user.readonly', // 組織ユーザー取得
            'https://www.googleapis.com/auth/gmail.readonly',                // Gmail連絡先
            'https://www.googleapis.com/auth/drive.readonly',                // Drive共同作業者
            'https://www.googleapis.com/auth/calendar.readonly',             // カレンダー・Meet
            'https://www.googleapis.com/auth/contacts.readonly'              // 連絡先
          ].join(' '),
          prompt: 'consent',
          access_type: 'offline',
        },
      },
    }),

    // Slack OAuth (拡張スコープ版)
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'identify',
            'users:read',
            'users:read.email',
            'channels:read',
            'groups:read',
            'im:read',              // DM読み取り
            'im:history',           // DM履歴
            'mpim:read',            // マルチパーティDM
            'conversations.list',   // 会話一覧
            'conversations.history', // 会話履歴
            'conversations.members', // 会話メンバー
            'team:read',            // チーム情報
            'usergroups:read'       // ユーザーグループ
          ].join(' ')
        }
      }
    }),
    
    // Discord OAuth (拡張スコープ版)
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'identify',
            'email',
            'guilds',               // サーバー一覧
            'guilds.members.read',  // サーバーメンバー取得
            'relationships.read',   // フレンドリスト取得 ⭐ 重要
            'messages.read',        // メッセージ読み取り
            'connections'           // 外部接続
          ].join(' ')
        }
      }
    }),
    
    // Azure AD (Teams) OAuth (拡張スコープ版)
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
      authorization: {
        params: {
          scope: [
            'openid',
            'profile',
            'email',
            'User.Read',
            'User.Read.All',        // 全ユーザー読み取り ⭐ 重要
            'Chat.Read',            // チャット読み取り ⭐ 重要
            'Chat.ReadBasic',       // 基本チャット情報
            'Chat.ReadWrite',       // チャット読み書き
            'Calendars.Read',       // カレンダー（会議情報）
            'Calendars.Read.Shared', // 共有カレンダー
            'People.Read',          // 連絡先 ⭐ 重要
            'People.Read.All',      // 全連絡先
            'Contacts.Read',        // 連絡先読み取り
            'Directory.Read.All',   // ディレクトリ読み取り
            'Group.Read.All',       // グループ読み取り
            'TeamMember.Read.All'   // チームメンバー読み取り
          ].join(' '),
          prompt: 'consent'
        }
      }
    }),

    // ChatWork OAuth (型安全版)
    {
      id: "chatwork",
      name: "ChatWork",
      type: "oauth" as const,
      authorization: {
        url: "https://www.chatwork.com/packages/oauth2/login.php",
        params: {
          scope: [
            'users.profile.me:read',
            'users.profile.others:read',
            'users.all:read',
            'rooms.all:read_only',
            'rooms.messages:read',
            'rooms.members:read',
            'contacts.all:read'
          ].join(' '),
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
        console.log('ChatWork Profile:', profile);
        return {
          id: profile.account_id?.toString() || profile.id || 'unknown',
          name: profile.name || 'ChatWork User',
          email: `chatwork-${profile.account_id || 'unknown'}@linksense.local`,
          image: profile.avatar_image_url || null,
        }
      },
    },
  ],
  
  debug: process.env.NODE_ENV === 'development',
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('✅ OAuth認証成功 (拡張スコープ):', {
        provider: account?.provider,
        email: user?.email,
        name: user?.name,
        scopes: account?.scope,
        timestamp: new Date().toISOString()
      })
      
      try {
        if (account && user?.email) {
          // ChatWorkの場合、プレースホルダーメールを実際のIDベースに変換
          let userEmail = user.email;
          let userName = user.name || '';
          
          if (account.provider === 'chatwork' && user.email?.includes('linksense.local')) {
            // ChatWorkの場合は特別処理（既に適切な形式）
            console.log('📧 ChatWork用メール確認:', userEmail);
          }

          // ユーザー情報をデータベースに保存/更新
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
          })

          // 統合情報を保存（拡張データ含む）
          const existingIntegration = await prisma.integration.findUnique({
            where: {
              userId_service: {
                userId: userData.id,
                service: account.provider as any,
              },
            },
          })

          const integrationData = {
            accessToken: account.access_token || '',
            refreshToken: account.refresh_token || '',
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
            scope: account.scope || '',
            tokenType: account.token_type || 'Bearer',
            isActive: true,
            updatedAt: new Date(),
            // プロバイダー固有のデータ
            teamId: getTeamId(account, profile),
            teamName: getTeamName(account, profile),
          }

          if (existingIntegration) {
            // 既存の統合を更新
            await prisma.integration.update({
              where: { id: existingIntegration.id },
              data: integrationData,
            })
          } else {
            // 新規統合作成
            await prisma.integration.create({
              data: {
                userId: userData.id,
                service: account.provider as any,
                ...integrationData,
                createdAt: new Date(),
              },
            })
          }

          console.log('💾 拡張統合情報保存完了:', {
            userId: userData.id,
            service: account.provider,
            hasToken: !!account.access_token,
            hasRefreshToken: !!account.refresh_token,
            scope: account.scope,
            teamId: integrationData.teamId,
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
      console.log('🔄 認証後リダイレクト (拡張版):', { url, baseUrl })
      
      // エラーハンドリング
      if (url.includes('error=')) {
        console.error('🚨 OAuth認証エラー:', url)
        return `${baseUrl}/integrations?error=oauth_failed`
      }
      
      // 権限不足エラーの検出
      if (url.includes('insufficient_scope') || url.includes('access_denied')) {
        console.error('🚨 権限不足エラー:', url)
        return `${baseUrl}/integrations?error=insufficient_permissions`
      }
      
      // 認証成功後はダッシュボードへ
      const provider = url.includes('provider=') ? url.split('provider=')[1].split('&')[0] : 'unknown'
      return `${baseUrl}/dashboard?success=true&service=${encodeURIComponent(provider)}&scope_expanded=true`
    },
    
    async jwt({ token, user, account }) {
      if (account && user) {
        console.log('🔑 JWT生成 (拡張スコープ):', {
          provider: account.provider,
          user: user.email,
          scope: account.scope
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
        
        // 拡張アカウント情報をトークンに追加
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.scope = account.scope
        token.expiresAt = account.expires_at
      }
      return token
    },
    
    async session({ session, token }) {
      console.log('📱 セッション確立 (拡張版):', {
        user: session.user?.email,
        provider: token.provider,
        hasExtendedScope: !!token.scope
      })
      
      // セッションに拡張情報を含める
      const extendedSession = {
        ...session,
        user: {
          ...session.user,
          id: token.userId as string,
        },
        ...(token.provider && {
          provider: token.provider as string,
          providerAccountId: token.providerAccountId as string,
          scope: token.scope as string,
          hasExtendedPermissions: checkExtendedPermissions(token.provider as string, token.scope as string)
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
      console.log('🎉 サインインイベント (拡張版):', {
        user: user.email,
        provider: account?.provider,
        isNewUser,
        scope: account?.scope,
        hasExtendedPermissions: account?.scope ? checkExtendedPermissions(account.provider, account.scope) : false,
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

// ヘルパー関数: チームIDの取得
function getTeamId(account: any, profile: any): string | null {
  switch (account.provider) {
    case 'discord':
      return profile?.guild?.id || null
    case 'slack':
      return profile?.team?.id || account.team?.id || null
    case 'azure-ad':
      return profile?.tid || null
    case 'chatwork':
      return profile?.organization_id?.toString() || null
    default:
      return null
  }
}

// ヘルパー関数: チーム名の取得
function getTeamName(account: any, profile: any): string | null {
  switch (account.provider) {
    case 'discord':
      return profile?.guild?.name || null
    case 'slack':
      return profile?.team?.name || account.team?.name || null
    case 'azure-ad':
      return profile?.companyName || null
    case 'chatwork':
      return profile?.organization_name || null
    default:
      return null
  }
}

// ヘルパー関数: 拡張権限の確認
function checkExtendedPermissions(provider: string, scope: string): boolean {
  const requiredScopes = {
    discord: ['relationships.read', 'guilds.members.read'],
    slack: ['im:read', 'conversations.members'],
    'azure-ad': ['User.Read.All', 'Chat.Read', 'People.Read'],
    google: ['admin.directory.user.readonly', 'gmail.readonly'],
    chatwork: ['rooms.members:read', 'contacts.all:read']
  }

  const providerRequiredScopes = requiredScopes[provider as keyof typeof requiredScopes]
  if (!providerRequiredScopes) return false

  return providerRequiredScopes.some(requiredScope => scope?.includes(requiredScope))
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }