import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * 全サービス統合データ取得API（フレンド・コンタクト・関係者含む）
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
  relationshipType: 'teammate' | 'friend' | 'contact' | 'frequent_contact' | 'self';
  relationshipStrength: number;
  metadata: {
    messageCount?: number;
    meetingCount?: number;
    responseTime?: number;
    workingHours?: string;
    timezone?: string;
    joinDate?: string;
    roles?: number;
    nickname?: string;
    friendSince?: string;
    mutualGuilds?: number;
    gameActivity?: string;
    userType?: string;
    chatFrequency?: number;
    meetingFrequency?: number;
    callFrequency?: number;
    orgUnit?: string;
    isEnforcedIn2Sv?: boolean;
    domain?: string;
    emailFrequency?: number;
    meetFrequency?: number;
    driveCollaboration?: number;
    dmFrequency?: number;
    channelActivity?: number;
    title?: string;
    organization?: string;
    chatwork_id?: string;
    contactType?: 'direct' | 'group' | 'organization';
    roomParticipation?: number;
    note?: string;
    lastInteraction?: string;
    interactionScore?: number;
    fallbackMode?: boolean;
    emergencyMode?: boolean;
    limitedPermissions?: boolean;
    authenticationFailed?: boolean;
    guildsCount?: number;
    connectionsCount?: number;
    availableScopes?: string;
    guildId?: string;
    guildName?: string;
    isOwner?: boolean;
    permissions?: string;
    error?: string;
    needsPermissions?: string;
    [key: string]: any;
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
  relationshipDistribution: Record<string, number>;
  lastUpdated: string;
}
// 🆕 Discord関連の型定義を追加
interface DiscordMessage {
  id: string;
  timestamp: string;
  author: {
    id: string;
    bot?: boolean;
  };
}

interface DiscordChannelActivity {
  channelId: string;
  channelName: string;
  recentMessages: number;
  lastMessageTime?: string;
  uniqueUsers: number;
}

