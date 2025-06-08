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
  relationshipType: 'teammate' | 'friend' | 'contact' | 'frequent_contact' | 'self'; // 関係性タイプ
  relationshipStrength: number; // 0-100: 関係性の強さ
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
    friendSince?: string; // フレンド開始日
    mutualGuilds?: number; // 共通サーバー数
    gameActivity?: string; // ゲーム活動
    // Teams関連
    userType?: string;
    chatFrequency?: number; // チャット頻度
    meetingFrequency?: number; // 会議頻度
    callFrequency?: number; // 通話頻度
    // Google関連
    orgUnit?: string;
    isEnforcedIn2Sv?: boolean;
    domain?: string;
    emailFrequency?: number; // メール頻度
    meetFrequency?: number; // Meet頻度
    driveCollaboration?: number; // Drive共同作業
    // Slack関連
    dmFrequency?: number; // DM頻度
    channelActivity?: number; // チャンネル活動度
    // ChatWork関連
    title?: string;
    organization?: string;
    chatwork_id?: string;
    contactType?: 'direct' | 'group' | 'organization'; // コンタクトタイプ
    roomParticipation?: number; // ルーム参加数
    // 共通の追加フィールド
    note?: string;
    lastInteraction?: string; // 最終やり取り日時
    interactionScore?: number; // やり取りスコア
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
  relationshipDistribution: Record<string, number>; // 関係性分布
  lastUpdated: string;
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

