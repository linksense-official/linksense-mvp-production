// src/app/api/data-integration/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DataNormalizer } from '@/lib/data-integration/normalizer';
import { ServiceDataResponse, UnifiedMessage, UnifiedMeeting, DataIntegrationOptions } from '@/lib/data-integration/types';

const MICROSOFT_GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type') || 'messages'; // 'messages' or 'meetings'
    const options: DataIntegrationOptions = {
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : new Date(),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      includeMetadata: searchParams.get('includeMetadata') === 'true'
    };

    // Teams統合情報取得
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'azure-ad'
      }
    });

    if (!account?.access_token) {
      return NextResponse.json({
        success: false,
        error: 'Microsoft Teams integration not found'
      } as ServiceDataResponse<UnifiedMessage | UnifiedMeeting>);
    }

    if (dataType === 'meetings') {
      return await getTeamsMeetings(account.access_token, options);
    } else {
      return await getTeamsMessages(account.access_token, options);
    }

  } catch (error) {
    console.error('Teams data integration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ServiceDataResponse<UnifiedMessage | UnifiedMeeting>, { status: 500 });
  }
}

// Teams会議データ取得
async function getTeamsMeetings(accessToken: string, options: DataIntegrationOptions): Promise<NextResponse> {
  try {
    // カレンダーイベント取得（Teams会議）
    const startTime = options.dateFrom!.toISOString();
    const endTime = options.dateTo!.toISOString();
    
    const eventsUrl = `${MICROSOFT_GRAPH_API_BASE}/me/calendar/events?$filter=start/dateTime ge '${startTime}' and end/dateTime le '${endTime}'&$top=${options.limit}&$orderby=start/dateTime`;

    const eventsResponse = await fetch(eventsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!eventsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Microsoft Graph API error: ${eventsResponse.status}`
      } as ServiceDataResponse<UnifiedMeeting>);
    }

    const eventsData = await eventsResponse.json();
    const allMeetings: UnifiedMeeting[] = [];

    // Teams会議のみフィルタリング
    if (eventsData.value) {
      for (const event of eventsData.value) {
        try {
          // Teams会議かどうか判定（onlineMeetingがあるか、joinUrlがあるか）
          if (event.onlineMeeting || event.webLink?.includes('teams.microsoft.com')) {
            const normalizedMeeting = DataNormalizer.normalizeTeamsMeeting(event);

            // メタデータ除去オプション対応
            const finalMeeting: UnifiedMeeting = {
              ...normalizedMeeting,
              ...(options.includeMetadata ? { metadata: normalizedMeeting.metadata } : {})
            };

            allMeetings.push(finalMeeting);
          }
        } catch (error) {
          console.error('Teams meeting normalization error:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: allMeetings,
      pagination: {
        hasMore: false,
        totalCount: allMeetings.length
      }
    } as ServiceDataResponse<UnifiedMeeting>);

  } catch (error) {
    console.error('Teams meetings fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ServiceDataResponse<UnifiedMeeting>, { status: 500 });
  }
}

// Teamsメッセージデータ取得
async function getTeamsMessages(accessToken: string, options: DataIntegrationOptions): Promise<NextResponse> {
  try {
    // ユーザーが参加しているTeams取得
    const teamsResponse = await fetch(`${MICROSOFT_GRAPH_API_BASE}/me/joinedTeams`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!teamsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Microsoft Graph API error: ${teamsResponse.status}`
      } as ServiceDataResponse<UnifiedMessage>);
    }

    const teamsData = await teamsResponse.json();
    const allMessages: UnifiedMessage[] = [];

    // 各チームのチャンネルとメッセージを取得
    if (teamsData.value) {
      for (const team of teamsData.value.slice(0, 5)) { // 最初の5チーム
        try {
          // チーム内のチャンネル取得
          const channelsResponse = await fetch(`${MICROSOFT_GRAPH_API_BASE}/teams/${team.id}/channels`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (channelsResponse.ok) {
            const channelsData = await channelsResponse.json();
            
            if (channelsData.value) {
              for (const channel of channelsData.value.slice(0, 10)) { // 最初の10チャンネル
                try {
                  // チャンネル内のメッセージ取得
                  const messagesResponse = await fetch(
                    `${MICROSOFT_GRAPH_API_BASE}/teams/${team.id}/channels/${channel.id}/messages?$top=50`, 
                    {
                      headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                      }
                    }
                  );

                  if (messagesResponse.ok) {
                    const messagesData = await messagesResponse.json();
                    
                    if (messagesData.value) {
                      // メッセージを正規化
                      for (const message of messagesData.value) {
                        try {
                          // 日付フィルタリング
                          const messageDate = new Date(message.createdDateTime);
                          if (options.dateFrom && messageDate < options.dateFrom) continue;
                          if (options.dateTo && messageDate > options.dateTo) continue;

                          const normalizedMessage = DataNormalizer.normalizeTeamsMessage({
                            ...message,
                            teamId: team.id,
                            teamName: team.displayName,
                            channelId: channel.id,
                            channelName: channel.displayName
                          });

                          // メタデータ除去オプション対応
                          const finalMessage: UnifiedMessage = {
                            ...normalizedMessage,
                            ...(options.includeMetadata ? { metadata: normalizedMessage.metadata } : {})
                          };

                          allMessages.push(finalMessage);
                        } catch (error) {
                          console.error('Teams message normalization error:', error);
                        }
                      }
                    }
                  }

                  // レート制限対策
                  await new Promise(resolve => setTimeout(resolve, 200));

                } catch (error) {
                  console.error(`Error fetching messages from channel ${channel.id}:`, error);
                }
              }
            }
          }

          // チーム間の間隔
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          console.error(`Error fetching data from team ${team.id}:`, error);
        }
      }
    }

    // 日付順でソート
    allMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // 制限数まで切り取り
    const limitedMessages = allMessages.slice(0, options.limit);

    return NextResponse.json({
      success: true,
      data: limitedMessages,
      pagination: {
        hasMore: allMessages.length > (options.limit || 100),
        totalCount: allMessages.length
      }
    } as ServiceDataResponse<UnifiedMessage>);

  } catch (error) {
    console.error('Teams messages fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ServiceDataResponse<UnifiedMessage>, { status: 500 });
  }
}