// 🆕 追加の型定義
interface RiskAnalysis {
  summary: {
    total: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    isolated: number;
    weakRelationships: number;
  };
  relationshipRiskAnalysis: Record<string, { high: number; medium: number; low: number; total: number }>;
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    targets: string[];
    reason: string;
    details: string;
    timeline: string;
  }>;
  trends: {
    improving: number;
    declining: number;
    stable: number;
  };
  criticalInsights: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    impact: 'high' | 'medium' | 'low' | 'positive';
    actionRequired: boolean;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 統合データ取得API開始（フレンド・コンタクト含む）');

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
            serviceUsers = await getSlackUsersExtended(integration);
            break;
          case 'azure-ad':
          case 'teams':
            serviceUsers = await getTeamsUsersExtended(integration);
            break;
          case 'google':
          case 'google-meet':
            serviceUsers = await getGoogleUsersExtended(integration);
            break;
          case 'discord':
            serviceUsers = await getDiscordUsersExtended(integration);
            break;
          case 'chatwork':
            serviceUsers = await getChatWorkUsersExtended(integration);
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
        
        // 権限エラーの詳細判定を強化
        let severity: 'warning' | 'error' = 'error';
        
        // より広範囲な権限エラーパターンをキャッチ
        if (errorMsg.includes('401') || 
            errorMsg.includes('403') || 
            errorMsg.includes('権限') || 
            errorMsg.includes('認証エラー') ||
            errorMsg.includes('アクセストークンが無効') ||
            errorMsg.includes('APIトークンが無効') ||
            errorMsg.includes('個人情報のみ') || 
            errorMsg.includes('Admin権限') ||
            errorMsg.includes('管理者権限') ||
            errorMsg.includes('Forbidden')) {
          severity = 'warning';
        }
        
        errors.push({
          service: integration.service,
          error: errorMsg,
          severity
        });
        
        console.error(`❌ ${integration.service}: ${errorMsg}`);
        
        // 権限エラーの場合は必ずフォールバック処理を実行
        if (severity === 'warning') {
          try {
            console.log(`🔄 ${integration.service}: フォールバック処理開始`);
            const fallbackUser = await getFallbackUserData(integration);
            if (fallbackUser) {
              allUsers.push(fallbackUser);
              console.log(`✅ ${integration.service}: フォールバック成功 - ${fallbackUser.name}`);
            } else {
              console.warn(`⚠️ ${integration.service}: フォールバック失敗 - ユーザーデータなし`);
            }
          } catch (fallbackError) {
            const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : 'フォールバック不明エラー';
            console.warn(`⚠️ ${integration.service}: フォールバック取得エラー - ${fallbackMsg}`);
          }
        }
      }
    }

    // データ統合・重複排除
    const unifiedUsers = mergeUserDataExtended(allUsers);
    
    // チーム健全性指標計算
    const teamHealth = calculateTeamHealthExtended(unifiedUsers);

    // 離職リスク分析
    const riskAnalysis = analyzeIsolationRisksExtended(unifiedUsers);

    console.log('✅ 統合データ取得完了:', {
      totalUsers: unifiedUsers.length,
      services: integrations.map(i => i.service),
      healthScore: teamHealth.healthScore,
      relationshipTypes: teamHealth.relationshipDistribution
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

// 権限不足時のフォールバック用ユーザーデータ取得
async function getFallbackUserData(integration: any): Promise<UnifiedUser | null> {
  console.log(`🔄 ${integration.service}: フォールバック処理開始（強化版）`);
  
  try {
    let fallbackEndpoint = '';
    let headers: Record<string, string> = {};
    
    // 各サービスの最も基本的なエンドポイントを使用
    switch (integration.service) {
      case 'slack':
        fallbackEndpoint = 'https://slack.com/api/auth.test';
        headers = {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json'
        };
        break;
        
      case 'azure-ad':
      case 'teams':
        fallbackEndpoint = 'https://graph.microsoft.com/v1.0/me';
        headers = {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json'
        };
        break;
        
      case 'google':
        fallbackEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';
        headers = {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json'
        };
        break;
        
      case 'discord':
        fallbackEndpoint = 'https://discord.com/api/v10/users/@me';
        headers = {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json'
        };
        break;
        
      case 'chatwork':
        fallbackEndpoint = 'https://api.chatwork.com/v2/me';
        headers = {
          'X-ChatWorkToken': integration.accessToken,
          'Content-Type': 'application/json'
        };
        break;
        
      default:
        console.warn(`⚠️ ${integration.service}: フォールバック未対応`);
        return null;
    }

    console.log(`🌐 ${integration.service}: ${fallbackEndpoint} にアクセス中...`);
    
    const response = await fetch(fallbackEndpoint, { headers });
    
    console.log(`📡 ${integration.service}: レスポンス ${response.status}`);
    
    if (!response.ok) {
      console.warn(`⚠️ ${integration.service}: フォールバックAPI失敗 ${response.status}`);
      
      // 完全にアクセストークンが無効な場合の最終フォールバック
      return createEmergencyFallbackUser(integration);
    }

    const userData = await response.json();
    console.log(`✅ ${integration.service}: フォールバックデータ取得成功`);
    
    // サービス別のデータ処理
    let processedData = userData;
    if (integration.service === 'slack' && userData.user) {
      processedData = userData.user;
    }
    
    return createFallbackUser(processedData, integration.service);
    
  } catch (error) {
    console.warn(`❌ ${integration.service}: フォールバック処理エラー:`, error);
    
    // 最終的なエラー時は緊急フォールバック
    return createEmergencyFallbackUser(integration);
  }
}

// 緊急時の最小限ユーザー作成（アクセストークンが完全に無効な場合）
function createEmergencyFallbackUser(integration: any): UnifiedUser {
  console.log(`🚨 ${integration.service}: 緊急フォールバック実行`);
  
  return {
    id: `emergency-${integration.service}-${Date.now()}`,
    name: `${integration.service.toUpperCase()}ユーザー（認証失敗）`,
    email: undefined,
    avatar: undefined,
    service: integration.service,
    role: 'unknown',
    department: '認証エラー',
    lastActivity: new Date().toISOString(),
    isActive: false,
    activityScore: 0,
    communicationScore: 0,
    isolationRisk: 'high',
    relationshipType: 'self',
    relationshipStrength: 0,
    metadata: {
      note: `${integration.service}の認証が完全に失敗しました。再認証が必要です。`,
      fallbackMode: true,
      emergencyMode: true,
      limitedPermissions: true,
      authenticationFailed: true
    }
  };
}

// フォールバック用ユーザーオブジェクト作成
function createFallbackUser(userData: any, service: string): UnifiedUser {
  const baseUser: UnifiedUser = {
    id: userData.id || userData.account_id?.toString() || 'fallback-user',
    name: userData.name || userData.displayName || userData.username || userData.global_name || '名前未設定',
    email: userData.email || userData.userPrincipalName || userData.mail,
    avatar: userData.avatar_image_url || userData.picture || 
            (userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : undefined),
    service,
    role: 'self',
    department: userData.department || userData.organization_name || '未設定',
    lastActivity: new Date().toISOString(),
    isActive: true,
    activityScore: 70,
    communicationScore: 60,
    isolationRisk: 'medium',
    relationshipType: 'self',
    relationshipStrength: 100,
    metadata: {
      note: `権限制限により個人情報のみ取得（${service}）`,
      fallbackMode: true,
      limitedPermissions: true
    }
  };

  return baseUser;
}

// Slackユーザーデータ取得（DM相手含む）
// Slack ユーザーデータ取得（チャンネル別メッセージ分析版）
async function getSlackUsersExtended(integration: any): Promise<UnifiedUser[]> {
  try {
    console.log('🔍 Slack統合開始 - チャンネル別メッセージ分析版');
    const allUsers: UnifiedUser[] = [];

    // 1. ワークスペース基本情報取得
    const teamInfoResponse = await fetch('https://slack.com/api/team.info', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    let workspaceInfo = {};
    if (teamInfoResponse.ok) {
      const teamData = await teamInfoResponse.json();
      if (teamData.ok) {
        workspaceInfo = teamData.team;
      }
    }

    // 2. ワークスペースメンバー取得
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

    // 3. チャンネル一覧取得
    const channelsResponse = await fetch('https://slack.com/api/conversations.list?exclude_archived=true&types=public_channel,private_channel', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    let channels = [];
    if (channelsResponse.ok) {
      const channelsData = await channelsResponse.json();
      if (channelsData.ok) {
        channels = channelsData.channels;
      }
    }

    // 4. ワークスペース全体の活動分析
    const workspaceActivity = await analyzeSlackWorkspaceActivity(integration.accessToken, channels);
    
    // 5. 各ユーザーの詳細活動分析
    const userActivities = await analyzeSlackUserActivities(integration.accessToken, channels, usersData.members);

    // 6. DM履歴分析（既存）
    const dmAnalysis = await analyzeSlackDMs(integration.accessToken);

    console.log(`✅ Slack分析完了 - チャンネル: ${channels.length}個, ユーザー: ${usersData.members.length}人`);

    // 7. ユーザーデータ統合・スコア計算
    const workspaceMembers = usersData.members
      .filter((member: any) => !member.deleted && !member.is_bot && member.id !== 'USLACKBOT')
      .map((member: any) => {
        const userActivity = userActivities[member.id] || {};
        const dmData = dmAnalysis[member.id] || {};
        
        // 高度なスコア計算
        const activityScore = calculateSlackActivityScoreAdvanced(member, workspaceActivity, userActivity);
        const communicationScore = calculateSlackCommunicationScoreAdvanced(member, userActivity, dmData);
        
        const isolationRisk = determineIsolationRisk(activityScore, communicationScore);
        
        // 関係性タイプの決定
        let relationshipType: 'teammate' | 'frequent_contact' = 'teammate';
        let relationshipStrength = 30;
        
        if (userActivity.messagesLast30Days > 100 || dmData.dmCount > 20) {
          relationshipType = 'frequent_contact';
          relationshipStrength = 60 + Math.min(30, (userActivity.messagesLast30Days || 0) / 10);
        } else if (userActivity.messagesLast30Days > 20 || dmData.dmCount > 5) {
          relationshipStrength = 40 + Math.min(20, (userActivity.messagesLast30Days || 0) / 5);
        }

        return {
          id: member.id,
          name: member.profile?.real_name || member.name || '名前未設定',
          email: member.profile?.email,
          avatar: member.profile?.image_192 || member.profile?.image_72,
          service: 'slack',
          role: member.is_admin ? 'admin' : member.is_owner ? 'owner' : 'member',
          department: member.profile?.title || '未設定',
          lastActivity: userActivity.lastMessageTime || (member.updated ? new Date(member.updated * 1000).toISOString() : undefined),
          isActive: member.presence === 'active' || (userActivity.messagesLast7Days || 0) > 0,
          activityScore,
          communicationScore,
          isolationRisk,
          relationshipType,
          relationshipStrength,
          metadata: {
            // 基本情報
            workingHours: member.tz_label,
            timezone: member.tz,
            joinDate: member.profile?.start_date,
            
            // メッセージ活動詳細
            messagesLast30Days: userActivity.messagesLast30Days || 0,
            messagesLast7Days: userActivity.messagesLast7Days || 0,
            activeChannelsCount: userActivity.activeChannelsCount || 0,
            channelDiversity: userActivity.channelDiversity || 0,
            
            // エンゲージメント
            reactionsGiven: userActivity.reactionsGiven || 0,
            reactionsReceived: userActivity.reactionsReceived || 0,
            avgResponseTimeMinutes: userActivity.avgResponseTimeMinutes || null,
            
            // DM活動
            dmFrequency: dmData.dmCount || 0,
            lastDMTime: dmData.lastInteraction,
            
            // チャンネル参加
            totalChannelsJoined: userActivity.totalChannelsJoined || 0,
            publicChannelsRatio: userActivity.publicChannelsRatio || 0,
            
            // 活動パターン
            activityLevel: userActivity.messagesLast30Days > 100 ? 'high' : 
                          userActivity.messagesLast30Days > 20 ? 'medium' : 'low',
            engagementLevel: userActivity.reactionsGiven > 50 ? 'high' : 
                           userActivity.reactionsGiven > 10 ? 'medium' : 'low',
            responsivenessLevel: userActivity.avgResponseTimeMinutes < 30 ? 'high' : 
                               userActivity.avgResponseTimeMinutes < 120 ? 'medium' : 'low'
          }
        };
      });

    allUsers.push(...workspaceMembers);

    console.log(`✅ Slack 総取得数: ${allUsers.length}人`);
    console.log(`📊 活動レベル分布:`, {
      high: allUsers.filter(u => u.metadata?.activityLevel === 'high').length,
      medium: allUsers.filter(u => u.metadata?.activityLevel === 'medium').length,
      low: allUsers.filter(u => u.metadata?.activityLevel === 'low').length
    });
    
    return allUsers;

  } catch (error) {
    console.error('❌ Slack データ取得エラー:', error);
    throw error;
  }
}

// ワークスペース活動分析
async function analyzeSlackWorkspaceActivity(accessToken: string, channels: any[]): Promise<any> {
  const workspaceStats = {
    totalChannels: channels.length,
    publicChannels: channels.filter(ch => !ch.is_private).length,
    privateChannels: channels.filter(ch => ch.is_private).length,
    totalMembers: 0,
    activeChannels: 0,
    totalMessages: 0
  };

  // アクティブチャンネルの分析（最大10チャンネル）
  for (const channel of channels.slice(0, 10)) {
    try {
      const historyResponse = await fetch(`https://slack.com/api/conversations.history?channel=${channel.id}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (historyResponse.ok) {
        const history = await historyResponse.json();
        if (history.ok && history.messages?.length > 0) {
          workspaceStats.activeChannels++;
          workspaceStats.totalMessages += history.messages.length;
        }
      }
    } catch (error) {
      console.warn(`チャンネル ${channel.name} の履歴取得失敗`);
    }
  }

  return workspaceStats;
}

// ユーザー活動分析
async function analyzeSlackUserActivities(accessToken: string, channels: any[], members: any[]): Promise<Record<string, any>> {
  const userActivities: Record<string, any> = {};
  
  // 各ユーザーの初期化
  members.forEach(member => {
    if (!member.deleted && !member.is_bot) {
      userActivities[member.id] = {
        messagesLast30Days: 0,
        messagesLast7Days: 0,
        activeChannelsCount: 0,
        totalChannelsJoined: 0,
        reactionsGiven: 0,
        reactionsReceived: 0,
        lastMessageTime: null,
        responseTimes: [],
        channelsActive: new Set()
      };
    }
  });

  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

  // チャンネル別分析（最大15チャンネル）
  for (const channel of channels.slice(0, 15)) {
    try {
      // チャンネルメンバー取得
      const membersResponse = await fetch(`https://slack.com/api/conversations.members?channel=${channel.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        if (membersData.ok) {
          membersData.members?.forEach((memberId: string) => {
            if (userActivities[memberId]) {
              userActivities[memberId].totalChannelsJoined++;
            }
          });
        }
      }

      // チャンネル履歴取得
      const historyResponse = await fetch(`https://slack.com/api/conversations.history?channel=${channel.id}&limit=200`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (historyResponse.ok) {
        const history = await historyResponse.json();
        if (history.ok && history.messages) {
          
          history.messages.forEach((message: any) => {
            if (message.user && userActivities[message.user]) {
              const messageTime = parseFloat(message.ts) * 1000;
              
              // 30日以内のメッセージ
              if (messageTime > thirtyDaysAgo) {
                userActivities[message.user].messagesLast30Days++;
                userActivities[message.user].channelsActive.add(channel.id);
                
                // 最新メッセージ時刻更新
                if (!userActivities[message.user].lastMessageTime || messageTime > userActivities[message.user].lastMessageTime) {
                  userActivities[message.user].lastMessageTime = new Date(messageTime).toISOString();
                }
              }
              
              // 7日以内のメッセージ
              if (messageTime > sevenDaysAgo) {
                userActivities[message.user].messagesLast7Days++;
              }
              
              // リアクション分析
              if (message.reactions) {
                message.reactions.forEach((reaction: any) => {
                  reaction.users?.forEach((userId: string) => {
                    if (userActivities[userId]) {
                      userActivities[userId].reactionsGiven++;
                    }
                  });
                  
                  if (userActivities[message.user]) {
                    userActivities[message.user].reactionsReceived += reaction.count || 0;
                  }
                });
              }
            }
          });
        }
      }
    } catch (error) {
      console.warn(`チャンネル ${channel.name} の分析失敗:`, error);
    }
  }

  // 後処理・計算
  Object.keys(userActivities).forEach(userId => {
    const activity = userActivities[userId];
    activity.activeChannelsCount = activity.channelsActive.size;
    activity.channelDiversity = activity.totalChannelsJoined > 0 ? activity.activeChannelsCount / activity.totalChannelsJoined : 0;
    activity.publicChannelsRatio = activity.totalChannelsJoined > 0 ? activity.activeChannelsCount / activity.totalChannelsJoined : 0;
    
    // 平均応答時間計算（簡易版）
    if (activity.responseTimes.length > 0) {
      activity.avgResponseTimeMinutes = activity.responseTimes.reduce((a: number, b: number) => a + b, 0) / activity.responseTimes.length / 60;
    }
    
    delete activity.channelsActive; // Set は不要なので削除
  });

  return userActivities;
}

// DM分析
async function analyzeSlackDMs(accessToken: string): Promise<Record<string, any>> {
  const dmAnalysis: Record<string, any> = {};
  
  try {
    const conversationsResponse = await fetch('https://slack.com/api/conversations.list?types=im', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (conversationsResponse.ok) {
      const dmData = await conversationsResponse.json();
      if (dmData.ok && dmData.channels) {
        
        for (const dm of dmData.channels.slice(0, 20)) {
          if (dm.user) {
            try {
              const historyResponse = await fetch(`https://slack.com/api/conversations.history?channel=${dm.id}&limit=50`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (historyResponse.ok) {
                const history = await historyResponse.json();
                if (history.ok && history.messages) {
                  dmAnalysis[dm.user] = {
                    dmCount: history.messages.length,
                    lastInteraction: history.messages.length > 0 ? 
                      new Date(parseFloat(history.messages[0].ts) * 1000).toISOString() : null
                  };
                }
              }
            } catch (error) {
              console.warn(`DM ${dm.user} の分析失敗`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('DM分析失敗:', error);
  }

  return dmAnalysis;
}

// 高度なスコア計算
function calculateSlackActivityScoreAdvanced(member: any, workspaceActivity: any, userActivity: any): number {
  let score = 20; // ベーススコア

  // 1. 最近のメッセージ活動（30点）
  const messages30Days = userActivity.messagesLast30Days || 0;
  if (messages30Days > 200) score += 30;
  else if (messages30Days > 100) score += 25;
  else if (messages30Days > 50) score += 20;
  else if (messages30Days > 20) score += 15;
  else if (messages30Days > 5) score += 10;
  else if (messages30Days > 0) score += 5;

  // 2. チャンネル参加の多様性（20点）
  const channelDiversity = userActivity.channelDiversity || 0;
  if (channelDiversity > 0.5) score += 20;
  else if (channelDiversity > 0.3) score += 15;
  else if (channelDiversity > 0.2) score += 10;
  else if (channelDiversity > 0.1) score += 5;

  // 3. エンゲージメント（リアクション）（15点）
  const reactionsGiven = userActivity.reactionsGiven || 0;
  if (reactionsGiven > 100) score += 15;
  else if (reactionsGiven > 50) score += 12;
  else if (reactionsGiven > 20) score += 8;
  else if (reactionsGiven > 5) score += 4;

  // 4. 最近の活動（15点）
  const messages7Days = userActivity.messagesLast7Days || 0;
  if (messages7Days > 50) score += 15;
  else if (messages7Days > 20) score += 12;
  else if (messages7Days > 10) score += 8;
  else if (messages7Days > 3) score += 5;
  else if (messages7Days > 0) score += 2;

  // 5. プロフィール充実度（10点）
  if (member.profile?.real_name) score += 3;
  if (member.profile?.email) score += 2;
  if (member.profile?.phone) score += 2;
  if (member.profile?.status_text) score += 1;
  if (member.profile?.image_192) score += 2;

  return Math.min(100, score);
}

function calculateSlackCommunicationScoreAdvanced(member: any, userActivity: any, dmData: any): number {
  let score = 40; // ベーススコア

  // 1. メッセージ頻度（25点）
  const messages30Days = userActivity.messagesLast30Days || 0;
  if (messages30Days > 150) score += 25;
  else if (messages30Days > 75) score += 20;
  else if (messages30Days > 30) score += 15;
  else if (messages30Days > 10) score += 10;
  else if (messages30Days > 0) score += 5;

  // 2. DM活動（20点）
  const dmCount = dmData.dmCount || 0;
  if (dmCount > 30) score += 20;
  else if (dmCount > 15) score += 15;
  else if (dmCount > 5) score += 10;
  else if (dmCount > 0) score += 5;

  // 3. チャンネル活動の幅（15点）
  const activeChannels = userActivity.activeChannelsCount || 0;
  if (activeChannels > 10) score += 15;
  else if (activeChannels > 5) score += 12;
  else if (activeChannels > 3) score += 8;
  else if (activeChannels > 1) score += 5;

  return Math.min(100, score);
}

// Microsoft Teams/Azure ADユーザーデータ取得（会議参加・応答性分析版）
async function getTeamsUsersExtended(integration: any): Promise<UnifiedUser[]> {
  try {
    console.log('🔍 Teams統合開始 - 会議参加・応答性分析版');
    console.log('🔍 Teams統合開始 - トークン長:', integration.accessToken?.length || 0);
    
    const allUsers: UnifiedUser[] = [];

    // 1. アクセストークンの詳細確認
    if (!integration.accessToken) {
      throw new Error('Teams アクセストークンが存在しません');
    }

    if (integration.accessToken.length < 50) {
      throw new Error(`Teams アクセストークンが短すぎます（長さ: ${integration.accessToken.length}）`);
    }

    console.log('✅ Teams アクセストークン確認完了 - 長さ:', integration.accessToken.length);

    // 2. 現在のユーザー情報で権限確認
    const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🔍 Teams /me API レスポンス:', meResponse.status);

    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      console.error('❌ Teams /me API エラー:', errorText);
      throw new Error(`Teams認証エラー: ${meResponse.status} - ${errorText}`);
    }

    const currentUser = await meResponse.json();
    console.log('✅ Teams 現在ユーザー取得成功:', currentUser.displayName);

    // 3. 組織ユーザー一覧取得
    console.log('🔍 Teams 組織ユーザー取得開始...');
    
    const usersResponse = await fetch('https://graph.microsoft.com/v1.0/users?$top=999&$select=id,displayName,userPrincipalName,mail,department,jobTitle,officeLocation,accountEnabled,createdDateTime,lastSignInDateTime,userType', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🔍 Teams /users API レスポンス:', usersResponse.status);

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error('❌ Teams /users API エラー:', errorText);
      
      // 管理者権限がない場合、現在のユーザーのみ取得
      console.warn(`Teams ユーザー一覧取得失敗: ${usersResponse.status}. 現在のユーザーのみ取得します`);
      
      return [{
        id: currentUser.id,
        name: currentUser.displayName || '名前未設定',
        email: currentUser.userPrincipalName || currentUser.mail,
        avatar: undefined,
        service: 'teams',
        role: 'self',
        department: currentUser.department || '未設定',
        lastActivity: new Date().toISOString(),
        isActive: true,
        activityScore: 80,
        communicationScore: 70,
        isolationRisk: 'medium',
        relationshipType: 'self',
        relationshipStrength: 100,
        metadata: {
          workingHours: currentUser.officeLocation,
          note: '管理者権限がないため、個人情報のみ取得',
          tokenLength: integration.accessToken.length,
          permissions: 'User.Read のみ'
        }
      }];
    }

    const usersData = await usersResponse.json();
    console.log('✅ Teams 組織ユーザー取得成功 - 人数:', usersData.value?.length || 0);

    // 4. 会議詳細分析
    console.log('🔍 Teams 会議分析開始...');
    const meetingAnalysis = await analyzeTeamsMeetings(integration.accessToken, currentUser.id);
    
    // 5. チャット応答性分析
    console.log('🔍 Teams チャット応答性分析開始...');
    const chatResponsiveness = await analyzeTeamsChatResponsiveness(integration.accessToken, currentUser.id);
    
    // 6. ファイル共同作業分析
    console.log('🔍 Teams ファイル共同作業分析開始...');
    const collaborationData = await analyzeTeamsCollaboration(integration.accessToken, currentUser.id);

    // 7. ユーザーデータ統合
    console.log('🔍 Teams ユーザーデータ統合開始...');
    
    const organizationUsers = (usersData.value || [])
      .filter((user: any) => user.accountEnabled)
      .map((user: any) => {
        const meetingStats = meetingAnalysis[user.id] || meetingAnalysis[user.userPrincipalName] || {};
        const chatStats = chatResponsiveness[user.id] || chatResponsiveness[user.userPrincipalName] || {};
        const collabStats = collaborationData[user.id] || collaborationData[user.userPrincipalName] || {};
        
        // 高度なスコア計算
        const activityScore = calculateTeamsActivityScoreAdvanced(user, meetingStats, chatStats, collabStats);
        const communicationScore = calculateTeamsCommunicationScoreAdvanced(user, meetingStats, chatStats, collabStats);
        
        const isolationRisk = determineIsolationRisk(activityScore, communicationScore);
        
        // 関係性タイプの決定
        let relationshipType: 'teammate' | 'frequent_contact' = 'teammate';
        let relationshipStrength = 30;
        
        const totalInteractions = (meetingStats.meetingsAttended || 0) + (chatStats.chatsParticipated || 0) + (collabStats.filesCollaborated || 0);
        
        if (totalInteractions > 50 || meetingStats.meetingsOrganized > 5) {
          relationshipType = 'frequent_contact';
          relationshipStrength = 60 + Math.min(30, totalInteractions);
        } else if (totalInteractions > 20) {
          relationshipStrength = 40 + Math.min(20, totalInteractions);
        }

        return {
          id: user.id,
          name: user.displayName || '名前未設定',
          email: user.userPrincipalName || user.mail,
          avatar: undefined, // プロフィール写真は後で取得
          service: 'teams',
          role: user.userType === 'Guest' ? 'guest' : 'member',
          department: user.department || user.jobTitle || '未設定',
          lastActivity: user.lastSignInDateTime || meetingStats.lastMeetingTime || chatStats.lastChatTime,
          isActive: user.accountEnabled && (activityScore > 40),
          activityScore,
          communicationScore,
          isolationRisk,
          relationshipType,
          relationshipStrength,
          metadata: {
            // 基本情報
            workingHours: user.officeLocation,
            joinDate: user.createdDateTime,
            userType: user.userType,
            tokenLength: integration.accessToken.length,
            permissions: 'User.Read.All, Calendars.Read, Chat.Read',
            
            // 会議活動詳細
            meetingsAttended: meetingStats.meetingsAttended || 0,
            meetingsOrganized: meetingStats.meetingsOrganized || 0,
            meetingAttendanceRate: meetingStats.attendanceRate || 0,
            avgMeetingDuration: meetingStats.avgDurationMinutes || 0,
            meetingParticipationScore: meetingStats.participationScore || 0,
            lastMeetingTime: meetingStats.lastMeetingTime,
            
            // チャット応答性
            chatsParticipated: chatStats.chatsParticipated || 0,
            messagesLast30Days: chatStats.messagesLast30Days || 0,
            avgResponseTimeMinutes: chatStats.avgResponseTimeMinutes || null,
            chatInitiationRate: chatStats.initiationRate || 0,
            lastChatTime: chatStats.lastChatTime,
            
            // ファイル共同作業
            filesCollaborated: collabStats.filesCollaborated || 0,
            filesCreated: collabStats.filesCreated || 0,
            filesEdited: collabStats.filesEdited || 0,
            commentsLeft: collabStats.commentsLeft || 0,
            lastFileActivity: collabStats.lastFileActivity,
            
            // 総合指標
            totalInteractions: totalInteractions,
            collaborationLevel: totalInteractions > 50 ? 'high' : totalInteractions > 20 ? 'medium' : 'low',
            responsivenessLevel: chatStats.avgResponseTimeMinutes < 60 ? 'high' : 
                               chatStats.avgResponseTimeMinutes < 240 ? 'medium' : 'low',
            meetingEngagement: meetingStats.participationScore > 70 ? 'high' : 
                             meetingStats.participationScore > 40 ? 'medium' : 'low',
            
            // 活動パターン
            workStyle: meetingStats.meetingsOrganized > 5 ? 'leader' : 
                      collabStats.filesCreated > 10 ? 'creator' : 
                      chatStats.messagesLast30Days > 100 ? 'communicator' : 'participant'
          }
        };
      });

    allUsers.push(...organizationUsers);

    console.log(`✅ Teams 総取得数: ${allUsers.length}人`);
    console.log(`📊 ワークスタイル分布:`, {
      leader: allUsers.filter(u => u.metadata?.workStyle === 'leader').length,
      creator: allUsers.filter(u => u.metadata?.workStyle === 'creator').length,
      communicator: allUsers.filter(u => u.metadata?.workStyle === 'communicator').length,
      participant: allUsers.filter(u => u.metadata?.workStyle === 'participant').length
    });
    console.log('🔍 Teams 統合完了 - アクセストークン長:', integration.accessToken.length);
    
    return allUsers;

  } catch (error) {
    console.error('❌ Teams データ取得エラー:', error);
    console.error('🔍 Teams エラー詳細:', {
      hasToken: !!integration.accessToken,
      tokenLength: integration.accessToken?.length || 0,
      service: integration.service
    });
    throw error;
  }
}

// 会議詳細分析
async function analyzeTeamsMeetings(accessToken: string, currentUserId: string): Promise<Record<string, any>> {
  const meetingAnalysis: Record<string, any> = {};
  
  try {
    // 過去30日の会議取得
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const eventsResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/events?$filter=start/dateTime ge '${thirtyDaysAgo}'&$select=id,subject,attendees,start,end,organizer,isOrganizer&$top=200`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (eventsResponse.ok) {
      const events = await eventsResponse.json();
      console.log('✅ Teams 会議取得成功 - 件数:', events.value?.length || 0);
      
      // ユーザー別会議統計を初期化
      const userStats: Record<string, any> = {};
      
      for (const event of events.value || []) {
        const startTime = new Date(event.start.dateTime);
        const endTime = new Date(event.end.dateTime);
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        
        // 主催者の統計
        if (event.organizer?.emailAddress?.address) {
          const organizerEmail = event.organizer.emailAddress.address;
          if (!userStats[organizerEmail]) {
            userStats[organizerEmail] = {
              meetingsAttended: 0,
              meetingsOrganized: 0,
              totalDurationMinutes: 0,
              meetingTimes: [],
              participationScore: 0
            };
          }
          
          userStats[organizerEmail].meetingsOrganized++;
          userStats[organizerEmail].totalDurationMinutes += durationMinutes;
          userStats[organizerEmail].meetingTimes.push(startTime);
          userStats[organizerEmail].participationScore += 20; // 主催者ボーナス
        }
        
        // 参加者の統計
        if (event.attendees) {
          for (const attendee of event.attendees) {
            if (attendee.emailAddress?.address) {
              const attendeeEmail = attendee.emailAddress.address;
              if (!userStats[attendeeEmail]) {
                userStats[attendeeEmail] = {
                  meetingsAttended: 0,
                  meetingsOrganized: 0,
                  totalDurationMinutes: 0,
                  meetingTimes: [],
                  participationScore: 0
                };
              }
              
              userStats[attendeeEmail].meetingsAttended++;
              userStats[attendeeEmail].totalDurationMinutes += durationMinutes;
              userStats[attendeeEmail].meetingTimes.push(startTime);
              
              // 参加状況による得点
              if (attendee.status?.response === 'accepted') {
                userStats[attendeeEmail].participationScore += 10;
              } else if (attendee.status?.response === 'tentativelyAccepted') {
                userStats[attendeeEmail].participationScore += 5;
              }
            }
          }
        }
      }
      
      // 統計の後処理
Object.keys(userStats).forEach(email => {
  const stats = userStats[email];
  const totalMeetings = stats.meetingsAttended + stats.meetingsOrganized;
  
  stats.attendanceRate = totalMeetings > 0 ? stats.meetingsAttended / totalMeetings : 0;
  stats.avgDurationMinutes = totalMeetings > 0 ? stats.totalDurationMinutes / totalMeetings : 0;
  stats.lastMeetingTime = stats.meetingTimes.length > 0 ? 
    Math.max(...stats.meetingTimes.map((t: Date) => t.getTime())) : null;
  
  if (stats.lastMeetingTime) {
    stats.lastMeetingTime = new Date(stats.lastMeetingTime).toISOString();
  }
  
  // 参加スコアの正規化
  stats.participationScore = Math.min(100, stats.participationScore);
  
  meetingAnalysis[email] = stats;
});
      
    } else {
      console.warn('Teams 会議取得失敗:', eventsResponse.status);
    }
  } catch (error) {
    console.warn('Teams 会議分析エラー:', error);
  }
  
  return meetingAnalysis;
}

// チャット応答性分析
async function analyzeTeamsChatResponsiveness(accessToken: string, currentUserId: string): Promise<Record<string, any>> {
  const chatAnalysis: Record<string, any> = {};
  
  try {
    const chatsResponse = await fetch('https://graph.microsoft.com/v1.0/me/chats?$top=100', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (chatsResponse.ok) {
      const chatsData = await chatsResponse.json();
      console.log('✅ Teams チャット取得成功 - 件数:', chatsData.value?.length || 0);
      
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      
      for (const chat of (chatsData.value || []).slice(0, 50)) {
        try {
          // チャットメンバー取得
          const membersResponse = await fetch(`https://graph.microsoft.com/v1.0/me/chats/${chat.id}/members`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (membersResponse.ok) {
            const members = await membersResponse.json();
            
            // チャットメッセージ取得
            const messagesResponse = await fetch(`https://graph.microsoft.com/v1.0/me/chats/${chat.id}/messages?$top=100`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (messagesResponse.ok) {
              const messages = await messagesResponse.json();
              
              // メッセージ分析
              const recentMessages = messages.value?.filter((msg: any) => 
                new Date(msg.createdDateTime).getTime() > thirtyDaysAgo
              ) || [];
              
              // ユーザー別メッセージ統計
              const userMessageStats: Record<string, any> = {};
              
              recentMessages.forEach((message: any) => {
                if (message.from?.user?.userPrincipalName) {
                  const userEmail = message.from.user.userPrincipalName;
                  if (!userMessageStats[userEmail]) {
                    userMessageStats[userEmail] = {
                      messageCount: 0,
                      lastMessageTime: null,
                      messageTimes: []
                    };
                  }
                  
                  userMessageStats[userEmail].messageCount++;
                  const messageTime = new Date(message.createdDateTime).getTime();
                  userMessageStats[userEmail].messageTimes.push(messageTime);
                  
                  if (!userMessageStats[userEmail].lastMessageTime || messageTime > userMessageStats[userEmail].lastMessageTime) {
                    userMessageStats[userEmail].lastMessageTime = messageTime;
                  }
                }
              });
              
              // 応答時間計算
              Object.keys(userMessageStats).forEach(email => {
                const stats = userMessageStats[email];
                
                if (!chatAnalysis[email]) {
                  chatAnalysis[email] = {
                    chatsParticipated: 0,
                    messagesLast30Days: 0,
                    responseTimes: [],
                    lastChatTime: null,
                    initiatedChats: 0
                  };
                }
                
                chatAnalysis[email].chatsParticipated++;
                chatAnalysis[email].messagesLast30Days += stats.messageCount;
                
                if (stats.lastMessageTime) {
                  if (!chatAnalysis[email].lastChatTime || stats.lastMessageTime > chatAnalysis[email].lastChatTime) {
                    chatAnalysis[email].lastChatTime = new Date(stats.lastMessageTime).toISOString();
                  }
                }
                
                // 簡易応答時間計算（連続するメッセージ間の時間）
                if (stats.messageTimes.length > 1) {
                  stats.messageTimes.sort((a: number, b: number) => a - b);
                  for (let i = 1; i < stats.messageTimes.length; i++) {
                    const responseTime = (stats.messageTimes[i] - stats.messageTimes[i-1]) / (1000 * 60); // 分
                    if (responseTime < 1440) { // 24時間以内の応答のみ
                      chatAnalysis[email].responseTimes.push(responseTime);
                    }
                  }
                }
              });
              
            }
          }
        } catch (error) {
          console.warn(`チャット ${chat.id} の分析失敗:`, error);
        }
      }
      
      // 応答時間の平均計算
      Object.keys(chatAnalysis).forEach(email => {
        const analysis = chatAnalysis[email];
        if (analysis.responseTimes.length > 0) {
          analysis.avgResponseTimeMinutes = analysis.responseTimes.reduce((a: number, b: number) => a + b, 0) / analysis.responseTimes.length;
        }
        analysis.initiationRate = analysis.chatsParticipated > 0 ? analysis.initiatedChats / analysis.chatsParticipated : 0;
      });
      
    } else {
      console.warn('Teams チャット取得失敗:', chatsResponse.status);
    }
  } catch (error) {
    console.warn('Teams チャット応答性分析エラー:', error);
  }
  
  return chatAnalysis;
}

// ファイル共同作業分析
async function analyzeTeamsCollaboration(accessToken: string, currentUserId: string): Promise<Record<string, any>> {
  const collaborationData: Record<string, any> = {};
  
  try {
    // OneDrive/SharePoint ファイル取得
    const filesResponse = await fetch('https://graph.microsoft.com/v1.0/me/drive/recent?$top=200', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (filesResponse.ok) {
      const files = await filesResponse.json();
      console.log('✅ Teams ファイル取得成功 - 件数:', files.value?.length || 0);
      
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      
      for (const file of (files.value || []).slice(0, 100)) {
        try {
          // ファイルの共有情報取得
          const permissionsResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/permissions`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (permissionsResponse.ok) {
            const permissions = await permissionsResponse.json();
            
            // ファイルアクティビティ取得
            const activitiesResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/activities?$top=50`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (activitiesResponse.ok) {
              const activities = await activitiesResponse.json();
              
              // 最近のアクティビティを分析
              const recentActivities = activities.value?.filter((activity: any) => 
                new Date(activity.times?.recordedDateTime || activity.times?.lastRecordedDateTime).getTime() > thirtyDaysAgo
              ) || [];
              
              recentActivities.forEach((activity: any) => {
                if (activity.actor?.user?.userPrincipalName) {
                  const userEmail = activity.actor.user.userPrincipalName;
                  
                  if (!collaborationData[userEmail]) {
                    collaborationData[userEmail] = {
                      filesCollaborated: new Set(),
                      filesCreated: 0,
                      filesEdited: 0,
                      commentsLeft: 0,
                      lastFileActivity: null
                    };
                  }
                  
                  collaborationData[userEmail].filesCollaborated.add(file.id);
                  
                  const activityTime = new Date(activity.times?.recordedDateTime || activity.times?.lastRecordedDateTime).getTime();
                  if (!collaborationData[userEmail].lastFileActivity || activityTime > collaborationData[userEmail].lastFileActivity) {
                    collaborationData[userEmail].lastFileActivity = activityTime;
                  }
                  
                  // アクティビティタイプ別カウント
                  if (activity.action?.create) {
                    collaborationData[userEmail].filesCreated++;
                  } else if (activity.action?.edit) {
                    collaborationData[userEmail].filesEdited++;
                  } else if (activity.action?.comment) {
                    collaborationData[userEmail].commentsLeft++;
                  }
                }
              });
            }
          }
        } catch (error) {
          console.warn(`ファイル ${file.name} の分析失敗:`, error);
        }
      }
      
      // Set を数値に変換
      Object.keys(collaborationData).forEach(email => {
        const data = collaborationData[email];
        data.filesCollaborated = data.filesCollaborated.size;
        if (data.lastFileActivity) {
          data.lastFileActivity = new Date(data.lastFileActivity).toISOString();
        }
      });
      
    } else {
      console.warn('Teams ファイル取得失敗:', filesResponse.status);
    }
  } catch (error) {
    console.warn('Teams ファイル共同作業分析エラー:', error);
  }
  
  return collaborationData;
}

// 高度なスコア計算
function calculateTeamsActivityScoreAdvanced(user: any, meetingStats: any, chatStats: any, collabStats: any): number {
  let score = 20; // ベーススコア

  // 1. 会議参加の質（25点）
  const meetingsAttended = meetingStats.meetingsAttended || 0;
  const meetingsOrganized = meetingStats.meetingsOrganized || 0;
  const totalMeetings = meetingsAttended + meetingsOrganized;
  
  if (totalMeetings > 20) score += 15;
  else if (totalMeetings > 10) score += 12;
  else if (totalMeetings > 5) score += 8;
  else if (totalMeetings > 0) score += 4;
  
  const participationScore = meetingStats.participationScore || 0;
  if (participationScore > 80) score += 10;
  else if (participationScore > 60) score += 7;
  else if (participationScore > 40) score += 4;

  // 2. チャット活動（20点）
  const messagesLast30Days = chatStats.messagesLast30Days || 0;
  if (messagesLast30Days > 100) score += 20;
  else if (messagesLast30Days > 50) score += 15;
  else if (messagesLast30Days > 20) score += 10;
  else if (messagesLast30Days > 5) score += 5;

  // 3. ファイル共同作業（20点）
  const filesCollaborated = collabStats.filesCollaborated || 0;
  const filesCreated = collabStats.filesCreated || 0;
  const totalFileActivity = filesCollaborated + filesCreated;
  
  if (totalFileActivity > 30) score += 20;
  else if (totalFileActivity > 15) score += 15;
  else if (totalFileActivity > 8) score += 10;
  else if (totalFileActivity > 3) score += 5;

  // 4. 最近のログイン・活動（15点）
  if (user.lastSignInDateTime) {
    const hoursAgo = (Date.now() - new Date(user.lastSignInDateTime).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 24) score += 15;
    else if (hoursAgo < 72) score += 10;
    else if (hoursAgo < 168) score += 5;
  }

  // 5. プロフィール・設定（10点）
  if (user.displayName) score += 2;
  if (user.department || user.jobTitle) score += 3;
  if (user.officeLocation) score += 2;
  if (user.userType !== 'Guest') score += 3;

  return Math.min(100, score);
}

function calculateTeamsCommunicationScoreAdvanced(user: any, meetingStats: any, chatStats: any, collabStats: any): number {
  let score = 40; // ベーススコア

  // 1. チャット応答性（25点）
  const avgResponseTime = chatStats.avgResponseTimeMinutes;
  if (avgResponseTime !== undefined && avgResponseTime !== null) {
    if (avgResponseTime < 30) score += 25;
    else if (avgResponseTime < 120) score += 20;
    else if (avgResponseTime < 480) score += 15;
    else if (avgResponseTime < 1440) score += 10;
    else score += 5;
  } else if (chatStats.messagesLast30Days > 0) {
    score += 10; // 応答時間不明だがメッセージはある
  }

  // 2. 会議エンゲージメント（20点）
  const meetingsOrganized = meetingStats.meetingsOrganized || 0;
  if (meetingsOrganized > 10) score += 15;
  else if (meetingsOrganized > 5) score += 10;
  else if (meetingsOrganized > 2) score += 6;
  else if (meetingsOrganized > 0) score += 3;

  const attendanceRate = meetingStats.attendanceRate || 0;
  if (attendanceRate > 0.8) score += 5;
  else if (attendanceRate > 0.6) score += 3;
  else if (attendanceRate > 0.4) score += 1;

  // 3. コラボレーション（15点）
  const commentsLeft = collabStats.commentsLeft || 0;
  if (commentsLeft > 20) score += 15;
  else if (commentsLeft > 10) score += 10;
  else if (commentsLeft > 5) score += 6;
  else if (commentsLeft > 0) score += 3;

  return Math.min(100, score);
}

// Google Workspace統合改善版 - Calendar・Gmail・Drive詳細分析
async function getGoogleUsersExtended(integration: any): Promise<UnifiedUser[]> {
  try {
    const allUsers: UnifiedUser[] = [];

    // 1. 現在のユーザー情報取得
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    let domain = 'primary';
    let currentUser: any = null;
    
    if (profileResponse.ok) {
      currentUser = await profileResponse.json();
      if (currentUser.hd) {
        domain = currentUser.hd;
      }
    }

    // 2. Calendar詳細分析 - 会議参加・主催パターン
    const calendarAnalysis: Record<string, {
      meetingsAttended: number;
      meetingsOrganized: number;
      totalMeetingHours: number;
      attendanceRate: number;
      lastMeetingTime: string | null;
      meetingTypes: string[];
      recurringMeetings: number;
      acceptanceRate: number;
    }> = {};

    try {
      // カレンダーイベント取得（過去30日）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${thirtyDaysAgo.toISOString()}&` +
        `timeMax=${new Date().toISOString()}&` +
        `maxResults=100&` +
        `singleEvents=true&` +
        `orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        
        for (const event of calendarData.items || []) {
          if (!event.attendees || event.status === 'cancelled') continue;
          
          // 会議時間計算
          const startTime = new Date(event.start?.dateTime || event.start?.date);
          const endTime = new Date(event.end?.dateTime || event.end?.date);
          const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          
          // 主催者判定
          const isOrganizer = event.organizer?.email === currentUser?.email;
          
          // 参加者分析
          event.attendees.forEach((attendee: any) => {
            if (attendee.email && attendee.email !== currentUser?.email) {
              if (!calendarAnalysis[attendee.email]) {
                calendarAnalysis[attendee.email] = {
                  meetingsAttended: 0,
                  meetingsOrganized: 0,
                  totalMeetingHours: 0,
                  attendanceRate: 0,
                  lastMeetingTime: null,
                  meetingTypes: [],
                  recurringMeetings: 0,
                  acceptanceRate: 0
                };
              }
              
              const analysis = calendarAnalysis[attendee.email];
              
              if (isOrganizer) {
                analysis.meetingsAttended++;
              } else if (event.organizer?.email === attendee.email) {
                analysis.meetingsOrganized++;
              }
              
              analysis.totalMeetingHours += durationHours;
              
              if (!analysis.lastMeetingTime || startTime > new Date(analysis.lastMeetingTime)) {
                analysis.lastMeetingTime = startTime.toISOString();
              }
              
              // 会議タイプ分析
              if (event.summary) {
                if (event.summary.toLowerCase().includes('standup') || event.summary.toLowerCase().includes('daily')) {
                  analysis.meetingTypes.push('standup');
                } else if (event.summary.toLowerCase().includes('review') || event.summary.toLowerCase().includes('retrospective')) {
                  analysis.meetingTypes.push('review');
                } else if (event.summary.toLowerCase().includes('planning') || event.summary.toLowerCase().includes('sprint')) {
                  analysis.meetingTypes.push('planning');
                } else {
                  analysis.meetingTypes.push('general');
                }
              }
              
              // 定期会議判定
              if (event.recurringEventId) {
                analysis.recurringMeetings++;
              }
              
              // 参加率計算（accepted/tentative vs declined）
              if (attendee.responseStatus === 'accepted' || attendee.responseStatus === 'tentative') {
                analysis.acceptanceRate++;
              }
            }
          });
        }
        
        // 参加率・受諾率の正規化
        Object.keys(calendarAnalysis).forEach(email => {
          const analysis = calendarAnalysis[email];
          const totalMeetings = analysis.meetingsAttended + analysis.meetingsOrganized;
          if (totalMeetings > 0) {
            analysis.attendanceRate = (analysis.acceptanceRate / totalMeetings) * 100;
          }
        });
      }
    } catch (error) {
      console.warn('Calendar データ取得をスキップ:', error);
    }

    // 3. Gmail応答性詳細分析
    const gmailAnalysis: Record<string, {
      emailsSent: number;
      emailsReceived: number;
      averageResponseTime: number;
      responseRate: number;
      lastEmailTime: string | null;
      emailThreads: number;
      communicationFrequency: number;
      emailTypes: string[];
    }> = {};

    try {
      // 送信メール分析
      const sentResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q=in:sent newer_than:30d',
        {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (sentResponse.ok) {
        const sentMessages = await sentResponse.json();
        
        for (const message of (sentMessages.messages || []).slice(0, 50)) {
          try {
            const messageResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=To&metadataHeaders=Date&metadataHeaders=Subject&metadataHeaders=In-Reply-To`,
              {
                headers: {
                  'Authorization': `Bearer ${integration.accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (messageResponse.ok) {
              const messageData = await messageResponse.json();
              const headers = messageData.payload?.headers || [];
              
              const toHeader = headers.find((h: any) => h.name === 'To');
              const dateHeader = headers.find((h: any) => h.name === 'Date');
              const subjectHeader = headers.find((h: any) => h.name === 'Subject');
              const replyToHeader = headers.find((h: any) => h.name === 'In-Reply-To');
              
              if (toHeader && toHeader.value) {
                const emails = toHeader.value.match(/[\w\.-]+@[\w\.-]+\.\w+/g) || [];
                
                emails.forEach((email: string) => {
                  if (email !== currentUser?.email) {
                    if (!gmailAnalysis[email]) {
                      gmailAnalysis[email] = {
                        emailsSent: 0,
                        emailsReceived: 0,
                        averageResponseTime: 0,
                        responseRate: 0,
                        lastEmailTime: null,
                        emailThreads: 0,
                        communicationFrequency: 0,
                        emailTypes: []
                      };
                    }
                    
                    const analysis = gmailAnalysis[email];
                    analysis.emailsSent++;
                    
                    if (dateHeader) {
                      const emailDate = new Date(dateHeader.value).toISOString();
                      if (!analysis.lastEmailTime || emailDate > analysis.lastEmailTime) {
                        analysis.lastEmailTime = emailDate;
                      }
                    }
                    
                    // メールタイプ分析
                    if (subjectHeader) {
                      const subject = subjectHeader.value.toLowerCase();
                      if (subject.includes('meeting') || subject.includes('schedule')) {
                        analysis.emailTypes.push('meeting');
                      } else if (subject.includes('project') || subject.includes('task')) {
                        analysis.emailTypes.push('project');
                      } else if (replyToHeader) {
                        analysis.emailTypes.push('reply');
                      } else {
                        analysis.emailTypes.push('general');
                      }
                    }
                    
                    // スレッド判定
                    if (replyToHeader) {
                      analysis.emailThreads++;
                    }
                  }
                });
              }
            }
          } catch (error) {
            console.warn('Gmail メッセージ詳細取得エラー:', error);
          }
        }
      }

      // 受信メール分析（応答時間計算）
      const inboxResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox newer_than:30d',
        {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (inboxResponse.ok) {
        const inboxMessages = await inboxResponse.json();
        
        for (const message of inboxMessages.messages || []) {
          try {
            const messageResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Date`,
              {
                headers: {
                  'Authorization': `Bearer ${integration.accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (messageResponse.ok) {
              const messageData = await messageResponse.json();
              const headers = messageData.payload?.headers || [];
              
              const fromHeader = headers.find((h: any) => h.name === 'From');
              
              if (fromHeader && fromHeader.value) {
                const emailMatch = fromHeader.value.match(/[\w\.-]+@[\w\.-]+\.\w+/);
                if (emailMatch && emailMatch[0] !== currentUser?.email) {
                  const email = emailMatch[0];
                  
                  if (!gmailAnalysis[email]) {
                    gmailAnalysis[email] = {
                      emailsSent: 0,
                      emailsReceived: 0,
                      averageResponseTime: 0,
                      responseRate: 0,
                      lastEmailTime: null,
                      emailThreads: 0,
                      communicationFrequency: 0,
                      emailTypes: []
                    };
                  }
                  
                  gmailAnalysis[email].emailsReceived++;
                }
              }
            }
          } catch (error) {
            console.warn('Gmail 受信メッセージ分析エラー:', error);
          }
        }
      }
      
      // 通信頻度・応答率計算
      Object.keys(gmailAnalysis).forEach(email => {
        const analysis = gmailAnalysis[email];
        analysis.communicationFrequency = analysis.emailsSent + analysis.emailsReceived;
        if (analysis.emailsReceived > 0) {
          analysis.responseRate = (analysis.emailsSent / analysis.emailsReceived) * 100;
        }
      });
      
    } catch (error) {
      console.warn('Gmail データ取得をスキップ:', error);
    }

    // 4. Drive共同作業詳細分析
    const driveAnalysis: Record<string, {
      filesShared: number;
      filesEdited: number;
      filesCreated: number;
      commentsGiven: number;
      lastDriveActivity: string | null;
      collaborationScore: number;
      fileTypes: string[];
      sharedFolders: number;
    }> = {};

    try {
      // 共有ファイル分析
      const filesResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=sharedWithMe=true&fields=files(id,name,owners,permissions,mimeType,modifiedTime,createdTime)&pageSize=100',
        {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        
        for (const file of filesData.files || []) {
          const modifiedTime = file.modifiedTime;
          const fileType = file.mimeType?.split('/')[1] || 'unknown';
          
          // ファイル所有者分析
          if (file.owners) {
            file.owners.forEach((owner: any) => {
              if (owner.emailAddress && owner.emailAddress !== currentUser?.email) {
                if (!driveAnalysis[owner.emailAddress]) {
                  driveAnalysis[owner.emailAddress] = {
                    filesShared: 0,
                    filesEdited: 0,
                    filesCreated: 0,
                    commentsGiven: 0,
                    lastDriveActivity: null,
                    collaborationScore: 0,
                    fileTypes: [],
                    sharedFolders: 0
                  };
                }
                
                const analysis = driveAnalysis[owner.emailAddress];
                analysis.filesShared++;
                analysis.fileTypes.push(fileType);
                
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                  analysis.sharedFolders++;
                }
                
                if (modifiedTime && (!analysis.lastDriveActivity || modifiedTime > analysis.lastDriveActivity)) {
                  analysis.lastDriveActivity = modifiedTime;
                }
              }
            });
          }
          
          // 共有権限分析
          if (file.permissions) {
            file.permissions.forEach((permission: any) => {
              if (permission.emailAddress && permission.emailAddress !== currentUser?.email) {
                if (!driveAnalysis[permission.emailAddress]) {
                  driveAnalysis[permission.emailAddress] = {
                    filesShared: 0,
                    filesEdited: 0,
                    filesCreated: 0,
                    commentsGiven: 0,
                    lastDriveActivity: null,
                    collaborationScore: 0,
                    fileTypes: [],
                    sharedFolders: 0
                  };
                }
                
                const analysis = driveAnalysis[permission.emailAddress];
                
                if (permission.role === 'writer' || permission.role === 'editor') {
                  analysis.filesEdited++;
                } else {
                  analysis.filesShared++;
                }
                
                analysis.fileTypes.push(fileType);
              }
            });
          }
        }
      }

      // 自分が作成したファイル分析
      const myFilesResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files?q="me" in owners&fields=files(id,name,permissions,mimeType,modifiedTime)&pageSize=50',
        {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (myFilesResponse.ok) {
        const myFilesData = await myFilesResponse.json();
        
        for (const file of myFilesData.files || []) {
          if (file.permissions) {
            file.permissions.forEach((permission: any) => {
              if (permission.emailAddress && permission.emailAddress !== currentUser?.email) {
                if (!driveAnalysis[permission.emailAddress]) {
                  driveAnalysis[permission.emailAddress] = {
                    filesShared: 0,
                    filesEdited: 0,
                    filesCreated: 0,
                    commentsGiven: 0,
                    lastDriveActivity: null,
                    collaborationScore: 0,
                    fileTypes: [],
                    sharedFolders: 0
                  };
                }
                
                driveAnalysis[permission.emailAddress].filesCreated++;
              }
            });
          }
        }
      }
      
      // コラボレーションスコア計算
      Object.keys(driveAnalysis).forEach(email => {
        const analysis = driveAnalysis[email];
        analysis.collaborationScore = 
          (analysis.filesShared * 2) + 
          (analysis.filesEdited * 3) + 
          (analysis.filesCreated * 4) + 
          (analysis.sharedFolders * 5);
      });
      
    } catch (error) {
      console.warn('Drive データ取得をスキップ:', error);
    }

    // 5. Admin SDK でユーザー取得
    const usersResponse = await fetch(
      `https://admin.googleapis.com/admin/directory/v1/users?domain=${domain}&maxResults=500&projection=full`,
      {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!usersResponse.ok) {
      // Admin権限がない場合、個人情報のみ取得
      console.warn(`Google Admin SDK アクセス失敗: ${usersResponse.status}. 個人情報のみ取得します`);
      
      if (profileResponse.ok && currentUser) {
        // 個人アカウントでも詳細分析を適用
        const personalCalendarScore = Object.keys(calendarAnalysis).length * 5;
        const personalGmailScore = Object.keys(gmailAnalysis).length * 3;
        const personalDriveScore = Object.keys(driveAnalysis).length * 4;
        
        return [{
          id: currentUser.id,
          name: currentUser.name || '名前未設定',
          email: currentUser.email,
          avatar: currentUser.picture,
          service: 'google',
          role: 'self',
          department: '個人アカウント',
          lastActivity: new Date().toISOString(),
          isActive: true,
          activityScore: Math.min(100, 60 + personalCalendarScore + personalGmailScore + personalDriveScore),
          communicationScore: Math.min(100, 50 + personalGmailScore * 2 + personalCalendarScore),
          isolationRisk: 'low',
          relationshipType: 'self',
          relationshipStrength: 100,
          metadata: {
            accountType: '個人アカウント',
            domain: currentUser.hd || 'personal',
            calendarInteractions: Object.keys(calendarAnalysis).length,
            emailContacts: Object.keys(gmailAnalysis).length,
            driveCollaborators: Object.keys(driveAnalysis).length,
            note: 'Admin権限なし - 個人データのみ'
          }
        }];
      }
      
      throw new Error(`Google API エラー: ${usersResponse.status} - Admin SDK権限が必要です`);
    }

    const usersData = await usersResponse.json();

    // 6. ユーザーデータ統合と詳細スコア計算
    const organizationUsers = (usersData.users || [])
      .filter((user: any) => !user.suspended && user.primaryEmail)
      .map((user: any) => {
        const email = user.primaryEmail;
        
        // Calendar分析データ取得
        const calendarData = calendarAnalysis[email] || {
          meetingsAttended: 0,
          meetingsOrganized: 0,
          totalMeetingHours: 0,
          attendanceRate: 0,
          lastMeetingTime: null,
          meetingTypes: [],
          recurringMeetings: 0,
          acceptanceRate: 0
        };
        
        // Gmail分析データ取得
        const gmailData = gmailAnalysis[email] || {
          emailsSent: 0,
          emailsReceived: 0,
          averageResponseTime: 0,
          responseRate: 0,
          lastEmailTime: null,
          emailThreads: 0,
          communicationFrequency: 0,
          emailTypes: []
        };
        
        // Drive分析データ取得
        const driveData = driveAnalysis[email] || {
          filesShared: 0,
          filesEdited: 0,
          filesCreated: 0,
          commentsGiven: 0,
          lastDriveActivity: null,
          collaborationScore: 0,
          fileTypes: [],
          sharedFolders: 0
        };
        
        // 詳細スコア計算（100点満点）
        const calendarScore = Math.min(25, 
          (calendarData.meetingsAttended * 2) + 
          (calendarData.meetingsOrganized * 3) + 
          (calendarData.attendanceRate / 10) +
          (calendarData.recurringMeetings * 1)
        );
        
        const gmailScore = Math.min(20,
          (gmailData.communicationFrequency / 2) +
          (gmailData.responseRate / 10) +
          (gmailData.emailThreads * 0.5)
        );
        
        const driveScore = Math.min(20,
          (driveData.collaborationScore / 5) +
          (driveData.sharedFolders * 2)
        );
        
        // アカウント健全性（15点）
        const accountHealthScore = Math.min(15,
          (user.isEnforcedIn2Sv ? 5 : 0) +
          (user.lastLoginTime ? 5 : 0) +
          (!user.suspended ? 5 : 0)
        );
        
        // プロフィール充実度（10点）
        const profileScore = Math.min(10,
          (user.name?.fullName ? 2 : 0) +
          (user.thumbnailPhotoUrl ? 2 : 0) +
          (user.organizations?.length > 0 ? 3 : 0) +
          (user.locations?.length > 0 ? 3 : 0)
        );
        
        // 総合コミュニケーション（10点）
        const totalCommunicationScore = Math.min(10,
          ((calendarData.meetingsAttended + calendarData.meetingsOrganized) > 0 ? 3 : 0) +
          (gmailData.communicationFrequency > 0 ? 4 : 0) +
          (driveData.collaborationScore > 0 ? 3 : 0)
        );
        
        const activityScore = Math.round(
          calendarScore + gmailScore + driveScore + 
          accountHealthScore + profileScore + totalCommunicationScore
        );
        
        // コミュニケーションスコア計算
        const communicationScore = Math.min(100,
          gmailScore * 2 + calendarScore * 1.5 + driveScore * 1.5 + totalCommunicationScore * 2
        );
        
        // 孤立リスク評価
        const isolationRisk = determineGoogleIsolationRisk(activityScore, communicationScore, calendarData, gmailData, driveData);
        
        // 関係性タイプと強度
        const { relationshipType, relationshipStrength } = determineGoogleRelationship(calendarData, gmailData, driveData);
        
        // ワークスタイル分類
        const workStyle = determineGoogleWorkStyle(calendarData, gmailData, driveData);

        return {
          id: user.id,
          name: user.name?.fullName || `${user.name?.givenName || ''} ${user.name?.familyName || ''}`.trim() || '名前未設定',
          email: user.primaryEmail,
          avatar: user.thumbnailPhotoUrl,
          service: 'google',
          role: user.isAdmin ? 'admin' : user.isDelegatedAdmin ? 'delegated_admin' : 'member',
          department: user.organizations?.[0]?.department || user.organizations?.[0]?.title || '未設定',
          lastActivity: calendarData.lastMeetingTime || gmailData.lastEmailTime || driveData.lastDriveActivity || user.lastLoginTime,
          isActive: !user.suspended && !user.archived,
          activityScore,
          communicationScore: Math.round(communicationScore),
          isolationRisk,
          relationshipType,
          relationshipStrength,
          metadata: {
            // Calendar分析
            meetingsAttended: calendarData.meetingsAttended,
            meetingsOrganized: calendarData.meetingsOrganized,
            totalMeetingHours: Math.round(calendarData.totalMeetingHours * 10) / 10,
            attendanceRate: Math.round(calendarData.attendanceRate),
            recurringMeetings: calendarData.recurringMeetings,
            meetingTypes: [...new Set(calendarData.meetingTypes)],
            
            // Gmail分析
            emailsSent: gmailData.emailsSent,
            emailsReceived: gmailData.emailsReceived,
            responseRate: Math.round(gmailData.responseRate),
            communicationFrequency: gmailData.communicationFrequency,
            emailThreads: gmailData.emailThreads,
            emailTypes: [...new Set(gmailData.emailTypes)],
            
            // Drive分析
            filesShared: driveData.filesShared,
            filesEdited: driveData.filesEdited,
            filesCreated: driveData.filesCreated,
            collaborationScore: driveData.collaborationScore,
            sharedFolders: driveData.sharedFolders,
            fileTypes: [...new Set(driveData.fileTypes)],
            
            // 基本情報
            workStyle,
            joinDate: user.creationTime,
            orgUnit: user.orgUnitPath,
            isEnforcedIn2Sv: user.isEnforcedIn2Sv,
            lastLoginTime: user.lastLoginTime,
            workingHours: user.locations?.[0]?.area || user.locations?.[0]?.buildingId,
            
            // スコア詳細
            calendarScore: Math.round(calendarScore),
            gmailScore: Math.round(gmailScore),
            driveScore: Math.round(driveScore),
            accountHealthScore: Math.round(accountHealthScore),
            profileScore: Math.round(profileScore)
          }
        };
      });

    allUsers.push(...organizationUsers);

    console.log(`✅ Google 統合改善完了: ${allUsers.length}人 (Calendar: ${Object.keys(calendarAnalysis).length}, Gmail: ${Object.keys(gmailAnalysis).length}, Drive: ${Object.keys(driveAnalysis).length})`);
    return allUsers;

  } catch (error) {
    console.error('❌ Google データ取得エラー:', error);
    throw error;
  }
}

// Google用孤立リスク評価関数（改善版）
function determineGoogleIsolationRisk(
  activityScore: number, 
  communicationScore: number,
  calendarData: any,
  gmailData: any,
  driveData: any
): 'low' | 'medium' | 'high' {
  const totalInteractions = 
    calendarData.meetingsAttended + calendarData.meetingsOrganized +
    gmailData.communicationFrequency + 
    driveData.collaborationScore;
    
  if (activityScore >= 70 && communicationScore >= 60 && totalInteractions >= 10) {
    return 'low';
  } else if (activityScore >= 45 && communicationScore >= 35 && totalInteractions >= 3) {
    return 'medium';
  } else {
    return 'high';
  }
}

// Google用関係性判定関数（新機能）
function determineGoogleRelationship(calendarData: any, gmailData: any, driveData: any): {
  relationshipType: 'teammate' | 'frequent_contact' | 'collaborator' | 'meeting_partner';
  relationshipStrength: number;
} {
  const calendarInteractions = calendarData.meetingsAttended + calendarData.meetingsOrganized;
  const emailInteractions = gmailData.communicationFrequency;
  const driveInteractions = driveData.collaborationScore;
  
  let relationshipStrength = 30; // ベーススコア
  let relationshipType: 'teammate' | 'frequent_contact' | 'collaborator' | 'meeting_partner' = 'teammate';
  
  // Calendar重視の関係性
  if (calendarInteractions >= 10) {
    relationshipType = 'meeting_partner';
    relationshipStrength += calendarInteractions * 3;
  }
  
  // Drive重視の関係性
  if (driveInteractions >= 15) {
    relationshipType = 'collaborator';
    relationshipStrength += driveInteractions * 2;
  }
  
  // Email重視の関係性
  if (emailInteractions >= 15) {
    relationshipType = 'frequent_contact';
    relationshipStrength += emailInteractions * 2;
  }
  
  // 複合的な関係性
  if (calendarInteractions >= 5 && emailInteractions >= 8 && driveInteractions >= 8) {
    relationshipType = 'collaborator';
    relationshipStrength += 20;
  }
  
  return {
    relationshipType,
    relationshipStrength: Math.min(100, relationshipStrength)
  };
}

// Google用ワークスタイル分類関数（新機能）
function determineGoogleWorkStyle(calendarData: any, gmailData: any, driveData: any): string {
  const meetingRatio = calendarData.meetingsOrganized / Math.max(1, calendarData.meetingsAttended + calendarData.meetingsOrganized);
  const emailRatio = gmailData.emailsSent / Math.max(1, gmailData.emailsReceived + gmailData.emailsSent);
  const driveCreationRatio = driveData.filesCreated / Math.max(1, driveData.filesShared + driveData.filesCreated);
  
  // リーダータイプ（会議主催多数、メール送信多数）
  if (meetingRatio >= 0.6 && calendarData.meetingsOrganized >= 5) {
    return 'meeting_leader';
  }
  
  // クリエイタータイプ（ファイル作成多数、Drive活動活発）
  if (driveCreationRatio >= 0.4 && driveData.filesCreated >= 3) {
    return 'content_creator';
  }
  
  // コミュニケータータイプ（メール頻度高、応答率高）
  if (gmailData.communicationFrequency >= 15 && gmailData.responseRate >= 70) {
    return 'active_communicator';
  }
  
  // コラボレータータイプ（全方面でバランス良く活動）
  if (calendarData.meetingsAttended >= 5 && gmailData.communicationFrequency >= 8 && driveData.collaborationScore >= 10) {
    return 'balanced_collaborator';
  }
  
  // 会議参加者タイプ（会議参加多数、主催少数）
  if (calendarData.meetingsAttended >= 8 && meetingRatio <= 0.3) {
    return 'meeting_participant';
  }
  
  // ファイル共有者タイプ（Drive活動中心）
  if (driveData.filesShared >= 5 || driveData.sharedFolders >= 2) {
    return 'file_collaborator';
  }
  
  return 'standard_user';
}

// Discord ユーザーデータ取得（メッセージ活動重視・非表示設定付き）
async function getDiscordUsersExtended(integration: any): Promise<UnifiedUser[]> {
  try {
    console.log('🔍 Discord統合開始 - メッセージ活動分析版');
    const allUsers: UnifiedUser[] = [];

    // 非表示設定（後でUI化予定）
    const filterSettings = {
      hideInactiveServers: true,
      criteria: {
        minimumRecentMessages: 10,
        maximumHoursSinceLastMessage: 168, // 1週間
        minimumActivityScore: 45,
        minimumMemberCount: 3,
        minimumActiveUsers: 2,
        alwaysShowOwnerServers: true,
        alwaysShowBoostedServers: true,
        alwaysShowPartneredServers: true
      }
    };

    // 1. 現在のユーザー情報取得
    const currentUserResponse = await fetch(`https://discord.com/api/v10/users/@me`, {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!currentUserResponse.ok) {
      throw new Error(`Discord認証エラー: ${currentUserResponse.status}`);
    }

    const currentUser = await currentUserResponse.json();
    console.log('✅ Discord基本情報取得成功:', currentUser.username);

    // 2. 参加サーバー一覧取得
    let guilds = [];
    let guildDetails: Record<string, any> = {};
    
    try {
      const guildsResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (guildsResponse.ok) {
        guilds = await guildsResponse.json();
        console.log(`✅ Discord サーバー取得成功: ${guilds.length}個`);

        // 各サーバーの詳細分析
        for (const guild of guilds) {
          try {
            console.log(`🔍 サーバー分析開始: ${guild.name}`);
            
            // サーバー基本情報取得
            const guildInfoResponse = await fetch(`https://discord.com/api/v10/guilds/${guild.id}`, {
              headers: {
                'Authorization': `Bearer ${integration.accessToken}`,
                'Content-Type': 'application/json'
              }
            });

            let guildInfo = guild;
            if (guildInfoResponse.ok) {
              guildInfo = await guildInfoResponse.json();
            }

            // チャンネル一覧取得
            const channelsResponse = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/channels`, {
              headers: {
                'Authorization': `Bearer ${integration.accessToken}`,
                'Content-Type': 'application/json'
              }
            });

            let channels = [];
            if (channelsResponse.ok) {
              channels = await channelsResponse.json();
            }

            // メッセージ活動分析
            const channelActivity = [];
            let totalRecentMessages = 0;
            let latestMessageTime = 0;
            const activeUsers = new Set();
            let activeChannelCount = 0;

            // テキストチャンネルのメッセージ分析（最大5チャンネル）
            const textChannels = channels.filter((ch: DiscordChannelActivity | null) => ch !== null);
            
            for (const channel of textChannels) {
              try {
                const messagesResponse = await fetch(
                  `https://discord.com/api/v10/channels/${channel.id}/messages?limit=50`,
                  {
                    headers: {
                      'Authorization': `Bearer ${integration.accessToken}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );

                if (messagesResponse.ok) {
                  const messages = await messagesResponse.json();
                  const recentMessages = messages.length;
                  
                  if (recentMessages > 0) {
                    totalRecentMessages += recentMessages;
                    activeChannelCount++;
                    
                    // 最新メッセージ時刻
                    const channelLatest = new Date(messages[0].timestamp).getTime();
                    latestMessageTime = Math.max(latestMessageTime, channelLatest);
                    
                    // アクティブユーザー
                    messages.forEach((msg: DiscordMessage) => {
                      if (msg.author && !msg.author.bot) {
                        activeUsers.add(msg.author.id);
                      }
                    });
                    
                    channelActivity.push({
                      channelId: channel.id,
                      channelName: channel.name,
                      recentMessages,
                      lastMessageTime: messages[0]?.timestamp,
                      uniqueUsers: new Set(messages.map((m: DiscordMessage) => m.author?.id).filter(Boolean)).size
                    });
                  }
                }
              } catch (error) {
                console.warn(`⚠️ チャンネル ${channel.name} のメッセージ取得失敗:`, error);
              }
            }

            // 自分のサーバー内情報取得
            let memberInfo = null;
            try {
              const memberResponse = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/members/@me`, {
                headers: {
                  'Authorization': `Bearer ${integration.accessToken}`,
                  'Content-Type': 'application/json'
                }
              });

              if (memberResponse.ok) {
                memberInfo = await memberResponse.json();
              }
            } catch (error) {
              console.warn(`⚠️ メンバー情報取得失敗: ${guild.name}`);
            }

            // 詳細情報を統合
            guildDetails[guild.id] = {
              ...guildInfo,
              channels,
              channelActivity,
              messageAnalysis: {
                totalRecentMessages,
                latestMessageTime,
                activeUsers: activeUsers.size,
                activeChannelCount,
                totalTextChannels: textChannels.length
              },
              memberInfo,
              joinedAt: memberInfo?.joined_at,
              roles: memberInfo?.roles || [],
              nick: memberInfo?.nick
            };

            console.log(`✅ ${guild.name} 分析完了 - メッセージ: ${totalRecentMessages}件, アクティブユーザー: ${activeUsers.size}人`);

          } catch (error) {
            console.warn(`⚠️ サーバー ${guild.name} の分析失敗:`, error);
            guildDetails[guild.id] = guild;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Discord サーバー取得エラー:', error);
    }

    // 3. 外部接続情報取得
    let connections = [];
    try {
      const connectionsResponse = await fetch(`https://discord.com/api/v10/users/@me/connections`, {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (connectionsResponse.ok) {
        connections = await connectionsResponse.json();
        console.log(`✅ Discord 外部接続取得成功: ${connections.length}個`);
      }
    } catch (error) {
      console.warn('⚠️ Discord 外部接続取得エラー:', error);
    }

    // 4. 自分の情報を追加
    allUsers.push({
      id: currentUser.id,
      name: currentUser.global_name || currentUser.username,
      email: currentUser.email || undefined,
      avatar: currentUser.avatar ? 
        `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png` : 
        undefined,
      service: 'discord',
      role: 'self',
      department: '本人',
      lastActivity: new Date().toISOString(),
      isActive: true,
      activityScore: 90,
      communicationScore: 80,
      isolationRisk: 'low',
      relationshipType: 'self',
      relationshipStrength: 100,
      metadata: {
        note: '本人アカウント',
        guildsCount: guilds.length,
        connectionsCount: connections.length,
        availableScopes: 'identify email guilds connections',
        discordId: currentUser.id,
        discriminator: currentUser.discriminator
      }
    });

    // 5. サーバー詳細分析・スコア計算
    if (guilds.length > 0) {
      console.log('📊 サーバー賑わい度分析開始:');
      
      const analyzedGuilds = Object.values(guildDetails).map((guild: any) => {
        const joinDate = guild.joinedAt ? new Date(guild.joinedAt) : new Date();
        const daysSinceJoin = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
        const messageAnalysis = guild.messageAnalysis || {};
        
        // 賑わい度スコア計算
        let activityScore = 20; // ベーススコア

        // 1. メッセージ活動度（最重要 - 30点満点）
        const recentMessages = messageAnalysis.totalRecentMessages || 0;
        if (recentMessages > 500) activityScore += 30;
        else if (recentMessages > 200) activityScore += 25;
        else if (recentMessages > 100) activityScore += 20;
        else if (recentMessages > 50) activityScore += 15;
        else if (recentMessages > 20) activityScore += 10;
        else if (recentMessages > 5) activityScore += 5;

        // 2. メッセージの新鮮度（15点満点）
        let hoursSinceLastMessage = Infinity;
        if (messageAnalysis.latestMessageTime) {
          hoursSinceLastMessage = (Date.now() - messageAnalysis.latestMessageTime) / (1000 * 60 * 60);
          if (hoursSinceLastMessage < 1) activityScore += 15;
          else if (hoursSinceLastMessage < 6) activityScore += 12;
          else if (hoursSinceLastMessage < 24) activityScore += 10;
          else if (hoursSinceLastMessage < 72) activityScore += 5;
        }

        // 3. ユーザー参加の多様性（15点満点）
        const activeUsers = messageAnalysis.activeUsers || 0;
        const memberCount = guild.approximate_member_count || guild.member_count || 1;
        const userDiversityRatio = activeUsers / memberCount;
        if (userDiversityRatio > 0.3) activityScore += 15;
        else if (userDiversityRatio > 0.2) activityScore += 12;
        else if (userDiversityRatio > 0.1) activityScore += 10;
        else if (userDiversityRatio > 0.05) activityScore += 5;

        // 4. チャンネル活用度（10点満点）
        const activeChannels = messageAnalysis.activeChannelCount || 0;
        const totalChannels = messageAnalysis.totalTextChannels || 1;
        const channelUtilization = activeChannels / totalChannels;
        if (channelUtilization > 0.7) activityScore += 10;
        else if (channelUtilization > 0.5) activityScore += 8;
        else if (channelUtilization > 0.3) activityScore += 5;

        // 5. サーバー構造（10点満点）
        const channelCount = guild.channels?.length || 0;
        const roleCount = guild.roles?.length || 0;
        if (channelCount > 20 && roleCount > 10) activityScore += 10;
        else if (channelCount > 10 && roleCount > 5) activityScore += 8;
        else if (channelCount > 5 && roleCount > 3) activityScore += 5;

        // 6. コミュニティ機能（10点満点）
        if (guild.premium_tier >= 3) activityScore += 6;
        else if (guild.premium_tier >= 2) activityScore += 4;
        else if (guild.premium_tier >= 1) activityScore += 2;
        
        if (guild.features?.includes('PARTNERED')) activityScore += 4;
        else if (guild.features?.includes('VERIFIED')) activityScore += 3;
        else if (guild.features?.includes('COMMUNITY')) activityScore += 2;

        // コミュニケーションスコア計算
        let communicationScore = 40;
        if (recentMessages > 100) communicationScore += 20;
        else if (recentMessages > 50) communicationScore += 15;
        else if (recentMessages > 20) communicationScore += 10;
        else if (recentMessages > 5) communicationScore += 5;

        if (activeUsers > 10) communicationScore += 15;
        else if (activeUsers > 5) communicationScore += 10;
        else if (activeUsers > 2) communicationScore += 5;

        if (guild.owner) communicationScore += 10;
        else if (guild.roles?.length > 1) communicationScore += 5;

        // 関係性強度計算
        let relationshipStrength = 20;
        if (guild.owner) relationshipStrength = 85;
        else if (guild.roles?.length > 1) relationshipStrength = 60;
        else relationshipStrength = 30;

        // 参加期間による調整
        if (daysSinceJoin > 365) relationshipStrength += 10;
        else if (daysSinceJoin > 90) relationshipStrength += 5;

        // メッセージ活動による調整
        if (recentMessages > 100) relationshipStrength += 10;
        else if (recentMessages > 20) relationshipStrength += 5;

        relationshipStrength = Math.min(100, relationshipStrength);

        // 非表示判定
        let shouldHide = false;
        if (filterSettings.hideInactiveServers) {
          const criteria = filterSettings.criteria;
          
          shouldHide = (
            activityScore < criteria.minimumActivityScore ||
            recentMessages < criteria.minimumRecentMessages ||
            hoursSinceLastMessage > criteria.maximumHoursSinceLastMessage ||
            memberCount < criteria.minimumMemberCount ||
            activeUsers < criteria.minimumActiveUsers
          );

          // 例外処理
          if (guild.owner && criteria.alwaysShowOwnerServers) shouldHide = false;
          if (guild.premium_tier >= 1 && criteria.alwaysShowBoostedServers) shouldHide = false;
          if (guild.features?.includes('PARTNERED') && criteria.alwaysShowPartneredServers) shouldHide = false;
        }

        const isolationRisk = determineIsolationRisk(activityScore, communicationScore);
        const relationshipType = (guild.owner || relationshipStrength > 70) ? 'frequent_contact' : 'teammate';

        return {
          guild,
          activityScore: Math.min(100, activityScore),
          communicationScore: Math.min(100, communicationScore),
          relationshipStrength,
          isolationRisk,
          relationshipType,
          daysSinceJoin,
          shouldHide,
          messageAnalysis,
          analysis: {
            participationLevel: guild.owner ? 'owner' : (guild.roles?.length > 1 ? 'moderator' : 'member'),
            serverSize: memberCount > 1000 ? 'large' : memberCount > 100 ? 'medium' : 'small',
            activityLevel: recentMessages > 100 ? 'high' : recentMessages > 20 ? 'medium' : 'low',
            engagementLevel: relationshipStrength > 70 ? 'high' : relationshipStrength > 50 ? 'medium' : 'low'
          }
        };
      });

      // フィルタリング
      const visibleGuilds = analyzedGuilds.filter(g => !g.shouldHide);
      const hiddenGuilds = analyzedGuilds.filter(g => g.shouldHide);
      
      console.log(`📊 賑わい度分析結果:`);
      console.log(`  - 表示サーバー: ${visibleGuilds.length}個`);
      console.log(`  - 非表示サーバー: ${hiddenGuilds.length}個`);

      // 表示サーバーをユーザーリストに追加
      visibleGuilds.forEach((analyzed, index) => {
        const guild = analyzed.guild;
        const messageStats = analyzed.messageAnalysis;
        
        console.log(`  ${index + 1}. ${guild.name}:`);
        console.log(`    - 賑わい度: ${analyzed.activityScore}/100`);
        console.log(`    - メッセージ: ${messageStats.totalRecentMessages || 0}件`);
        console.log(`    - アクティブユーザー: ${messageStats.activeUsers || 0}人`);
        console.log(`    - 関係性: ${analyzed.relationshipStrength}/100`);
        
        allUsers.push({
          id: `guild-${guild.id}`,
          name: guild.name,
          email: undefined,
          avatar: guild.icon ? 
            `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : 
            undefined,
          service: 'discord',
          role: analyzed.analysis.participationLevel,
          department: `Discord ${analyzed.analysis.serverSize} サーバー`,
          lastActivity: messageStats.latestMessageTime ? 
            new Date(messageStats.latestMessageTime).toISOString() : 
            (guild.joinedAt || new Date().toISOString()),
          isActive: true,
          activityScore: analyzed.activityScore,
          communicationScore: analyzed.communicationScore,
          isolationRisk: analyzed.isolationRisk,
          relationshipType: analyzed.relationshipType as 'teammate' | 'frequent_contact',
          relationshipStrength: analyzed.relationshipStrength,
          metadata: {
            guildId: guild.id,
            guildName: guild.name,
            memberCount: guild.approximate_member_count || guild.member_count || 0,
            joinedAt: guild.joinedAt,
            daysSinceJoin: analyzed.daysSinceJoin,
            isOwner: guild.owner || false,
            hasSpecialRoles: guild.roles && guild.roles.length > 1,
            nickname: guild.nick,
            
            // メッセージ活動詳細
            recentMessages: messageStats.totalRecentMessages || 0,
            activeUsers: messageStats.activeUsers || 0,
            activeChannels: messageStats.activeChannelCount || 0,
            totalChannels: messageStats.totalTextChannels || 0,
            lastMessageTime: messageStats.latestMessageTime,
            hoursSinceLastMessage: messageStats.latestMessageTime ? 
              Math.round((Date.now() - messageStats.latestMessageTime) / (1000 * 60 * 60)) : null,
            
            // 分析結果
            participationLevel: analyzed.analysis.participationLevel,
            serverSize: analyzed.analysis.serverSize,
            activityLevel: analyzed.analysis.activityLevel,
            engagementLevel: analyzed.analysis.engagementLevel,
            
            // サーバー機能
            premiumTier: guild.premium_tier || 0,
            features: guild.features || [],
            verificationLevel: guild.verification_level || 0,
            
            // 賑わい度詳細
           messageActivity: (messageStats.totalRecentMessages || 0) > 50 ? 'high' : (messageStats.totalRecentMessages || 0) > 10 ? 'medium' : 'low',
            userDiversity: messageStats.activeUsers > 10 ? 'high' : messageStats.activeUsers > 3 ? 'medium' : 'low',
            channelUtilization: messageStats.activeChannelCount && messageStats.totalTextChannels ? 
              Math.round((messageStats.activeChannelCount / messageStats.totalTextChannels) * 100) + '%' : 'N/A'
          }
        });
      });

      // 非表示サーバーのログ
      if (hiddenGuilds.length > 0) {
        console.log('📋 非表示されたサーバー:');
        hiddenGuilds.forEach((analyzed, index) => {
          const messageStats = analyzed.messageAnalysis;
          console.log(`  ${index + 1}. ${analyzed.guild.name}:`);
          console.log(`    - 賑わい度: ${analyzed.activityScore}/100 (基準: ${filterSettings.criteria.minimumActivityScore})`);
          console.log(`    - メッセージ: ${messageStats.totalRecentMessages || 0}件 (基準: ${filterSettings.criteria.minimumRecentMessages})`);
          console.log(`    - アクティブユーザー: ${messageStats.activeUsers || 0}人 (基準: ${filterSettings.criteria.minimumActiveUsers})`);
        });
      }
    }

    console.log(`✅ Discord 総取得数: ${allUsers.length}人`);
    console.log(`📊 内訳: 本人 1人, アクティブサーバー ${allUsers.length - 1}個`);
    console.log(`🔍 フィルタリング: ${guilds.length}個中 ${allUsers.length - 1}個を表示`);
    
    return allUsers;

  } catch (error) {
    console.error('❌ Discord データ取得エラー:', error);
    
    return [{
      id: 'discord-fallback',
      name: 'Discord ユーザー（制限モード）',
      email: undefined,
      avatar: undefined,
      service: 'discord',
      role: 'self',
      department: '認証制限',
      lastActivity: new Date().toISOString(),
      isActive: false,
      activityScore: 30,
      communicationScore: 30,
      isolationRisk: 'high',
      relationshipType: 'self',
      relationshipStrength: 50,
      metadata: {
        note: 'Discord API権限不足のため制限モードで動作',
        error: error instanceof Error ? error.message : 'Unknown error',
        needsPermissions: 'relationships.read, guilds.members.read'
      }
    }];
  }
}
// ChatWork ユーザーデータ取得（ルーム参加者・頻繁な連絡先含む）
async function getChatWorkUsersExtended(integration: any): Promise<UnifiedUser[]> {
  try {
    const allUsers: UnifiedUser[] = [];

    // 1. 自分の情報を取得
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

    // 2. 参加ルーム一覧取得
    const roomsResponse = await fetch('https://api.chatwork.com/v2/rooms', {
      headers: {
        'X-ChatWorkToken': integration.accessToken,
        'Content-Type': 'application/json'
      }
    });

    const roomParticipation: Record<string, number> = {};
    const roomUsers = new Set<string>();
    const lastRoomInteraction: Record<string, string> = {};

    if (roomsResponse.ok) {
      const rooms = await roomsResponse.json();
      console.log(`📱 ChatWork 参加ルーム数: ${rooms.length}`);

      for (const room of rooms.slice(0, 20)) {
        try {
          const membersResponse = await fetch(`https://api.chatwork.com/v2/rooms/${room.room_id}/members`, {
            headers: {
              'X-ChatWorkToken': integration.accessToken,
              'Content-Type': 'application/json'
            }
          });

          if (membersResponse.ok) {
            const members = await membersResponse.json();
            members.forEach((member: any) => {
              if (member.account_id !== meData.account_id) {
                roomUsers.add(member.account_id.toString());
                roomParticipation[member.account_id.toString()] = (roomParticipation[member.account_id.toString()] || 0) + 1;
              }
            });
          }

          const messagesResponse = await fetch(`https://api.chatwork.com/v2/rooms/${room.room_id}/messages?force=0`, {
            headers: {
              'X-ChatWorkToken': integration.accessToken,
              'Content-Type': 'application/json'
            }
          });

          if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            if (messages.length > 0) {
              const latestMessage = messages[messages.length - 1];
              if (latestMessage.account && latestMessage.account.account_id !== meData.account_id) {
                const accountId = latestMessage.account.account_id.toString();
                if (!lastRoomInteraction[accountId] || new Date(latestMessage.send_time * 1000) > new Date(lastRoomInteraction[accountId])) {
                  lastRoomInteraction[accountId] = new Date(latestMessage.send_time * 1000).toISOString();
                }
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ ルーム ${room.room_id} 詳細取得失敗:`, error);
        }
      }
    }

    // 3. コンタクト一覧取得
    const contactsResponse = await fetch('https://api.chatwork.com/v2/contacts', {
      headers: {
        'X-ChatWorkToken': integration.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!contactsResponse.ok) {
      console.warn(`ChatWork コンタクト取得失敗: ${contactsResponse.status}. 個人情報のみ取得します`);
      
      return [{
        id: meData.account_id.toString(),
        name: meData.name,
        email: undefined,
        avatar: meData.avatar_image_url,
        service: 'chatwork',
        role: 'self',
        department: meData.department || '未設定',
        lastActivity: new Date().toISOString(),
        isActive: true,
        activityScore: 75,
        communicationScore: 70,
        isolationRisk: 'medium',
        relationshipType: 'self',
        relationshipStrength: 100,
        metadata: {
          title: meData.title,
          note: 'コンタクト権限制限のため、個人情報のみ取得'
        }
      }];
    }

    const contacts = await contactsResponse.json();

    // 4. 自分の情報も含める
    const allContacts = [meData, ...contacts];

    // 5. ユーザーデータ統合
    const chatworkUsers = allContacts.map((contact: any) => {
      const activityScore = calculateChatWorkActivityScore(contact);
      const accountId = contact.account_id.toString();
      const isInRooms = roomUsers.has(accountId);
      const roomCount = roomParticipation[accountId] || 0;
      const isSelf = contact.account_id === meData.account_id;
      
      let communicationScore = 50;
      if (isInRooms) {
        communicationScore += 20;
        communicationScore += Math.min(20, roomCount * 3);
      }
      
      const isolationRisk = isSelf ? 'low' : determineIsolationRisk(activityScore, communicationScore);
      
      let relationshipType: 'teammate' | 'contact' | 'frequent_contact' | 'self' = isSelf ? 'self' : 'contact';
      let relationshipStrength = isSelf ? 100 : 25;
      
      let contactType: 'direct' | 'group' | 'organization' = 'direct';
      if (isInRooms && roomCount > 1) {
        contactType = 'group';
      } else if (contact.organization_name) {
        contactType = 'organization';
      }
      
      if (!isSelf) {
        if (isInRooms && roomCount > 3) {
          relationshipType = 'frequent_contact';
          relationshipStrength = 50 + Math.min(30, roomCount * 5);
        } else if (isInRooms) {
          relationshipType = 'contact';
          relationshipStrength = 30 + roomCount * 2;
        }
      }

      return {
        id: accountId,
        name: contact.name,
        email: undefined,
        avatar: contact.avatar_image_url,
        service: 'chatwork',
        role: isSelf ? 'self' : 'contact',
        department: contact.department || contact.organization_name || '未設定',
        lastActivity: lastRoomInteraction[accountId] || undefined,
        isActive: true,
        activityScore,
        communicationScore,
        isolationRisk,
        relationshipType,
        relationshipStrength,
        metadata: {
          title: contact.title,
          organization: contact.organization_name,
          chatwork_id: contact.chatwork_id,
          contactType,
          roomParticipation: roomCount,
          interactionScore: communicationScore,
          lastInteraction: lastRoomInteraction[accountId]
        }
      };
    });

    allUsers.push(...chatworkUsers);

    console.log(`✅ ChatWork 総取得数: ${allUsers.length}人 (頻繁な連絡先: ${allUsers.filter(u => u.relationshipType === 'frequent_contact').length}人)`);
    return allUsers;

  } catch (error) {
    console.error('❌ ChatWork データ取得エラー:', error);
    throw error;
  }
}

// 活動スコア計算関数群
function calculateSlackActivityScore(member: any): number {
  let score = 50;

  if (member.profile?.real_name) score += 10;
  if (member.profile?.email) score += 10;
  if (member.profile?.image_192) score += 5;

  if (member.updated) {
    const daysSinceUpdate = (Date.now() - (member.updated * 1000)) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) score += 20;
    else if (daysSinceUpdate < 30) score += 10;
  }

  if (!member.deleted && !member.is_restricted) score += 15;

  return Math.min(100, Math.max(0, score));
}

function calculateTeamsActivityScore(user: any): number {
  let score = 50;

  if (user.accountEnabled) score += 20;
  
  if (user.displayName) score += 10;
  if (user.department || user.jobTitle) score += 10;
  if (user.officeLocation) score += 5;
  
  if (user.lastSignInDateTime) {
    const daysSinceSignIn = (Date.now() - new Date(user.lastSignInDateTime).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSignIn < 7) score += 20;
    else if (daysSinceSignIn < 30) score += 10;
    else if (daysSinceSignIn < 90) score += 5;
  }

  if (user.userType !== 'Guest') score += 5;

  return Math.min(100, Math.max(0, score));
}

function calculateGoogleActivityScore(user: any): number {
  let score = 50;

  if (!user.suspended && !user.archived) score += 25;
  
  if (user.name?.fullName || (user.name?.givenName && user.name?.familyName)) score += 10;
  if (user.organizations?.length > 0) score += 10;
  if (user.locations?.length > 0) score += 5;
  
  if (user.lastLoginTime) {
    const daysSinceLogin = (Date.now() - new Date(user.lastLoginTime).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLogin < 7) score += 20;
    else if (daysSinceLogin < 30) score += 10;
    else if (daysSinceLogin < 90) score += 5;
  }

  if (user.isEnforcedIn2Sv) score += 10;
  if (user.isAdmin) score += 5;

  return Math.min(100, Math.max(0, score));
}

function calculateChatWorkActivityScore(contact: any): number {
  let score = 50;

  if (contact.name) score += 15;
  if (contact.avatar_image_url) score += 10;
  if (contact.department || contact.organization_name) score += 10;
  if (contact.title) score += 10;
  if (contact.chatwork_id) score += 15;

  return Math.min(100, Math.max(0, score));
}

// 孤立リスク判定
function determineIsolationRisk(activityScore: number, communicationScore: number): 'low' | 'medium' | 'high' {
  const averageScore = (activityScore + communicationScore) / 2;
  
  if (averageScore >= 80) return 'low';
  if (averageScore >= 60) return 'medium';
  return 'high';
}

// ユーザーデータ統合・重複排除（拡張版）
function mergeUserDataExtended(users: UnifiedUser[]): UnifiedUser[] {
  const userMap = new Map<string, UnifiedUser>();

  users.forEach(user => {
    const key = user.email || user.id;
    const existing = userMap.get(key);

    if (existing) {
      const merged: UnifiedUser = {
        ...existing,
        name: user.name || existing.name,
        email: user.email || existing.email,
        avatar: user.avatar || existing.avatar,
        service: `${existing.service},${user.service}`,
        activityScore: Math.max(existing.activityScore, user.activityScore),
        communicationScore: Math.max(existing.communicationScore, user.communicationScore),
        isolationRisk: existing.isolationRisk === 'high' || user.isolationRisk === 'high' ? 'high' :
                      existing.isolationRisk === 'medium' || user.isolationRisk === 'medium' ? 'medium' : 'low',
        relationshipType: prioritizeRelationshipType(existing.relationshipType, user.relationshipType),
        relationshipStrength: Math.max(existing.relationshipStrength, user.relationshipStrength),
        metadata: { ...existing.metadata, ...user.metadata }
      };
      userMap.set(key, merged);
    } else {
      userMap.set(key, user);
    }
  });

  return Array.from(userMap.values());
}

// 関係性タイプの優先順位付け
function prioritizeRelationshipType(
  existing: 'teammate' | 'friend' | 'contact' | 'frequent_contact' | 'self',
  new_type: 'teammate' | 'friend' | 'contact' | 'frequent_contact' | 'self'
): 'teammate' | 'friend' | 'contact' | 'frequent_contact' | 'self' {
  const priority = {
    'self': 5,
    'friend': 4,
    'frequent_contact': 3,
    'teammate': 2,
    'contact': 1
  };
  
  return priority[existing] >= priority[new_type] ? existing : new_type;
}

// チーム健全性計算（拡張版）
function calculateTeamHealthExtended(users: UnifiedUser[]): TeamHealthMetrics {
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

  // 関係性分布の計算
  const relationshipDistribution = users.reduce((acc, user) => {
    acc[user.relationshipType] = (acc[user.relationshipType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 健全性スコアの計算（関係性の多様性も考慮）
  let healthScore = users.length > 0 ? Math.round(totalScore / users.length) : 0;
  
  // 関係性の多様性ボーナス
  const relationshipTypes = Object.keys(relationshipDistribution).length;
  if (relationshipTypes >= 4) healthScore += 5;
  else if (relationshipTypes >= 3) healthScore += 3;
  
  // 強い関係性の割合ボーナス
  const strongRelationships = users.filter(u => u.relationshipStrength > 70).length;
  const strongRelationshipRatio = users.length > 0 ? strongRelationships / users.length : 0;
  if (strongRelationshipRatio > 0.3) healthScore += 5;
  else if (strongRelationshipRatio > 0.2) healthScore += 3;

  healthScore = Math.min(100, healthScore);

  return {
    totalMembers: users.length,
    activeMembers: activeUsers.length,
    healthScore,
    isolationRisks,
    serviceDistribution,
    relationshipDistribution,
    lastUpdated: new Date().toISOString()
  };
}

// 離職リスク分析（拡張版）
function analyzeIsolationRisksExtended(users: UnifiedUser[]): RiskAnalysis {
  const highRiskUsers = users.filter(u => u.isolationRisk === 'high');
  const mediumRiskUsers = users.filter(u => u.isolationRisk === 'medium');
  const lowRiskUsers = users.filter(u => u.isolationRisk === 'low');
  
  // 関係性別のリスク分析
  const relationshipRiskAnalysis = users.reduce((acc, user) => {
    if (!acc[user.relationshipType]) {
      acc[user.relationshipType] = { high: 0, medium: 0, low: 0, total: 0 };
    }
    acc[user.relationshipType][user.isolationRisk]++;
    acc[user.relationshipType].total++;
    return acc;
  }, {} as Record<string, { high: number; medium: number; low: number; total: number }>);

  // 弱い関係性の人々を特定
  const weakRelationships = users.filter(u => u.relationshipStrength < 40 && u.relationshipType !== 'self');
  
  // 孤立している可能性が高い人（高リスク + 弱い関係性）
  const isolatedUsers = users.filter(u => 
    u.isolationRisk === 'high' && 
    u.relationshipStrength < 50 && 
    u.relationshipType !== 'self'
  );

  return {
    summary: {
      total: users.length,
      highRisk: highRiskUsers.length,
      mediumRisk: mediumRiskUsers.length,
      lowRisk: lowRiskUsers.length,
      isolated: isolatedUsers.length,
      weakRelationships: weakRelationships.length
    },
    relationshipRiskAnalysis,
    recommendations: generateExtendedRecommendations(highRiskUsers, mediumRiskUsers, isolatedUsers, weakRelationships),
    trends: {
      improving: 0,
      declining: 0,
      stable: users.length
    },
    criticalInsights: generateCriticalInsights(users, isolatedUsers, relationshipRiskAnalysis)
  };
}

// 推奨アクション生成（拡張版）
function generateExtendedRecommendations(
  highRisk: UnifiedUser[], 
  mediumRisk: UnifiedUser[], 
  isolated: UnifiedUser[],
  weakRelationships: UnifiedUser[]
): Array<{
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  targets: string[];
  reason: string;
  details: string;
  timeline: string;
}> {
  const recommendations = [];

  // 緊急対応が必要な孤立ユーザー
  if (isolated.length > 0) {
    recommendations.push({
      priority: 'critical' as const,
      action: '緊急1on1ミーティングの実施',
      targets: isolated.map(u => u.name),
      reason: '高い離職リスクと弱い人間関係の組み合わせが検出されました',
      details: '即座に個別面談を行い、現状の課題や不満を聞き取り、具体的なサポート策を検討してください。',
      timeline: '48時間以内'
    });
  }

  // 高リスクユーザー対応
  if (highRisk.length > 0) {
    const friendsInHighRisk = highRisk.filter(u => u.relationshipType === 'friend');
    const teammatesInHighRisk = highRisk.filter(u => u.relationshipType === 'teammate');

    if (friendsInHighRisk.length > 0) {
      recommendations.push({
        priority: 'high' as const,
        action: 'フレンド・親しい関係者への配慮',
        targets: friendsInHighRisk.map(u => u.name),
        reason: '親しい関係の人が離職リスクを抱えています',
        details: 'プライベートな関係性を考慮し、より慎重で個人的なアプローチが必要です。',
        timeline: '1週間以内'
      });
    }

    if (teammatesInHighRisk.length > 0) {
      recommendations.push({
        priority: 'high' as const,
        action: 'チーム内1on1ミーティングの実施',
        targets: teammatesInHighRisk.map(u => u.name),
        reason: 'チームメンバーの活動量低下が見られます',
        details: '業務負荷、チーム内の人間関係、キャリアパスについて詳しく話し合ってください。',
        timeline: '1週間以内'
      });
    }
  }

  // 中リスクユーザー対応
  if (mediumRisk.length > 0) {
    const frequentContacts = mediumRisk.filter(u => u.relationshipType === 'frequent_contact');
    
    if (frequentContacts.length > 0) {
      recommendations.push({
        priority: 'medium' as const,
        action: '頻繁な連絡先との関係性強化',
        targets: frequentContacts.slice(0, 5).map(u => u.name),
        reason: 'よく連絡を取る相手のエンゲージメント低下が見られます',
        details: 'カジュアルな面談やチームビルディング活動を通じて関係性を深めてください。',
        timeline: '2週間以内'
      });
    }

    if (mediumRisk.length > frequentContacts.length) {
      recommendations.push({
        priority: 'medium' as const,
        action: 'チームビルディング活動の企画',
        targets: mediumRisk.filter(u => u.relationshipType !== 'frequent_contact').slice(0, 5).map(u => u.name),
        reason: 'コミュニケーション機会の増加が必要です',
        details: 'ランチ会、オンライン交流会、プロジェクト外の協力機会を作ってください。',
        timeline: '2週間以内'
      });
    }
  }

  // 弱い関係性の改善
  if (weakRelationships.length > 0) {
    recommendations.push({
      priority: 'low' as const,
      action: '関係性構築のサポート',
      targets: weakRelationships.slice(0, 8).map(u => u.name),
      reason: '人間関係の構築が不十分な可能性があります',
      details: 'メンター制度、バディ制度、小グループでの活動を通じて関係性構築を支援してください。',
      timeline: '1ヶ月以内'
    });
  }

  return recommendations;
}

// 重要な洞察の生成
function generateCriticalInsights(
  users: UnifiedUser[], 
  isolated: UnifiedUser[], 
  relationshipRiskAnalysis: Record<string, { high: number; medium: number; low: number; total: number }>
): Array<{
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  impact: 'high' | 'medium' | 'low' | 'positive';
  actionRequired: boolean;
}> {
  const insights = [];

  // 孤立リスクの警告
  if (isolated.length > 0) {
    const isolationRate = (isolated.length / users.length) * 100;
    insights.push({
      type: 'warning' as const,
      title: '孤立リスク警告',
      message: `${isolated.length}人（${isolationRate.toFixed(1)}%）が孤立リスクの高い状態です。`,
      impact: 'high' as const,
      actionRequired: true
    });
  }

  // フレンドの離職リスク
  const friendsAtRisk = users.filter(u => u.relationshipType === 'friend' && u.isolationRisk !== 'low');
  if (friendsAtRisk.length > 0) {
    insights.push({
      type: 'info' as const,
      title: 'フレンド関係者のリスク',
      message: `${friendsAtRisk.length}人のフレンド・親しい関係者が離職リスクを抱えています。`,
      impact: 'medium' as const,
      actionRequired: true
    });
  }

  // サービス別のリスク分布
  const serviceRisks = users.reduce((acc, user) => {
    user.service.split(',').forEach(service => {
      const s = service.trim();
      if (!acc[s]) acc[s] = { high: 0, medium: 0, low: 0, total: 0 };
      acc[s][user.isolationRisk]++;
      acc[s].total++;
    });
    return acc;
  }, {} as Record<string, { high: number; medium: number; low: number; total: number }>);

  // 特定サービスでのリスク集中
  Object.entries(serviceRisks).forEach(([service, risks]) => {
    const highRiskRate = (risks.high / risks.total) * 100;
    if (highRiskRate > 30 && risks.total > 3) {
      insights.push({
        type: 'warning' as const,
        title: `${service.toUpperCase()}での高リスク集中`,
        message: `${service}ユーザーの${highRiskRate.toFixed(1)}%が高リスク状態です。`,
        impact: 'medium' as const,
        actionRequired: true
      });
    }
  });

  // 関係性の多様性分析
  const relationshipTypes = Object.keys(relationshipRiskAnalysis).length;
  if (relationshipTypes <= 2) {
    insights.push({
      type: 'info' as const,
      title: '関係性の多様性不足',
      message: '人間関係の種類が限定的です。より多様な関係性の構築を推奨します。',
      impact: 'low' as const,
      actionRequired: false
    });
  }

  // 強い関係性の割合
  const strongRelationships = users.filter(u => u.relationshipStrength > 70).length;
  const strongRelationshipRate = (strongRelationships / users.length) * 100;
  
  if (strongRelationshipRate < 20) {
    insights.push({
      type: 'warning' as const,
      title: '強い関係性の不足',
      message: `強い人間関係を持つ人が${strongRelationshipRate.toFixed(1)}%と少ない状況です。`,
      impact: 'medium' as const,
      actionRequired: true
    });
  } else if (strongRelationshipRate > 50) {
    insights.push({
      type: 'success' as const,
      title: '良好な関係性',
      message: `${strongRelationshipRate.toFixed(1)}%の人が強い人間関係を築いています。`,
      impact: 'positive' as const,
      actionRequired: false
    });
  }

  return insights;
}