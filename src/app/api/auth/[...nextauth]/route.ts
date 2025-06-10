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
      // 🔧 修正: 最小限のスコープから開始
      scope: 'identify users:read users:read.email',
      // user_scopeを削除してシンプルに
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
    timestamp: new Date().toISOString()
  });
  
  if (!account || !user?.email || !account.access_token) {
    console.error('❌ 必須情報不足');
    return false;
  }
  
  try {
    console.log('📝 データベース保存開始 - 統合保持版');
    
    // 🆕 重要: トランザクション外で事前にユーザーを確保
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

    console.log('✅ ユーザー確保完了:', userData.id);

    // 🆕 現在の全統合状況を事前に記録
    const beforeIntegrations = await prisma.integration.findMany({
      where: { userId: userData.id },
      select: { 
        id: true, 
        service: true, 
        isActive: true, 
        accessToken: true,
        refreshToken: true,
        scope: true,
        teamId: true,
        teamName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('📊 認証前の統合状況:', beforeIntegrations.map(i => ({ 
      service: i.service, 
      isActive: i.isActive,
      hasToken: !!i.accessToken,
      updatedAt: i.updatedAt.toISOString()
    })));

    // 🆕 現在のプロバイダーの統合のみを更新（他は触らない）
    const extendedProfile = profile as ExtendedProfile;
    const teamId = getTeamId(account, extendedProfile);
    const teamName = getTeamName(account, extendedProfile);

    const accessToken: string = account.access_token || '';
    const refreshToken: string = account.refresh_token || '';
    const scope: string = account.scope || '';
    const tokenType: string = account.token_type || 'Bearer';

    // 🆕 現在のプロバイダーのみの統合を処理
    const currentProviderIntegration = await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: userData.id,
          service: account.provider,
        },
      },
      update: {
        accessToken,
        refreshToken,
        scope,
        tokenType,
        isActive: true,
        updatedAt: new Date(),
        teamId,
        teamName,
      },
      create: {
        userId: userData.id,
        service: account.provider,
        accessToken,
        refreshToken,
        scope,
        tokenType,
        isActive: true,
        teamId,
        teamName,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ 現在プロバイダー統合完了:', {
      id: currentProviderIntegration.id,
      service: currentProviderIntegration.service,
      hasToken: !!currentProviderIntegration.accessToken
    });

    // 🆕 他の統合が維持されているかチェック
    const afterIntegrations = await prisma.integration.findMany({
      where: { userId: userData.id },
      select: { 
        id: true, 
        service: true, 
        isActive: true, 
        accessToken: true,
        updatedAt: true
      }
    });

    console.log('📊 認証後の統合状況:', afterIntegrations.map(i => ({ 
      service: i.service, 
      isActive: i.isActive,
      hasToken: !!i.accessToken,
      updatedAt: i.updatedAt.toISOString()
    })));

    // 🆕 統合数の変化をチェック
    const beforeActiveCount = beforeIntegrations.filter(i => i.isActive && i.accessToken).length;
    const afterActiveCount = afterIntegrations.filter(i => i.isActive && i.accessToken).length;
    
    console.log('📈 統合数の変化:', {
      before: beforeActiveCount,
      after: afterActiveCount,
      change: afterActiveCount - beforeActiveCount
    });

    if (afterActiveCount < beforeActiveCount) {
      console.error('🚨 統合数が減少しました！', {
        lost: beforeIntegrations.filter(before => 
          before.isActive && before.accessToken &&
          !afterIntegrations.find(after => 
            after.service === before.service && after.isActive && after.accessToken
          )
        ).map(i => i.service)
      });
      
      // 🆕 失われた統合を復旧
      for (const lostIntegration of beforeIntegrations) {
        if (lostIntegration.isActive && lostIntegration.accessToken) {
          const stillExists = afterIntegrations.find(after => 
            after.service === lostIntegration.service && after.isActive && after.accessToken
          );
          
          if (!stillExists && lostIntegration.service !== account.provider) {
            console.log('🔄 統合復旧中:', lostIntegration.service);
            await prisma.integration.update({
              where: { id: lostIntegration.id },
              data: {
                isActive: true,
                accessToken: lostIntegration.accessToken,
                refreshToken: lostIntegration.refreshToken,
                scope: lostIntegration.scope,
                updatedAt: new Date(),
              }
            });
            console.log('✅ 統合復旧完了:', lostIntegration.service);
          }
        }
      }
    }

    // 🆕 最終確認
    const finalIntegrations = await prisma.integration.findMany({
      where: { userId: userData.id },
      select: { service: true, isActive: true, accessToken: true }
    });

    console.log('🎉 認証・保存完了:', {
      currentProvider: account.provider,
      userId: userData.id,
      totalIntegrations: finalIntegrations.length,
      activeIntegrations: finalIntegrations.filter(i => i.isActive && i.accessToken).length,
      services: finalIntegrations.filter(i => i.isActive && i.accessToken).map(i => i.service)
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ signIn エラー詳細:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      provider: account?.provider,
      timestamp: new Date().toISOString()
    });
    
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