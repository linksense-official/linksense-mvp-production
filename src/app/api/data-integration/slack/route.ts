// src/app/api/data-integration/slack/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DataNormalizer } from '@/lib/data-integration/normalizer';
import { ServiceDataResponse, UnifiedMessage, DataIntegrationOptions } from '@/lib/data-integration/types';

const SLACK_API_BASE = 'https://slack.com/api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const options: DataIntegrationOptions = {
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      cursor: searchParams.get('cursor') || undefined,
      includeMetadata: searchParams.get('includeMetadata') === 'true',
      channels: searchParams.get('channels')?.split(',') || undefined
    };

    // Slack統合情報取得
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'slack'
      }
    });

    if (!account?.access_token) {
      return NextResponse.json({
        success: false,
        error: 'Slack integration not found'
      } as ServiceDataResponse<UnifiedMessage>);
    }

    // Slackチャンネル一覧取得
    const channelsResponse = await fetch(`${SLACK_API_BASE}/conversations.list?limit=200`, {
      headers: {
        'Authorization': `Bearer ${account.access_token}`
      }
    });

    if (!channelsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Slack API error: ${channelsResponse.status}`
      } as ServiceDataResponse<UnifiedMessage>);
    }

    const channelsData = await channelsResponse.json();
    if (!channelsData.ok) {
      return NextResponse.json({
        success: false,
        error: channelsData.error || 'Slack API error'
      } as ServiceDataResponse<UnifiedMessage>);
    }

    const allMessages: UnifiedMessage[] = [];
    let hasMore = false;
    let nextCursor: string | undefined;

    // チャンネルフィルタリング
    const targetChannels = options.channels 
      ? channelsData.channels.filter((ch: any) => options.channels!.includes(ch.id))
      : channelsData.channels.slice(0, 20); // 最初の20チャンネル

    // 各チャンネルのメッセージ取得
    for (const channel of targetChannels) {
      try {
        const oldest = options.dateFrom ? Math.floor(options.dateFrom.getTime() / 1000) : undefined;
        const latest = options.dateTo ? Math.floor(options.dateTo.getTime() / 1000) : undefined;
        
        let messagesUrl = `${SLACK_API_BASE}/conversations.history?channel=${channel.id}&limit=100`;
        if (oldest) messagesUrl += `&oldest=${oldest}`;
        if (latest) messagesUrl += `&latest=${latest}`;
        if (options.cursor) messagesUrl += `&cursor=${options.cursor}`;

        const messagesResponse = await fetch(messagesUrl, {
          headers: {
            'Authorization': `Bearer ${account.access_token}`
          }
        });

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          
          if (messagesData.ok && messagesData.messages) {
           // メッセージを正規化
for (const message of messagesData.messages) {
  try {
    const normalizedMessage = DataNormalizer.normalizeSlackMessage({
      ...message,
      channel: channel.id,
      channel_name: channel.name
    });

    // メタデータ除去オプション対応
    const finalMessage: UnifiedMessage = {
      ...normalizedMessage,
      ...(options.includeMetadata ? { metadata: normalizedMessage.metadata } : {})
    };

    allMessages.push(finalMessage);
  } catch (error) {
    console.error('Slack message normalization error:', error);
  }
}
            // ページネーション情報更新
            if (messagesData.has_more) {
              hasMore = true;
              nextCursor = messagesData.response_metadata?.next_cursor;
            }
          }
        }

        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error fetching messages from channel ${channel.id}:`, error);
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
        hasMore: hasMore || allMessages.length > (options.limit || 100),
        nextCursor: nextCursor,
        totalCount: allMessages.length
      }
    } as ServiceDataResponse<UnifiedMessage>);

  } catch (error) {
    console.error('Slack data integration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ServiceDataResponse<UnifiedMessage>, { status: 500 });
  }
}