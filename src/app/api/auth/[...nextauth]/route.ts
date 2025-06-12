import { NextRequest } from 'next/server'
import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaClient } from '@prisma/client'

console.log('🚀 LinkSense MVP - Slack統合完全修正版')

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
  user?: {
    id: string;
    name: string;
    email: string;
    image_192?: string;
  };
}

export const authOptions: AuthOptions = {
  providers: [
    // 🔧 Slack カスタムプロバイダー（型修正版）
    {
      id: 'slack',
      name: 'Slack',
      type: 'oauth',
      authorization: {
        url: 'https://slack.com/oauth/v2/authorize',
        params: {
          scope: '', // Bot Token用は空
          user_scope: 'identity.basic,identity.email,identity.avatar', // User Token用のみ
          response_type: 'code'
        }
      },
      token: {
        url: 'https://slack.com/api/oauth.v2.access',
        async request({ params, provider }) {
          console.log('🔍 Slack Token Request:', { code: params.code });
          
          const response = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.SLACK_CLIENT_ID!,
              client_secret: process.env.SLACK_CLIENT_SECRET!,
              code: params.code!,
              redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/slack`
            })
          });
          
          const tokens = await response.json();
          console.log('🔍 Slack Token Response:', {
            ok: tokens.ok,
            hasUserToken: !!tokens.authed_user?.access_token,
            error: tokens.error
          });
          
          if (!tokens.ok) {
            throw new Error(`Slack OAuth error: ${tokens.error}`);
          }
          
          return {
            tokens: {
              access_token: tokens.authed_user?.access_token,
              token_type: 'bearer',
              scope: tokens.authed_user?.scope,
              team_id: tokens.team?.id,
              team_name: tokens.team?.name
            }
          };
        }
      },
      userinfo: {
        url: 'https://slack.com/api/users.identity',
        async request({ tokens }) {
          console.log('🔍 Slack User Info Request:', { hasToken: !!tokens.access_token });
          
          const response = await fetch('https://slack.com/api/users.identity', {
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
            }
          });
          
          const user = await response.json();
          console.log('🔍 Slack User Info Response:', {
            ok: user.ok,
            hasUser: !!user.user,
            error: user.error
          });
          
          if (!user.ok) {
            throw new Error(`Slack user info error: ${user.error}`);
          }
          
          return {
            id: user.user?.id,
            name: user.user?.name,
            email: user.user?.email,
            image: user.user?.image_192,
            team: {
              id: user.team?.id,
              name: user.team?.name
            }
          };
        }
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.image
        };
      },
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!
    },

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
    
    // 🔧 Azure AD設定の修正（スコープ拡張）
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
      authorization: {
        params: {
          scope: 'openid profile email User.Read User.Read.All Directory.Read.All People.Read.All TeamMember.Read.All',
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
  
  // 🆕 ログ機能強化
  logger: {
    error(code, metadata) {
      console.error('🚨 NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('⚠️ NextAuth Warning:', code);
    },
    debug(code, metadata) {
      console.log('🔍 NextAuth Debug:', code, metadata);
    }
  },
  
  // 🆕 イベントログ追加
  events: {
    async signIn({ user, account, profile }) {
      console.log('🔍 SignIn Event:', { 
        provider: account?.provider,
        userId: user.id,
        hasAccessToken: !!account?.access_token,
        tokenLength: account?.access_token?.length || 0,
        scope: account?.scope
      });
    }
  },
  
  
  callbacks: {
    // 🆕 完全に修正されたsignInコールバック
    async signIn({ user, account, profile }) {
  console.log('🎮 認証開始:', account?.provider, 'トークン長さ:', account?.access_token?.length);
  console.log('🔄 修正版signIn開始:', {
    provider: account?.provider,
    email: user?.email,
    hasAccessToken: !!account?.access_token,
    tokenLength: account?.access_token?.length || 0,
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
    console.error('❌ アクセストークンが取得できません:', {
      provider: account.provider,
      accountKeys: Object.keys(account)
    });
    return false;
  }
  
  // 🆕 有効なプロバイダーのみ許可
  const validProviders = ['slack', 'discord', 'google', 'azure-ad'];
  if (!validProviders.includes(account.provider)) {
    console.error('❌ 無効なプロバイダー:', account.provider);
    return false;
  }

  // 🆕 プロバイダー名を正規化してサービス名に変換
  function normalizeServiceName(provider: string): string {
    switch (provider) {
      case 'azure-ad':
        return 'teams';  // azure-ad プロバイダーは teams サービス
      case 'google':
        return 'google'; // google プロバイダーは google サービス
      case 'slack':
        return 'slack';
      case 'discord':
        return 'discord';
      default:
        return provider;
    }
  }
  
  try {
    const normalizedServiceName = normalizeServiceName(account.provider);
    console.log(`📝 ${account.provider} → ${normalizedServiceName} 統合処理開始`);
    
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

    // 🔧 Teams専用のトークン保存強化
    let finalAccessToken = account.access_token;
    let finalRefreshToken = account.refresh_token || '';
    let finalScope = account.scope || '';

    if (account.provider === 'azure-ad') {
      console.log('🔍 Teams Token Details:', {
        access_token_length: account.access_token?.length || 0,
        refresh_token_present: !!account.refresh_token,
        expires_at: account.expires_at,
        scope_length: account.scope?.length || 0
      });

      // トークンの詳細検証
      if (!account.access_token || account.access_token.length < 50) {
        console.error('❌ Teams アクセストークンが無効です');
        return false;
      }
    }

    const integrationData = {
  accessToken: finalAccessToken,
  refreshToken: finalRefreshToken || null,  // 🔧 空文字列ではなくnull
  scope: finalScope || null,                // 🔧 空文字列ではなくnull
  tokenType: account.token_type || 'Bearer',
  isActive: true,
  updatedAt: new Date(),
  teamId: teamId || null,                   // 🔧 undefinedではなくnull
  teamName: teamName || null,               // 🔧 undefinedではなくnull
};
console.log('💾 保存するデータ:', normalizedServiceName, 'トークン長さ:', integrationData.accessToken?.length);

console.log(`💾 ${account.provider} → ${normalizedServiceName} 統合データ保存確認:`, {
  hasAccessToken: !!integrationData.accessToken,
  accessTokenLength: integrationData.accessToken?.length || 0,
  hasRefreshToken: !!integrationData.refreshToken,
  scope: integrationData.scope,
  tokenType: integrationData.tokenType,
  isActive: integrationData.isActive
});

// 🆕 トークン検証を強化
if (!integrationData.accessToken || integrationData.accessToken.length < 10) {
  console.error(`❌ ${normalizedServiceName} アクセストークンが無効:`, {
    token: integrationData.accessToken,
    length: integrationData.accessToken?.length || 0,
    provider: account.provider
  });
  return false;
}

// 🆕 プロバイダー専用の統合処理（サービス名正規化版）
const integration = await prisma.integration.upsert({
  where: {
    userId_service: {
      userId: userData.id,
      service: normalizedServiceName,  // 正規化されたサービス名を使用
    },
  },
  update: integrationData,
  create: {
    userId: userData.id,
    service: normalizedServiceName,  // 正規化されたサービス名を使用
    ...integrationData,
    createdAt: new Date(),
  },
});
console.log('✅ 保存完了:', integration.service, 'トークン長さ:', integration.accessToken?.length);

console.log(`✅ ${account.provider} → ${normalizedServiceName} 統合完了:`, {
  id: integration.id,
  service: integration.service,
  hasToken: !!integration.accessToken,
  tokenLength: integration.accessToken?.length || 0
});

// 🆕 保存後の検証
const savedIntegration = await prisma.integration.findUnique({
  where: {
    userId_service: {
      userId: userData.id,
      service: normalizedServiceName,  // 正規化されたサービス名を使用
    },
  },
});

console.log(`🔍 ${normalizedServiceName} 保存確認:`, {
  found: !!savedIntegration,
  hasToken: !!savedIntegration?.accessToken,
  tokenLength: savedIntegration?.accessToken?.length || 0
});

return true;

} catch (error) {
console.error(`❌ ${account.provider} 統合エラー:`, error);
return false;
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
          user: user.email,
          hasAccessToken: !!account.access_token
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
        token.accessToken = account.access_token; // JWTにもトークンを保存
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

// ヘルパー関数（修正版）
function getTeamId(account: any, profile: ExtendedProfile): string | null {
  switch (account.provider) {
    case 'discord':
      return profile?.guild?.id || null;
    case 'slack':
      return (account as any)?.team_id || profile?.team?.id || null;
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
      return (account as any)?.team_name || profile?.team?.name || null;
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