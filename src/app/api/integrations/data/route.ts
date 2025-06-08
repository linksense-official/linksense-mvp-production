import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * 全サービス統合データ取得API
 * 離職率低下のための包括的なユーザー活動データを取得
 */

interface UnifiedUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  service: string;
  role?: string;
  department?: string;
  lastActivity?: string;
  isActive: boolean;
  activityScore: number;
  communicationScore: number;
  isolationRisk: 'low' | 'medium' | 'high';
  metadata: {
    messageCount?: number;
    meetingCount?: number;
    responseTime?: number;
    workingHours?: string;
    timezone?: string;
    joinDate?: string;
    // Discord関連
    roles?: number;
    nickname?: string;
    // Teams関連
    userType?: string;
    // Google関連
    orgUnit?: string;
    isEnforcedIn2Sv?: boolean;
    domain?: string;
    // ChatWork関連
    title?: string;
    organization?: string;
    chatwork_id?: string;
    // 共通の追加フィールド
    note?: string;
    [key: string]: any; // 追加のメタデータ用
  };
}
interface TeamHealthMetrics {
  totalMembers: number;
  activeMembers: number;
  healthScore: number;
  isolationRisks: {
    high: number;
    medium: number;
    low: number;
  };
  serviceDistribution: Record<string, number>;
  lastUpdated: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 統合データ取得API開始');

    // 認証確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザー取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // アクティブな統合を取得
    const integrations = await prisma.integration.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      select: {
        id: true,
        service: true,
        accessToken: true,
        refreshToken: true,
        teamId: true,
        teamName: true
      }
    });

    console.log('📊 アクティブ統合:', integrations.map(i => i.service));

    // 全サービスからデータ取得
    const allUsers: UnifiedUser[] = [];
    const errors: Array<{service: string, error: string, severity: 'warning' | 'error'}> = [];

    for (const integration of integrations) {
      try {
        console.log(`🔍 ${integration.service} データ取得開始`);
        
        let serviceUsers: UnifiedUser[] = [];
        
        switch (integration.service) {
          case 'slack':
            serviceUsers = await getSlackUsers(integration);
            break;
          case 'azure-ad':
          case 'teams':
            serviceUsers = await getTeamsUsers(integration);
            break;
          case 'google':
          case 'google-meet':
            serviceUsers = await getGoogleUsers(integration);
            break;
          case 'discord':
            serviceUsers = await getDiscordUsers(integration);
            break;
          case 'chatwork':
            serviceUsers = await getChatWorkUsers(integration);
            break;
          default:
            console.warn(`⚠️ 未対応サービス: ${integration.service}`);
            errors.push({
              service: integration.service,
              error: '未対応のサービスです',
              severity: 'warning'
            });
            continue;
        }

        allUsers.push(...serviceUsers);
        console.log(`✅ ${integration.service}: ${serviceUsers.length}人のデータ取得完了`);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'データ取得エラー';
        const severity = errorMsg.includes('権限') || errorMsg.includes('個人情報のみ') ? 'warning' : 'error';
        
        errors.push({
          service: integration.service,
          error: errorMsg,
          severity
        });
        
        console.error(`❌ ${integration.service}: ${errorMsg}`);
        
        // 致命的でないエラーの場合は処理を継続
        if (severity === 'warning') {
          console.log(`⚠️ ${integration.service}: 部分的なデータ取得で継続`);
        }
      }
    }

    // データ統合・重複排除
    const unifiedUsers = mergeUserData(allUsers);
    
    // チーム健全性指標計算
    const teamHealth = calculateTeamHealth(unifiedUsers);

    // 離職リスク分析
    const riskAnalysis = analyzeIsolationRisks(unifiedUsers);

    console.log('✅ 統合データ取得完了:', {
      totalUsers: unifiedUsers.length,
      services: integrations.map(i => i.service),
      healthScore: teamHealth.healthScore
    });

    return NextResponse.json({
      success: true,
      data: {
        users: unifiedUsers,
        teamHealth,
        riskAnalysis,
        metadata: {
          totalServices: integrations.length,
          dataFreshness: new Date().toISOString(),
          errors: errors.length > 0 ? errors : undefined
        }
      }
    });

  } catch (error) {
    console.error('❌ 統合データ取得エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'データ取得に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

// Slackユーザーデータ取得
async function getSlackUsers(integration: any): Promise<UnifiedUser[]> {
  try {
    // ユーザーリスト取得
    const usersResponse = await fetch('https://slack.com/api/users.list', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      throw new Error(`Slack API エラー: ${usersResponse.status}`);
    }

    const usersData = await usersResponse.json();
    
    if (!usersData.ok) {
      throw new Error(`Slack API エラー: ${usersData.error}`);
    }

    // チャンネル情報取得（活動量分析用）
    const channelsResponse = await fetch('https://slack.com/api/conversations.list', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const channelsData = channelsResponse.ok ? await channelsResponse.json() : { channels: [] };

    return usersData.members
      .filter((member: any) => !member.deleted && !member.is_bot && member.id !== 'USLACKBOT')
      .map((member: any) => {
        // 活動スコア計算（プロフィール更新頻度、ステータスなどから）
        const activityScore = calculateSlackActivityScore(member);
        
        // コミュニケーションスコア（後で詳細実装）
        const communicationScore = 75; // 仮の値
        
        // 孤立リスク判定
        const isolationRisk = determineIsolationRisk(activityScore, communicationScore);

        return {
          id: member.id,
          name: member.profile?.real_name || member.name || '名前未設定',
          email: member.profile?.email,
          avatar: member.profile?.image_192 || member.profile?.image_72,
          service: 'slack',
          role: member.is_admin ? 'admin' : member.is_owner ? 'owner' : 'member',
          department: member.profile?.title || '未設定',
          lastActivity: member.updated ? new Date(member.updated * 1000).toISOString() : undefined,
          isActive: member.presence === 'active',
          activityScore,
          communicationScore,
          isolationRisk,
          metadata: {
            workingHours: member.tz_label,
            timezone: member.tz,
            joinDate: member.profile?.start_date
          }
        };
      });

  } catch (error) {
    console.error('❌ Slack データ取得エラー:', error);
    throw error;
  }
}

// Microsoft Teams/Azure ADユーザーデータ取得
async function getTeamsUsers(integration: any): Promise<UnifiedUser[]> {
  try {
    // まず現在のユーザー情報で権限確認
    const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!meResponse.ok) {
      throw new Error(`Teams認証エラー: ${meResponse.status} - アクセストークンが無効です`);
    }

    // ユーザー一覧取得（管理者権限が必要）
    const usersResponse = await fetch('https://graph.microsoft.com/v1.0/users?$top=999&$select=id,displayName,userPrincipalName,mail,department,jobTitle,officeLocation,accountEnabled,createdDateTime,lastSignInDateTime,userType', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      // 管理者権限がない場合、現在のユーザーのみ取得
      console.warn(`Teams ユーザー一覧取得失敗: ${usersResponse.status}. 現在のユーザーのみ取得します`);
      
      const currentUser = await meResponse.json();
      return [{
        id: currentUser.id,
        name: currentUser.displayName || '名前未設定',
        email: currentUser.userPrincipalName || currentUser.mail,
        avatar: undefined,
        service: 'teams',
        role: 'member',
        department: currentUser.department || '未設定',
        lastActivity: new Date().toISOString(),
        isActive: true,
        activityScore: 80,
        communicationScore: 70,
        isolationRisk: 'medium',
        metadata: {
          workingHours: currentUser.officeLocation,
          note: '管理者権限がないため、個人情報のみ取得'
        }
      }];
    }

    const usersData = await usersResponse.json();

    // プロフィール写真の取得を並行実行
    const usersWithPhotos = await Promise.allSettled(
      usersData.value.map(async (user: any) => {
        let photoUrl;
        try {
          const photoResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${user.id}/photo/$value`, {
            headers: {
              'Authorization': `Bearer ${integration.accessToken}`
            }
          });
          if (photoResponse.ok) {
            const photoBlob = await photoResponse.blob();
            photoUrl = URL.createObjectURL(photoBlob);
          }
        } catch (photoError) {
          // 写真取得エラーは無視
        }

        const activityScore = calculateTeamsActivityScore(user);
        const communicationScore = 70;
        const isolationRisk = determineIsolationRisk(activityScore, communicationScore);

        return {
          id: user.id,
          name: user.displayName || '名前未設定',
          email: user.userPrincipalName || user.mail,
          avatar: photoUrl,
          service: 'teams',
          role: user.userType === 'Guest' ? 'guest' : 'member',
          department: user.department || user.jobTitle || '未設定',
          lastActivity: user.lastSignInDateTime,
          isActive: user.accountEnabled,
          activityScore,
          communicationScore,
          isolationRisk,
          metadata: {
            workingHours: user.officeLocation,
            joinDate: user.createdDateTime,
            userType: user.userType
          }
        };
      })
    );

    return usersWithPhotos
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<UnifiedUser>).value);

  } catch (error) {
    console.error('❌ Teams データ取得エラー:', error);
    throw error;
  }
}

// Teams活動スコア計算を追加
function calculateTeamsActivityScore(user: any): number {
  let score = 50; // ベーススコア

  // アカウント有効性
  if (user.accountEnabled) score += 20;
  
  // プロフィール完成度
  if (user.displayName) score += 10;
  if (user.department || user.jobTitle) score += 10;
  if (user.officeLocation) score += 5;
  
  // 最終サインイン
  if (user.lastSignInDateTime) {
    const daysSinceSignIn = (Date.now() - new Date(user.lastSignInDateTime).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSignIn < 7) score += 20;
    else if (daysSinceSignIn < 30) score += 10;
    else if (daysSinceSignIn < 90) score += 5;
  }

  // ゲストユーザーでない
  if (user.userType !== 'Guest') score += 5;

  return Math.min(100, Math.max(0, score));
}

// Google Workspace/Meetユーザーデータ取得
async function getGoogleUsers(integration: any): Promise<UnifiedUser[]> {
  try {
    // ドメイン情報を取得（Admin SDK権限確認）
    let domain = 'primary';
    
    // 現在のユーザー情報取得
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      if (profile.hd) {
        domain = profile.hd; // ホストドメイン
      }
    }

    // Admin SDK でユーザー取得
    const usersResponse = await fetch(`https://admin.googleapis.com/admin/directory/v1/users?domain=${domain}&maxResults=500&projection=full`, {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      // Admin権限がない場合、個人情報のみ取得
      console.warn(`Google Admin SDK アクセス失敗: ${usersResponse.status}. 個人情報のみ取得します`);
      
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        return [{
          id: profile.id,
          name: profile.name || '名前未設定',
          email: profile.email,
          avatar: profile.picture,
          service: 'google',
          role: 'member',
          department: '未設定',
          lastActivity: new Date().toISOString(),
          isActive: true,
          activityScore: 85,
          communicationScore: 75,
          isolationRisk: 'medium',
          metadata: {
            note: 'Admin権限がないため、個人情報のみ取得',
            domain: profile.hd
          }
        }];
      }
      
      throw new Error(`Google API エラー: ${usersResponse.status} - Admin SDK権限が必要です`);
    }

    const usersData = await usersResponse.json();

    return (usersData.users || [])
      .filter((user: any) => !user.suspended && user.primaryEmail) // アクティブユーザーのみ
      .map((user: any) => {
        const activityScore = calculateGoogleActivityScore(user);
        const communicationScore = 75;
        const isolationRisk = determineIsolationRisk(activityScore, communicationScore);

        return {
          id: user.id,
          name: user.name?.fullName || `${user.name?.givenName || ''} ${user.name?.familyName || ''}`.trim() || '名前未設定',
          email: user.primaryEmail,
          avatar: user.thumbnailPhotoUrl,
          service: 'google',
          role: user.isAdmin ? 'admin' : user.isDelegatedAdmin ? 'delegated_admin' : 'member',
          department: user.organizations?.[0]?.department || user.organizations?.[0]?.title || '未設定',
          lastActivity: user.lastLoginTime,
          isActive: !user.suspended && !user.archived,
          activityScore,
          communicationScore,
          isolationRisk,
          metadata: {
            workingHours: user.locations?.[0]?.area || user.locations?.[0]?.buildingId,
            joinDate: user.creationTime,
            orgUnit: user.orgUnitPath,
            isEnforcedIn2Sv: user.isEnforcedIn2Sv
          }
        };
      });

  } catch (error) {
    console.error('❌ Google データ取得エラー:', error);
    throw error;
  }
}

// Google活動スコア計算を追加
function calculateGoogleActivityScore(user: any): number {
  let score = 50; // ベーススコア

  // アカウント状態
  if (!user.suspended && !user.archived) score += 25;
  
  // プロフィール完成度
  if (user.name?.fullName || (user.name?.givenName && user.name?.familyName)) score += 10;
  if (user.organizations?.length > 0) score += 10;
  if (user.locations?.length > 0) score += 5;
  
  // 最終ログイン
  if (user.lastLoginTime) {
    const daysSinceLogin = (Date.now() - new Date(user.lastLoginTime).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLogin < 7) score += 20;
    else if (daysSinceLogin < 30) score += 10;
    else if (daysSinceLogin < 90) score += 5;
  }

  // 2段階認証
  if (user.isEnforcedIn2Sv) score += 10;

  // 管理者権限
  if (user.isAdmin) score += 5;

  return Math.min(100, Math.max(0, score));
}

// Discord ユーザーデータ取得
async function getDiscordUsers(integration: any): Promise<UnifiedUser[]> {
  try {
    // まずギルド情報を取得してアクセス権限を確認
    const guildInfoResponse = await fetch(`https://discord.com/api/v10/guilds/${integration.teamId}`, {
      headers: {
        'Authorization': `Bot ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!guildInfoResponse.ok) {
      // Bot Tokenが無効な場合、User Tokenを試行
      const userGuildResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!userGuildResponse.ok) {
        throw new Error(`Discord認証エラー: ${userGuildResponse.status} - Bot権限またはUser権限が必要です`);
      }
    }

    // ギルドメンバー取得（制限付きで取得）
    const membersResponse = await fetch(`https://discord.com/api/v10/guilds/${integration.teamId}/members?limit=1000`, {
      headers: {
        'Authorization': `Bot ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!membersResponse.ok) {
      // Bot権限でエラーの場合、基本的なギルド情報のみ取得
      console.warn(`Discord メンバー一覧取得失敗: ${membersResponse.status}. 基本情報のみ取得します`);
      
      // 現在のユーザー情報のみ取得
      const currentUserResponse = await fetch(`https://discord.com/api/v10/users/@me`, {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (currentUserResponse.ok) {
        const currentUser = await currentUserResponse.json();
        return [{
          id: currentUser.id,
          name: currentUser.global_name || currentUser.username,
          email: currentUser.email || undefined,
          avatar: currentUser.avatar ? 
            `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png` : 
            undefined,
          service: 'discord',
          role: 'member',
          department: '未設定',
          lastActivity: new Date().toISOString(),
          isActive: true,
          activityScore: 70,
          communicationScore: 65,
          isolationRisk: 'medium',
          metadata: {
            note: '限定的なアクセス権限のため、個人情報のみ取得'
          }
        }];
      }
      
      throw new Error(`Discord API エラー: ${membersResponse.status} - 適切な権限が設定されていません`);
    }

    const members = await membersResponse.json();

    return members
      .filter((member: any) => member.user && !member.user.bot) // Bot除外
      .map((member: any) => {
        const activityScore = calculateDiscordActivityScore(member);
        const communicationScore = 65;
        const isolationRisk = determineIsolationRisk(activityScore, communicationScore);

        return {
          id: member.user.id,
          name: member.nick || member.user.global_name || member.user.username,
          email: undefined, // Discord では通常取得不可
          avatar: member.user.avatar ? 
            `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : 
            undefined,
          service: 'discord',
          role: member.roles?.includes(integration.adminRoleId) ? 'admin' : 'member',
          department: member.roles?.length > 1 ? 'ロール有り' : '未設定',
          lastActivity: member.communication_disabled_until || member.joined_at,
          isActive: !member.communication_disabled_until,
          activityScore,
          communicationScore,
          isolationRisk,
          metadata: {
            joinDate: member.joined_at,
            roles: member.roles?.length || 0,
            nickname: member.nick
          }
        };
      });

  } catch (error) {
    console.error('❌ Discord データ取得エラー:', error);
    throw error;
  }
}

// Discord活動スコア計算を追加
function calculateDiscordActivityScore(member: any): number {
  let score = 50; // ベーススコア

  // ニックネーム設定
  if (member.nick) score += 10;
  
  // ロール数
  if (member.roles && member.roles.length > 1) score += 15;
  
  // アバター設定
  if (member.user.avatar) score += 10;
  
  // 参加からの経過時間（新しいメンバーは活動的とみなす）
  if (member.joined_at) {
    const daysSinceJoin = (Date.now() - new Date(member.joined_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceJoin < 30) score += 15;
    else if (daysSinceJoin < 90) score += 10;
  }

  // 制限状態でない
  if (!member.communication_disabled_until) score += 10;

  return Math.min(100, Math.max(0, score));
}

// ChatWork ユーザーデータ取得
async function getChatWorkUsers(integration: any): Promise<UnifiedUser[]> {
  try {
    // 自分の情報を取得
    const meResponse = await fetch('https://api.chatwork.com/v2/me', {
      headers: {
        'X-ChatWorkToken': integration.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!meResponse.ok) {
      throw new Error(`ChatWork認証エラー: ${meResponse.status} - APIトークンが無効です`);
    }

    const meData = await meResponse.json();

    // コンタクト一覧取得
    const contactsResponse = await fetch('https://api.chatwork.com/v2/contacts', {
      headers: {
        'X-ChatWorkToken': integration.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!contactsResponse.ok) {
      // コンタクト取得失敗時は自分の情報のみ返す
      console.warn(`ChatWork コンタクト取得失敗: ${contactsResponse.status}. 個人情報のみ取得します`);
      
      return [{
        id: meData.account_id.toString(),
        name: meData.name,
        email: undefined,
        avatar: meData.avatar_image_url,
        service: 'chatwork',
        role: 'member',
        department: meData.department || '未設定',
        lastActivity: new Date().toISOString(),
        isActive: true,
        activityScore: 75,
        communicationScore: 70,
        isolationRisk: 'medium',
        metadata: {
          title: meData.title,
          note: 'コンタクト権限制限のため、個人情報のみ取得'
        }
      }];
    }

    const contacts = await contactsResponse.json();

    // 自分の情報も含める
    const allUsers = [meData, ...contacts];

    return allUsers.map((contact: any) => {
      const activityScore = calculateChatWorkActivityScore(contact);
      const communicationScore = 70;
      const isolationRisk = determineIsolationRisk(activityScore, communicationScore);

      return {
        id: contact.account_id.toString(),
        name: contact.name,
        email: undefined, // ChatWorkでは通常取得不可
        avatar: contact.avatar_image_url,
        service: 'chatwork',
        role: contact.account_id === meData.account_id ? 'self' : 'contact',
        department: contact.department || contact.organization_name || '未設定',
        lastActivity: undefined, // ChatWork APIでは最終活動時刻は取得不可
        isActive: true,
        activityScore,
        communicationScore,
        isolationRisk,
        metadata: {
          title: contact.title,
          organization: contact.organization_name,
          chatwork_id: contact.chatwork_id
        }
      };
    });

  } catch (error) {
    console.error('❌ ChatWork データ取得エラー:', error);
    throw error;
  }
}

// ChatWork活動スコア計算を追加
function calculateChatWorkActivityScore(contact: any): number {
  let score = 50; // ベーススコア

  // プロフィール完成度
  if (contact.name) score += 15;
  if (contact.avatar_image_url) score += 10;
  if (contact.department || contact.organization_name) score += 10;
  if (contact.title) score += 10;
  
  // ChatWork ID設定
  if (contact.chatwork_id) score += 15;

  return Math.min(100, Math.max(0, score));
}

// ユーザーデータ統合・重複排除
function mergeUserData(users: UnifiedUser[]): UnifiedUser[] {
  const userMap = new Map<string, UnifiedUser>();

  users.forEach(user => {
    const key = user.email || user.id;
    const existing = userMap.get(key);

    if (existing) {
      // 既存ユーザーがいる場合、データをマージ
      const merged: UnifiedUser = {
        ...existing,
        name: user.name || existing.name,
        email: user.email || existing.email,
        avatar: user.avatar || existing.avatar,
        service: `${existing.service},${user.service}`, // 複数サービス
        activityScore: Math.max(existing.activityScore, user.activityScore),
        communicationScore: Math.max(existing.communicationScore, user.communicationScore),
        isolationRisk: existing.isolationRisk === 'high' || user.isolationRisk === 'high' ? 'high' :
                      existing.isolationRisk === 'medium' || user.isolationRisk === 'medium' ? 'medium' : 'low',
        metadata: { ...existing.metadata, ...user.metadata }
      };
      userMap.set(key, merged);
    } else {
      userMap.set(key, user);
    }
  });

  return Array.from(userMap.values());
}

// Slack活動スコア計算
function calculateSlackActivityScore(member: any): number {
  let score = 50; // ベーススコア

  // プロフィール完成度
  if (member.profile?.real_name) score += 10;
  if (member.profile?.email) score += 10;
  if (member.profile?.image_192) score += 5;

  // 最終更新からの経過時間
  if (member.updated) {
    const daysSinceUpdate = (Date.now() - (member.updated * 1000)) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) score += 20;
    else if (daysSinceUpdate < 30) score += 10;
  }

  // ステータス
  if (!member.deleted && !member.is_restricted) score += 15;

  return Math.min(100, Math.max(0, score));
}

// 孤立リスク判定
function determineIsolationRisk(activityScore: number, communicationScore: number): 'low' | 'medium' | 'high' {
  const averageScore = (activityScore + communicationScore) / 2;
  
  if (averageScore >= 80) return 'low';
  if (averageScore >= 60) return 'medium';
  return 'high';
}

// チーム健全性計算
function calculateTeamHealth(users: UnifiedUser[]): TeamHealthMetrics {
  const activeUsers = users.filter(u => u.isActive);
  const totalScore = users.reduce((sum, u) => sum + u.activityScore, 0);
  
  const isolationRisks = users.reduce((acc, user) => {
    acc[user.isolationRisk]++;
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  const serviceDistribution = users.reduce((acc, user) => {
    user.service.split(',').forEach(service => {
      acc[service.trim()] = (acc[service.trim()] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return {
    totalMembers: users.length,
    activeMembers: activeUsers.length,
    healthScore: users.length > 0 ? Math.round(totalScore / users.length) : 0,
    isolationRisks,
    serviceDistribution,
    lastUpdated: new Date().toISOString()
  };
}

// 離職リスク分析
function analyzeIsolationRisks(users: UnifiedUser[]) {
  const highRiskUsers = users.filter(u => u.isolationRisk === 'high');
  const mediumRiskUsers = users.filter(u => u.isolationRisk === 'medium');
  
  return {
    summary: {
      total: users.length,
      highRisk: highRiskUsers.length,
      mediumRisk: mediumRiskUsers.length,
      lowRisk: users.length - highRiskUsers.length - mediumRiskUsers.length
    },
    recommendations: generateRecommendations(highRiskUsers, mediumRiskUsers),
    trends: {
      // 今後の実装で時系列データから傾向分析
      improving: 0,
      declining: 0,
      stable: users.length
    }
  };
}

// 推奨アクション生成
function generateRecommendations(highRisk: UnifiedUser[], mediumRisk: UnifiedUser[]) {
  const recommendations = [];

  if (highRisk.length > 0) {
    recommendations.push({
      priority: 'high',
      action: '1on1ミーティングの実施',
      targets: highRisk.map(u => u.name),
      reason: '活動量の低下が見られます'
    });
  }

  if (mediumRisk.length > 0) {
    recommendations.push({
      priority: 'medium', 
      action: 'チームビルディング活動',
      targets: mediumRisk.slice(0, 5).map(u => u.name),
      reason: 'コミュニケーション機会の増加が必要です'
    });
  }

  return recommendations;
}