// Slackユーザーデータ取得（DM相手含む）
async function getSlackUsersExtended(integration: any): Promise<UnifiedUser[]> {
  try {
    const allUsers: UnifiedUser[] = [];

    // 1. ワークスペースメンバー取得
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

    // 2. DM履歴取得（頻繁な連絡先特定）
    const conversationsResponse = await fetch('https://slack.com/api/conversations.list?types=im', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const dmData = conversationsResponse.ok ? await conversationsResponse.json() : { channels: [] };
    const dmUsers = new Set();
    const dmFrequency: Record<string, number> = {};
    const lastInteraction: Record<string, string> = {};

    // DM相手の特定と頻度計算
    if (dmData.ok && dmData.channels) {
      for (const dm of dmData.channels) {
        if (dm.user) {
          dmUsers.add(dm.user);
          // DM履歴の詳細取得（最近のメッセージ数）
          try {
            const historyResponse = await fetch(`https://slack.com/api/conversations.history?channel=${dm.id}&limit=50`, {
              headers: {
                'Authorization': `Bearer ${integration.accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (historyResponse.ok) {
              const history = await historyResponse.json();
              dmFrequency[dm.user] = history.messages?.length || 0;
              
              // 最新メッセージの日時取得
              if (history.messages && history.messages.length > 0) {
                lastInteraction[dm.user] = new Date(parseFloat(history.messages[0].ts) * 1000).toISOString();
              }
            }
          } catch (error) {
            dmFrequency[dm.user] = 1; // デフォルト値
          }
        }
      }
    }

    // 3. チャンネル活動取得
    const channelsResponse = await fetch('https://slack.com/api/conversations.list?exclude_archived=true', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const channelsData = channelsResponse.ok ? await channelsResponse.json() : { channels: [] };
    const channelActivity: Record<string, number> = {};

    // 各チャンネルでのユーザー活動を分析
    if (channelsData.ok && channelsData.channels) {
      for (const channel of channelsData.channels.slice(0, 10)) { // 最初の10チャンネルのみ
        try {
          const membersResponse = await fetch(`https://slack.com/api/conversations.members?channel=${channel.id}`, {
            headers: {
              'Authorization': `Bearer ${integration.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (membersResponse.ok) {
            const members = await membersResponse.json();
            if (members.ok && members.members) {
              members.members.forEach((memberId: string) => {
                channelActivity[memberId] = (channelActivity[memberId] || 0) + 1;
              });
            }
          }
        } catch (error) {
          // チャンネル分析エラーは無視
        }
      }
    }

    // 4. ユーザーデータ統合
    const workspaceMembers = usersData.members
      .filter((member: any) => !member.deleted && !member.is_bot && member.id !== 'USLACKBOT')
      .map((member: any) => {
        const activityScore = calculateSlackActivityScore(member);
        const hasDM = dmUsers.has(member.id);
        const dmCount = dmFrequency[member.id] || 0;
        const channelCount = channelActivity[member.id] || 0;
        
        // DM頻度とチャンネル活動に基づくコミュニケーションスコア
        let communicationScore = 50;
        if (hasDM) {
          communicationScore += 25;
          communicationScore += Math.min(15, dmCount);
        }
        communicationScore += Math.min(10, channelCount);
        
        const isolationRisk = determineIsolationRisk(activityScore, communicationScore);
        
        // 関係性タイプの決定
        let relationshipType: 'teammate' | 'frequent_contact' = 'teammate';
        let relationshipStrength = 30;
        
        if (hasDM && dmCount > 10) {
          relationshipType = 'frequent_contact';
          relationshipStrength = 60 + Math.min(30, dmCount);
        } else if (hasDM) {
          relationshipStrength = 40 + dmCount;
        }
        
        relationshipStrength += Math.min(10, channelCount);

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
          relationshipType,
          relationshipStrength,
          metadata: {
            workingHours: member.tz_label,
            timezone: member.tz,
            joinDate: member.profile?.start_date,
            dmFrequency: dmCount,
            channelActivity: channelCount,
            interactionScore: communicationScore,
            lastInteraction: lastInteraction[member.id]
          }
        };
      });

    allUsers.push(...workspaceMembers);

    console.log(`✅ Slack 総取得数: ${allUsers.length}人 (頻繁な連絡先: ${allUsers.filter(u => u.relationshipType === 'frequent_contact').length}人)`);
    return allUsers;

  } catch (error) {
    console.error('❌ Slack データ取得エラー:', error);
    throw error;
  }
}

// Microsoft Teams/Azure ADユーザーデータ取得（チャット相手・会議参加者含む）
async function getTeamsUsersExtended(integration: any): Promise<UnifiedUser[]> {
  try {
    const allUsers: UnifiedUser[] = [];

    // 1. 現在のユーザー情報で権限確認
    const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!meResponse.ok) {
      throw new Error(`Teams認証エラー: ${meResponse.status} - アクセストークンが無効です`);
    }

    const currentUser = await meResponse.json();

    // 2. チャット履歴取得（個人チャット相手）
    const chatsResponse = await fetch('https://graph.microsoft.com/v1.0/me/chats', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const chatFrequency: Record<string, number> = {};
    const chatUsers = new Set<string>();
    const lastChatInteraction: Record<string, string> = {};

    if (chatsResponse.ok) {
      const chatsData = await chatsResponse.json();
      
      for (const chat of chatsData.value || []) {
        if (chat.chatType === 'oneOnOne') {
          // チャットメンバー取得
          try {
            const membersResponse = await fetch(`https://graph.microsoft.com/v1.0/me/chats/${chat.id}/members`, {
              headers: {
                'Authorization': `Bearer ${integration.accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (membersResponse.ok) {
              const members = await membersResponse.json();
              const otherMember = members.value?.find((m: any) => m.userId !== currentUser.id);
              
              if (otherMember) {
                chatUsers.add(otherMember.userId);
                
                // チャットメッセージ数取得
                const messagesResponse = await fetch(`https://graph.microsoft.com/v1.0/me/chats/${chat.id}/messages?$top=50`, {
                  headers: {
                    'Authorization': `Bearer ${integration.accessToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (messagesResponse.ok) {
                  const messages = await messagesResponse.json();
                  chatFrequency[otherMember.userId] = messages.value?.length || 0;
                  
                  if (messages.value && messages.value.length > 0) {
                    lastChatInteraction[otherMember.userId] = messages.value[0].createdDateTime;
                  }
                }
              }
            }
          } catch (error) {
            // チャット詳細取得エラーは無視
          }
        }
      }
    }

    // 3. 最近の会議参加者取得
    const eventsResponse = await fetch('https://graph.microsoft.com/v1.0/me/events?$top=20&$select=id,subject,attendees,start,end', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const meetingFrequency: Record<string, number> = {};
    const meetingUsers = new Set<string>();

    if (eventsResponse.ok) {
      const events = await eventsResponse.json();
      
      for (const event of events.value || []) {
        if (event.attendees) {
          for (const attendee of event.attendees) {
            if (attendee.emailAddress && attendee.emailAddress.address !== currentUser.userPrincipalName) {
              meetingUsers.add(attendee.emailAddress.address);
              meetingFrequency[attendee.emailAddress.address] = (meetingFrequency[attendee.emailAddress.address] || 0) + 1;
            }
          }
        }
      }
    }

    // 4. 組織ユーザー一覧取得
    const usersResponse = await fetch('https://graph.microsoft.com/v1.0/users?$top=999&$select=id,displayName,userPrincipalName,mail,department,jobTitle,officeLocation,accountEnabled,createdDateTime,lastSignInDateTime,userType', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
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
          note: '管理者権限がないため、個人情報のみ取得'
        }
      }];
    }

    const usersData = await usersResponse.json();

    // 5. ユーザーデータ統合
    const organizationUsers = await Promise.allSettled(
      usersData.value.map(async (user: any) => {
        // プロフィール写真取得
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
        const hasChat = chatUsers.has(user.id);
        const hasMeeting = meetingUsers.has(user.userPrincipalName || user.mail);
        const chatCount = chatFrequency[user.id] || 0;
        const meetingCount = meetingFrequency[user.userPrincipalName || user.mail] || 0;
        
        // チャット・会議頻度に基づくコミュニケーションスコア
        let communicationScore = 50;
        if (hasChat) {
          communicationScore += 20;
          communicationScore += Math.min(15, chatCount);
        }
        if (hasMeeting) {
          communicationScore += 15;
          communicationScore += Math.min(10, meetingCount);
        }
        
        const isolationRisk = determineIsolationRisk(activityScore, communicationScore);
        
        // 関係性タイプの決定
        let relationshipType: 'teammate' | 'frequent_contact' = 'teammate';
        let relationshipStrength = 30;
        
        if ((hasChat && chatCount > 5) || (hasMeeting && meetingCount > 3)) {
          relationshipType = 'frequent_contact';
          relationshipStrength = 50 + Math.min(25, chatCount + meetingCount * 2);
        } else if (hasChat || hasMeeting) {
          relationshipStrength = 35 + chatCount + meetingCount;
        }

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
          relationshipType,
          relationshipStrength,
          metadata: {
            workingHours: user.officeLocation,
            joinDate: user.createdDateTime,
            userType: user.userType,
            chatFrequency: chatCount,
            meetingFrequency: meetingCount,
            interactionScore: communicationScore,
            lastInteraction: lastChatInteraction[user.id]
          }
        };
      })
    );

    const validUsers = organizationUsers
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<UnifiedUser>).value);

    allUsers.push(...validUsers);

    console.log(`✅ Teams 総取得数: ${allUsers.length}人 (頻繁な連絡先: ${allUsers.filter(u => u.relationshipType === 'frequent_contact').length}人)`);
    return allUsers;

  } catch (error) {
    console.error('❌ Teams データ取得エラー:', error);
    throw error;
  }
}

// Google Workspace/Meetユーザーデータ取得（Gmail連絡先・Meet参加者含む）
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
    let currentUser: any = null; // 型を明示的に指定
    
    if (profileResponse.ok) {
      currentUser = await profileResponse.json();
      if (currentUser.hd) {
        domain = currentUser.hd; // ホストドメイン
      }
    }

    // 2. Gmail連絡先の頻度分析（最近のメール）
const emailFrequency: Record<string, number> = {};
const emailUsers = new Set<string>();
const lastEmailInteraction: Record<string, string> = {};

try {
  const messagesResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100&q=in:sent', {
    headers: {
      'Authorization': `Bearer ${integration.accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (messagesResponse.ok) {
    const messages = await messagesResponse.json();
    
    for (const message of (messages.messages || []).slice(0, 50)) {
      try {
        const messageDetailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=To&metadataHeaders=Date`, {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (messageDetailResponse.ok) {
          const messageDetail = await messageDetailResponse.json();
          const headers = messageDetail.payload?.headers || [];
          
          const toHeader = headers.find((h: any) => h.name === 'To');
          const dateHeader = headers.find((h: any) => h.name === 'Date');
          
          if (toHeader && toHeader.value) {
            const emails = toHeader.value.match(/[\w\.-]+@[\w\.-]+\.\w+/g) || [];
            emails.forEach((email: string) => {
              // currentUserの存在チェックを追加
              if (currentUser && email !== currentUser.email) {
                emailUsers.add(email);
                emailFrequency[email] = (emailFrequency[email] || 0) + 1;
                
                if (dateHeader && (!lastEmailInteraction[email] || new Date(dateHeader.value) > new Date(lastEmailInteraction[email]))) {
                  lastEmailInteraction[email] = new Date(dateHeader.value).toISOString();
                }
              }
            });
          }
        }
      } catch (error) {
        // メッセージ詳細取得エラーは無視
      }
    }
  }
} catch (error) {
  console.warn('Gmail データ取得をスキップ:', error);
}

    // 3. Google Driveの共同作業者取得
const driveCollaboration: Record<string, number> = {};
const driveUsers = new Set<string>();

try {
  const filesResponse = await fetch('https://www.googleapis.com/drive/v3/files?q=sharedWithMe=true&fields=files(id,name,owners,permissions)&pageSize=50', {
    headers: {
      'Authorization': `Bearer ${integration.accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (filesResponse.ok) {
    const files = await filesResponse.json();
    
    for (const file of files.files || []) {
      // ファイル所有者
      if (file.owners) {
        file.owners.forEach((owner: any) => {
          // currentUserの存在チェックを追加
          if (owner.emailAddress && currentUser && owner.emailAddress !== currentUser.email) {
            driveUsers.add(owner.emailAddress);
            driveCollaboration[owner.emailAddress] = (driveCollaboration[owner.emailAddress] || 0) + 1;
          }
        });
      }
      
      // 共有権限
      if (file.permissions) {
        file.permissions.forEach((permission: any) => {
          // currentUserの存在チェックを追加
          if (permission.emailAddress && currentUser && permission.emailAddress !== currentUser.email) {
            driveUsers.add(permission.emailAddress);
            driveCollaboration[permission.emailAddress] = (driveCollaboration[permission.emailAddress] || 0) + 1;
          }
        });
      }
    }
  }
} catch (error) {
  console.warn('Google Drive データ取得をスキップ:', error);
}
    // 4. Admin SDK でユーザー取得
    const usersResponse = await fetch(`https://admin.googleapis.com/admin/directory/v1/users?domain=${domain}&maxResults=500&projection=full`, {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!usersResponse.ok) {
      // Admin権限がない場合、個人情報のみ取得
      console.warn(`Google Admin SDK アクセス失敗: ${usersResponse.status}. 個人情報のみ取得します`);
      
      if (profileResponse.ok && currentUser) {
        return [{
          id: currentUser.id,
          name: currentUser.name || '名前未設定',
          email: currentUser.email,
          avatar: currentUser.picture,
          service: 'google',
          role: 'self',
             department: '未設定',
          lastActivity: new Date().toISOString(),
          isActive: true,
          activityScore: 85,
          communicationScore: 75,
          isolationRisk: 'medium',
          relationshipType: 'self',
          relationshipStrength: 100,
          metadata: {
            note: 'Admin権限がないため、個人情報のみ取得',
            domain: currentUser.hd
          }
        }];
      }
      
      throw new Error(`Google API エラー: ${usersResponse.status} - Admin SDK権限が必要です`);
    }

    const usersData = await usersResponse.json();

    // 5. ユーザーデータ統合
    const organizationUsers = (usersData.users || [])
      .filter((user: any) => !user.suspended && user.primaryEmail) // アクティブユーザーのみ
      .map((user: any) => {
        const activityScore = calculateGoogleActivityScore(user);
        const hasEmail = emailUsers.has(user.primaryEmail);
        const hasDriveCollab = driveUsers.has(user.primaryEmail);
        const emailCount = emailFrequency[user.primaryEmail] || 0;
        const driveCount = driveCollaboration[user.primaryEmail] || 0;
        
        // メール・Drive共同作業に基づくコミュニケーションスコア
        let communicationScore = 50;
        if (hasEmail) {
          communicationScore += 20;
          communicationScore += Math.min(15, emailCount);
        }
        if (hasDriveCollab) {
          communicationScore += 15;
          communicationScore += Math.min(10, driveCount);
        }
        
        const isolationRisk = determineIsolationRisk(activityScore, communicationScore);
        
        // 関係性タイプの決定
        let relationshipType: 'teammate' | 'frequent_contact' = 'teammate';
        let relationshipStrength = 30;
        
        if ((hasEmail && emailCount > 5) || (hasDriveCollab && driveCount > 3)) {
          relationshipType = 'frequent_contact';
          relationshipStrength = 55 + Math.min(25, emailCount + driveCount * 2);
        } else if (hasEmail || hasDriveCollab) {
          relationshipStrength = 35 + emailCount + driveCount;
        }

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
          relationshipType,
          relationshipStrength,
          metadata: {
            workingHours: user.locations?.[0]?.area || user.locations?.[0]?.buildingId,
            joinDate: user.creationTime,
            orgUnit: user.orgUnitPath,
            isEnforcedIn2Sv: user.isEnforcedIn2Sv,
            emailFrequency: emailCount,
            driveCollaboration: driveCount,
            interactionScore: communicationScore,
            lastInteraction: lastEmailInteraction[user.primaryEmail]
          }
        };
      });

    allUsers.push(...organizationUsers);

    console.log(`✅ Google 総取得数: ${allUsers.length}人 (頻繁な連絡先: ${allUsers.filter(u => u.relationshipType === 'frequent_contact').length}人)`);
    return allUsers;

  } catch (error) {
    console.error('❌ Google データ取得エラー:', error);
    throw error;
  }
}

// Discord ユーザーデータ取得（フレンド含む）
async function getDiscordUsersExtended(integration: any): Promise<UnifiedUser[]> {
  try {
    const allUsers: UnifiedUser[] = [];

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

    // 2. フレンドリスト取得
    const friendsResponse = await fetch(`https://discord.com/api/v10/users/@me/relationships`, {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (friendsResponse.ok) {
      const friends = await friendsResponse.json();
      console.log(`📱 Discord フレンド数: ${friends.length}`);

      // フレンドの詳細情報を並行取得
      const friendDetails = await Promise.allSettled(
        friends
          .filter((friend: any) => friend.type === 1) // type 1 = フレンド
          .map(async (friend: any) => {
            try {
              // 共通ギルド数取得
              const mutualGuildsResponse = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
                headers: {
                  'Authorization': `Bearer ${integration.accessToken}`,
                  'Content-Type': 'application/json'
                }
              });

              let mutualGuilds = 0;
              let lastDMActivity;
              
              if (mutualGuildsResponse.ok) {
                const channels = await mutualGuildsResponse.json();
                const dmChannel = channels.find((ch: any) => 
                  ch.type === 1 && ch.recipients?.some((r: any) => r.id === friend.user.id)
                );
                
                if (dmChannel) {
                  mutualGuilds = 1;
                  lastDMActivity = dmChannel.last_message_id;
                }
              }

              const activityScore = calculateDiscordFriendActivityScore(friend.user, friend);
              const communicationScore = calculateDiscordCommunicationScore(friend, mutualGuilds);
              const relationshipStrength = calculateRelationshipStrength(friend, mutualGuilds);

              return {
                id: friend.user.id,
                name: friend.user.global_name || friend.user.username,
                email: undefined,
                avatar: friend.user.avatar ? 
                  `https://cdn.discordapp.com/avatars/${friend.user.id}/${friend.user.avatar}.png` : 
                  undefined,
                service: 'discord',
                role: 'friend',
                department: 'フレンド',
                lastActivity: friend.since || new Date().toISOString(),
                isActive: true,
                activityScore,
                communicationScore,
                isolationRisk: determineIsolationRisk(activityScore, communicationScore),
                relationshipType: 'friend' as const,
                relationshipStrength,
                metadata: {
                  friendSince: friend.since || new Date().toISOString(),
                  mutualGuilds,
                  gameActivity: friend.user.activities?.[0]?.name,
                  interactionScore: communicationScore,
                  lastInteraction: friend.since
                }
              };
            } catch (error) {
              console.warn(`⚠️ フレンド詳細取得失敗: ${friend.user.username}`, error);
              return null;
            }
          })
      );

      const validFriends = friendDetails
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<UnifiedUser>).value);

      allUsers.push(...validFriends);
    }

    // 3. ギルドメンバー取得（teamIdが設定されている場合）
    if (integration.teamId) {
      try {
        const membersResponse = await fetch(`https://discord.com/api/v10/guilds/${integration.teamId}/members?limit=1000`, {
          headers: {
            'Authorization': `Bot ${integration.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (membersResponse.ok) {
          const members = await membersResponse.json();
          
          const guildMembers = members
            .filter((member: any) => member.user && !member.user.bot && member.user.id !== currentUser.id)
            .map((member: any) => {
              const activityScore = calculateDiscordActivityScore(member);
              const communicationScore = 65;
              const relationshipStrength = calculateGuildRelationshipStrength(member);

              return {
                id: member.user.id,
                name: member.nick || member.user.global_name || member.user.username,
                email: undefined,
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
                isolationRisk: determineIsolationRisk(activityScore, communicationScore),
                relationshipType: 'teammate' as const,
                relationshipStrength,
                metadata: {
                  joinDate: member.joined_at,
                  roles: member.roles?.length || 0,
                  nickname: member.nick
                }
              };
            });

          allUsers.push(...guildMembers);
        }
      } catch (error) {
        console.warn('⚠️ ギルドメンバー取得失敗:', error);
      }
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
        note: '本人アカウント'
      }
    });

    console.log(`✅ Discord 総取得数: ${allUsers.length}人 (フレンド: ${allUsers.filter(u => u.relationshipType === 'friend').length}人)`);
    return allUsers;

  } catch (error) {
    console.error('❌ Discord データ取得エラー:', error);
    throw error;
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

      // 各ルームのメンバーと最新メッセージを取得
      for (const room of rooms.slice(0, 20)) { // 最初の20ルームのみ
        try {
          // ルームメンバー取得
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

          // ルームの最新メッセージ取得
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
      // コンタクト取得失敗時は自分の情報のみ返す
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
  
  // ルーム参加数に基づくコミュニケーションスコア
  let communicationScore = 50;
  if (isInRooms) {
    communicationScore += 20;
    communicationScore += Math.min(20, roomCount * 3);
  }
  
  const isolationRisk = isSelf ? 'low' : determineIsolationRisk(activityScore, communicationScore);
  
  // 関係性タイプの決定
  let relationshipType: 'teammate' | 'contact' | 'frequent_contact' | 'self' = isSelf ? 'self' : 'contact';
  let relationshipStrength = isSelf ? 100 : 25;
  
  // contactTypeの型安全な設定
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
    email: undefined, // ChatWorkでは通常取得不可
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
      contactType, // 型安全な値を使用
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

function calculateDiscordFriendActivityScore(friendDetail: any, friend: any): number {
  let score = 60; // フレンドベーススコア

  // アバター設定
  if (friendDetail.avatar) score += 10;
  
  // アクティビティ（ゲーム等）
  if (friendDetail.activities && friendDetail.activities.length > 0) score += 15;
  
  // プレミアム会員
  if (friendDetail.premium_type) score += 10;
  
  // フレンド期間
  if (friend.since) {
    const daysSinceFriend = (Date.now() - new Date(friend.since).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceFriend > 365) score += 10; // 1年以上のフレンド
    else if (daysSinceFriend > 90) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

function calculateDiscordCommunicationScore(friend: any, mutualGuilds: number): number {
  let score = 50;

  // 共通ギルド数
  score += Math.min(20, mutualGuilds * 5);
  
  // フレンド期間の長さ
  if (friend.since) {
    const daysSinceFriend = (Date.now() - new Date(friend.since).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceFriend < 30) score += 20; // 最近のフレンド = 活発
    else if (daysSinceFriend > 365) score += 15; // 長期フレンド = 安定
  }

  return Math.min(100, Math.max(0, score));
}

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

// 関係性の強さ計算
function calculateRelationshipStrength(friend: any, mutualGuilds: number): number {
  let strength = 30; // ベース

  // 共通ギルド数
  strength += Math.min(30, mutualGuilds * 10);
  
  // フレンド期間
  if (friend.since) {
    const daysSinceFriend = (Date.now() - new Date(friend.since).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceFriend > 365) strength += 25; // 長期関係
    else if (daysSinceFriend > 90) strength += 15;
  }

  return Math.min(100, Math.max(0, strength));
}

function calculateGuildRelationshipStrength(member: any): number {
  let strength = 20; // ベース

  // ロール数
  if (member.roles) {
    strength += Math.min(20, member.roles.length * 5);
  }

  // 参加期間
  if (member.joined_at) {
    const daysSinceJoin = (Date.now() - new Date(member.joined_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceJoin > 365) strength += 20;
    else if (daysSinceJoin > 90) strength += 10;
  }

  // ニックネーム設定
  if (member.nick) strength += 10;

  return Math.min(100, Math.max(0, strength));
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
  if (relationshipTypes >= 4) healthScore += 5; // 多様な関係性
  else if (relationshipTypes >= 3) healthScore += 3;
  
  // 強い関係性の割合ボーナス
  const strongRelationships = users.filter(u => u.relationshipStrength > 70).length;
  const strongRelationshipRatio = users.length > 0 ? strongRelationships / users.length : 0;
  if (strongRelationshipRatio > 0.3) healthScore += 5; // 30%以上が強い関係
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
function analyzeIsolationRisksExtended(users: UnifiedUser[]) {
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
      // 今後の実装で時系列データから傾向分析
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
) {
  const recommendations = [];

  // 緊急対応が必要な孤立ユーザー
  if (isolated.length > 0) {
    recommendations.push({
      priority: 'critical',
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
        priority: 'high',
        action: 'フレンド・親しい関係者への配慮',
        targets: friendsInHighRisk.map(u => u.name),
        reason: '親しい関係の人が離職リスクを抱えています',
        details: 'プライベートな関係性を考慮し、より慎重で個人的なアプローチが必要です。',
        timeline: '1週間以内'
      });
    }

    if (teammatesInHighRisk.length > 0) {
      recommendations.push({
        priority: 'high',
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
        priority: 'medium',
        action: '頻繁な連絡先との関係性強化',
        targets: frequentContacts.slice(0, 5).map(u => u.name),
        reason: 'よく連絡を取る相手のエンゲージメント低下が見られます',
        details: 'カジュアルな面談やチームビルディング活動を通じて関係性を深めてください。',
        timeline: '2週間以内'
      });
    }

    if (mediumRisk.length > frequentContacts.length) {
      recommendations.push({
        priority: 'medium',
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
      priority: 'low',
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
) {
  const insights = [];

  // 孤立リスクの警告
  if (isolated.length > 0) {
    const isolationRate = (isolated.length / users.length) * 100;
    insights.push({
      type: 'warning',
      title: '孤立リスク警告',
      message: `${isolated.length}人（${isolationRate.toFixed(1)}%）が孤立リスクの高い状態です。`,
      impact: 'high',
      actionRequired: true
    });
  }

  // フレンドの離職リスク
  const friendsAtRisk = users.filter(u => u.relationshipType === 'friend' && u.isolationRisk !== 'low');
  if (friendsAtRisk.length > 0) {
    insights.push({
      type: 'info',
      title: 'フレンド関係者のリスク',
      message: `${friendsAtRisk.length}人のフレンド・親しい関係者が離職リスクを抱えています。`,
      impact: 'medium',
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
        type: 'warning',
        title: `${service.toUpperCase()}での高リスク集中`,
        message: `${service}ユーザーの${highRiskRate.toFixed(1)}%が高リスク状態です。`,
        impact: 'medium',
        actionRequired: true
      });
    }
  });

  // 関係性の多様性分析
  const relationshipTypes = Object.keys(relationshipRiskAnalysis).length;
  if (relationshipTypes <= 2) {
    insights.push({
      type: 'info',
      title: '関係性の多様性不足',
      message: '人間関係の種類が限定的です。より多様な関係性の構築を推奨します。',
      impact: 'low',
      actionRequired: false
    });
  }

  // 強い関係性の割合
  const strongRelationships = users.filter(u => u.relationshipStrength > 70).length;
  const strongRelationshipRate = (strongRelationships / users.length) * 100;
  
  if (strongRelationshipRate < 20) {
    insights.push({
      type: 'warning',
      title: '強い関係性の不足',
      message: `強い人間関係を持つ人が${strongRelationshipRate.toFixed(1)}%と少ない状況です。`,
      impact: 'medium',
      actionRequired: true
    });
  } else if (strongRelationshipRate > 50) {
    insights.push({
      type: 'success',
      title: '良好な関係性',
      message: `${strongRelationshipRate.toFixed(1)}%の人が強い人間関係を築いています。`,
      impact: 'positive',
      actionRequired: false
    });
  }

  return insights;
}