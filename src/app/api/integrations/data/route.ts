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
    const errors: string[] = [];

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
        }

        allUsers.push(...serviceUsers);
        console.log(`✅ ${integration.service}: ${serviceUsers.length}人のデータ取得完了`);
        
      } catch (error) {
        const errorMsg = `${integration.service}: ${error instanceof Error ? error.message : 'データ取得エラー'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
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
    // Microsoft Graph API でユーザー取得
    const usersResponse = await fetch('https://graph.microsoft.com/v1.0/users', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      throw new Error(`Teams API エラー: ${usersResponse.status}`);
    }

    const usersData = await usersResponse.json();

    return usersData.value.map((user: any) => {
      const activityScore = 80; // Microsoft Graph からの詳細活動データで後で実装
      const communicationScore = 70;
      const isolationRisk = determineIsolationRisk(activityScore, communicationScore);

      return {
        id: user.id,
        name: user.displayName || '名前未設定',
        email: user.userPrincipalName || user.mail,
        avatar: undefined, // Graph API の写真エンドポイントで後で取得可能
        service: 'teams',
        role: 'member',
        department: user.department || '未設定',
        lastActivity: user.lastSignInDateTime,
        isActive: user.accountEnabled,
        activityScore,
        communicationScore,
        isolationRisk,
        metadata: {
          workingHours: user.officeLocation,
          joinDate: user.createdDateTime
        }
      };
    });

  } catch (error) {
    console.error('❌ Teams データ取得エラー:', error);
    throw error;
  }
}

// Google Workspace/Meetユーザーデータ取得
async function getGoogleUsers(integration: any): Promise<UnifiedUser[]> {
  try {
    // Google Admin SDK でユーザー取得
    const usersResponse = await fetch('https://admin.googleapis.com/admin/directory/v1/users', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      throw new Error(`Google API エラー: ${usersResponse.status}`);
    }

    const usersData = await usersResponse.json();

    return (usersData.users || []).map((user: any) => {
      const activityScore = 85;
      const communicationScore = 75;
      const isolationRisk = determineIsolationRisk(activityScore, communicationScore);

      return {
        id: user.id,
        name: user.name?.fullName || '名前未設定',
        email: user.primaryEmail,
        avatar: user.thumbnailPhotoUrl,
        service: 'google',
        role: user.isAdmin ? 'admin' : 'member',
        department: user.organizations?.[0]?.department || '未設定',
        lastActivity: user.lastLoginTime,
        isActive: !user.suspended,
        activityScore,
        communicationScore,
        isolationRisk,
        metadata: {
          workingHours: user.locations?.[0]?.area,
          joinDate: user.creationTime
        }
      };
    });

  } catch (error) {
    console.error('❌ Google データ取得エラー:', error);
    throw error;
  }
}

// Discord ユーザーデータ取得
async function getDiscordUsers(integration: any): Promise<UnifiedUser[]> {
  try {
    // Discord API でギルドメンバー取得
    const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${integration.teamId}/members`, {
      headers: {
        'Authorization': `Bot ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!guildResponse.ok) {
      throw new Error(`Discord API エラー: ${guildResponse.status}`);
    }

    const members = await guildResponse.json();

    return members.map((member: any) => {
      const activityScore = 70;
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
        role: 'member',
        department: '未設定',
        lastActivity: member.joined_at,
        isActive: true,
        activityScore,
        communicationScore,
        isolationRisk,
        metadata: {
          joinDate: member.joined_at
        }
      };
    });

  } catch (error) {
    console.error('❌ Discord データ取得エラー:', error);
    throw error;
  }
}

// ChatWork ユーザーデータ取得
async function getChatWorkUsers(integration: any): Promise<UnifiedUser[]> {
  try {
    // ChatWork API でコンタクト取得
    const contactsResponse = await fetch('https://api.chatwork.com/v2/contacts', {
      headers: {
        'X-ChatWorkToken': integration.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!contactsResponse.ok) {
      throw new Error(`ChatWork API エラー: ${contactsResponse.status}`);
    }

    const contacts = await contactsResponse.json();

    return contacts.map((contact: any) => {
      const activityScore = 75;
      const communicationScore = 70;
      const isolationRisk = determineIsolationRisk(activityScore, communicationScore);

      return {
        id: contact.account_id.toString(),
        name: contact.name,
        email: undefined,
        avatar: contact.avatar_image_url,
        service: 'chatwork',
        role: 'member',
        department: contact.department || '未設定',
        lastActivity: undefined,
        isActive: true,
        activityScore,
        communicationScore,
        isolationRisk,
        metadata: {}
      };
    });

  } catch (error) {
    console.error('❌ ChatWork データ取得エラー:', error);
    throw error;
  }
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