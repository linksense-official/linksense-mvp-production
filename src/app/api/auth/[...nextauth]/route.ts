import { NextRequest } from 'next/server'
import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import SlackProvider from 'next-auth/providers/slack'
import DiscordProvider from 'next-auth/providers/discord'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaClient } from '@prisma/client'

console.log('🚀 LinkSense MVP - 安全版（スコープ拡張・アクセストークン保存対応）')

const prisma = new PrismaClient()

// 🆕 型定義の拡張
interface ExtendedProfile {
  tid?: string;
  companyName?: string;
  organizationName?: string;
  tenantDisplayName?: string;
  userPrincipalName?: string;
  hd?: string; // Google Workspace domain
  guild?: { id: string; name: string };
  team?: { id: string; name: string };
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email', 
            'profile',
            // Google Meet統合用スコープを追加
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/admin.directory.user.readonly'
          ].join(' '),
          prompt: 'consent',
          access_type: 'offline',
        },
      },
    }),

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
            'im:read',
            'conversations.list',
            'team:read'
          ].join(' ')
        }
      }
    }),
    
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds connections"
        }
      }
    }),
    
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
            'User.Read.All',      // 🆕 組織メンバー取得用
            'People.Read',
            'Calendars.Read',
            'Directory.Read.All'  // 🆕 ディレクトリ読み取り用
          ].join(' '),
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
        }).catch(async (error) => {
          if (error.code === 'P2002') {
            console.log('👤 既存ユーザーを取得:', userEmail);
            return await prisma.user.findUnique({
              where: { email: userEmail }
            });
          }
          throw error;
        });
        
        if (!userData) {
          throw new Error('ユーザーデータの作成/取得に失敗しました');
        }
        
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

        // 🆕 チーム情報の拡張取得
        const extendedProfile = profile as ExtendedProfile;
        const teamId = getTeamId(account, extendedProfile);
        const teamName = getTeamName(account, extendedProfile);
        
        // 🆕 権限レベルの判定
        const hasAdminPermission = checkAdminPermission(account, extendedProfile);

        const integrationData = {
          accessToken: account.access_token,
          refreshToken: account.refresh_token || '',
          scope: account.scope || '',
          tokenType: account.token_type || 'Bearer',
          isActive: true,
          updatedAt: new Date(),
          teamId,
          teamName,
          // 🆕 権限情報を追加保存
          metadata: JSON.stringify({
            hasAdminPermission,
            tenantId: extendedProfile?.tid,
            organizationName: extendedProfile?.companyName,
            userPrincipalName: extendedProfile?.userPrincipalName,
            domain: extendedProfile?.hd
          })
        };

        console.log('💾 保存データ:', {
          provider: account.provider,
          accessTokenLength: integrationData.accessToken.length,
          hasRefreshToken: !!integrationData.refreshToken,
          scope: integrationData.scope,
          teamId: integrationData.teamId,
          teamName: integrationData.teamName,
          hasAdminPermission
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
          tokenSaved: true,
          hasAdminPermission
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
      console.log('🔄 認証後リダイレクト:', { url, baseUrl });
      
      if (url.includes('error=')) {
        console.error('🚨 OAuth認証エラー:', url);
        return `${baseUrl}/integrations?error=oauth_failed`;
      }
      
      // 認証成功後はダッシュボードへ
      const provider = url.includes('provider=') ? url.split('provider=')[1].split('&')[0] : 'unknown';
      return `${baseUrl}/dashboard?success=true&service=${encodeURIComponent(provider)}`;
    },
    
    async jwt({ token, user, account }) {
      if (account && user) {
        console.log('🔑 JWT生成:', {
          provider: account.provider,
          user: user.email,
          scope: account.scope
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
        
        // 拡張情報をトークンに追加
        token.provider = account.provider;
        token.scope = account.scope;
      }
      return token;
    },
    
    async session({ session, token }) {
      console.log('📱 セッション確立:', {
        user: session.user?.email,
        provider: token.provider,
        hasScope: !!token.scope
      });
      
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
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('🎉 サインインイベント:', {
        user: user.email,
        provider: account?.provider,
        isNewUser,
        scope: account?.scope,
        timestamp: new Date().toISOString()
      });
    },
    async signOut({ token }) {
      console.log('👋 サインアウトイベント:', {
        user: token?.email,
        timestamp: new Date().toISOString()
      });
    },
  },
  
  logger: {
    error(code: any, metadata: any) {
      console.error('🚨 NextAuth ERROR:', { 
        code, 
        metadata, 
        timestamp: new Date().toISOString() 
      });
    },
    warn(code: any) {
      console.warn('⚠️ NextAuth WARNING:', { 
        code, 
        timestamp: new Date().toISOString() 
      });
    },
    debug(code: any, metadata: any) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 NextAuth DEBUG:', { code, metadata });
      }
    },
  },
}

// 🆕 権限レベル判定関数
function checkAdminPermission(account: any, profile: ExtendedProfile): boolean {
  switch (account.provider) {
    case 'azure-ad':
      // Azure ADの管理者権限チェック
      return account.scope?.includes('User.Read.All') && 
             account.scope?.includes('Directory.Read.All');
    case 'google':
      // Google Workspaceの管理者権限チェック
      return account.scope?.includes('admin.directory.user.readonly');
    default:
      return false;
  }
}

// 🔧 修正: ヘルパー関数: チームIDの取得
function getTeamId(account: any, profile: ExtendedProfile): string | null {
  switch (account.provider) {
    case 'discord':
      return profile?.guild?.id || null;
    case 'slack':
      return profile?.team?.id || account.team?.id || null;
    case 'azure-ad':
      return profile?.tid || null;
    default:
      return null;
  }
}

// 🔧 修正: ヘルパー関数: チーム名の取得
function getTeamName(account: any, profile: ExtendedProfile): string | null {
  switch (account.provider) {
    case 'discord':
      return profile?.guild?.name || null;
    case 'slack':
      return profile?.team?.name || account.team?.name || null;
    case 'azure-ad':
      // 🆕 Azure ADの組織名取得を拡張
      return profile?.companyName || 
             profile?.organizationName || 
             profile?.tenantDisplayName || 
             null;
    case 'google':
      // 🆕 Google Workspaceの組織名取得
      return profile?.hd || // ホストドメイン
             profile?.organizationName || 
             null;
    default:
      return null;
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }