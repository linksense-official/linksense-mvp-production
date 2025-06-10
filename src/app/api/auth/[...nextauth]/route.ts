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
      // 🔧 修正: User Token Scopesに合わせる
      scope: [
        'identify',
        'users:read',
        'users:read.email',
        'channels:read',
        'channels:history',
        'groups:read',
        'im:read',
        'im:history',
        'mpim:read',
        'team:read',
        'usergroups:read'
      ].join(' '),
      user_scope: [
        'identify',
        'users:read',
        'users:read.email',
        'channels:read',
        'channels:history',
        'groups:read',
        'im:read',
        'im:history',
        'mpim:read',
        'team:read',
        'usergroups:read'
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
    console.log('📝 データベース保存開始 - トランザクション使用');
    
    // 🆕 トランザクションで整合性を保証
    const result = await prisma.$transaction(async (tx) => {
      // ユーザー保存・取得
      const userData = await tx.user.upsert({
        where: { email: user.email! },
        update: {
          name: user.name || '',
          image: user.image,
          updatedAt: new Date(),
        },
        create: {
          email: user.email!,
          name: user.name || '',
          image: user.image,
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log('✅ ユーザー保存完了:', userData.id);

      // 🆕 現在の全統合状況を記録
      const beforeIntegrations = await tx.integration.findMany({
        where: { userId: userData.id },
        select: { id: true, service: true, isActive: true, updatedAt: true }
      });

      console.log('📊 認証前の統合状況:', beforeIntegrations.map(i => ({ 
        service: i.service, 
        isActive: i.isActive,
        updatedAt: i.updatedAt.toISOString()
      })));

      // チーム情報の取得
      const extendedProfile = profile as ExtendedProfile;
      const teamId = getTeamId(account, extendedProfile);
      const teamName = getTeamName(account, extendedProfile);
      const hasAdminPermission = checkAdminPermission(account, extendedProfile);

      // 🔧 修正: accessTokenの型安全性を保証
      const accessToken = account.access_token || '';
      const refreshToken = account.refresh_token || '';
      const scope = account.scope || '';
      const tokenType = account.token_type || 'Bearer';

      const integrationData = {
        accessToken, // 🔧 修正: 確実にstringになるように
        refreshToken,
        scope,
        tokenType,
        isActive: true,
        updatedAt: new Date(),
        teamId,
        teamName,
      };

      console.log('💾 保存データ:', {
        provider: account.provider,
        accessTokenLength: accessToken.length, // 🔧 修正: 安全にアクセス
        hasRefreshToken: !!refreshToken,
        scope,
        teamId,
        teamName,
        hasAdminPermission
      });

      // 既存統合の確認・更新
      const existingIntegration = await tx.integration.findUnique({
        where: {
          userId_service: {
            userId: userData.id,
            service: account.provider as any,
          },
        },
      });

      let currentIntegration;
      if (existingIntegration) {
        console.log('🔄 既存統合更新中...', existingIntegration.id);
        currentIntegration = await tx.integration.update({
          where: { id: existingIntegration.id },
          data: integrationData,
        });
        console.log('✅ 更新完了:', { id: currentIntegration.id, hasToken: !!currentIntegration.accessToken });
      } else {
        console.log('🆕 新規統合作成中...');
        // 🔧 修正: 型安全なcreateデータ
        const createData = {
          userId: userData.id,
          service: account.provider as any,
          accessToken, // 🔧 修正: 確実にstringを渡す
          refreshToken,
          scope,
          tokenType,
          isActive: true,
          teamId,
          teamName,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        currentIntegration = await tx.integration.create({
          data: createData,
        });
        console.log('✅ 作成完了:', { id: currentIntegration.id, hasToken: !!currentIntegration.accessToken });
      }

      // 🆕 認証後の全統合状況を確認
      const afterIntegrations = await tx.integration.findMany({
        where: { userId: userData.id },
        select: { id: true, service: true, isActive: true, updatedAt: true }
      });

      console.log('📊 認証後の統合状況:', afterIntegrations.map(i => ({ 
        service: i.service, 
        isActive: i.isActive,
        updatedAt: i.updatedAt.toISOString()
      })));

      // 🆕 統合数の変化をチェック
      const beforeCount = beforeIntegrations.filter(i => i.isActive).length;
      const afterCount = afterIntegrations.filter(i => i.isActive).length;
      
      if (beforeCount > afterCount) {
        console.error('🚨 統合数が減少しました！', {
          before: beforeCount,
          after: afterCount,
          lost: beforeIntegrations.filter(before => 
            !afterIntegrations.find(after => after.service === before.service && after.isActive)
          ).map(i => i.service)
        });
      }

      return {
        userId: userData.id,
        currentService: account.provider,
        beforeCount,
        afterCount,
        totalIntegrations: afterIntegrations.length,
        activeIntegrations: afterIntegrations.filter(i => i.isActive).length,
        services: afterIntegrations.map(i => i.service),
        hasAdminPermission
      };
    }, {
      maxWait: 10000, // 10秒
      timeout: 15000, // 15秒
    });

    console.log('🎉 認証・保存完了:', result);
    
    if (result.beforeCount > result.afterCount) {
      console.error('🚨 統合情報の損失が発生しました！');
    }
    
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