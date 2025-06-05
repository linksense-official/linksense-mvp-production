// src/app/api/data-integration/line-works/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DataNormalizer } from '@/lib/data-integration/normalizer';
import { ServiceDataResponse, UnifiedMessage, DataIntegrationOptions } from '@/lib/data-integration/types';

const LINE_WORKS_API_BASE = 'https://www.worksapis.com/v1.0';

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
      includeMetadata: searchParams.get('includeMetadata') === 'true'
    };

    // LINE WORKS統合情報取得
    const integration = await prisma.integration.findFirst({
      where: {
        userId: session.user.id,
        service: 'line-works',
        isActive: true
      }
    });

    if (!integration) {
      return NextResponse.json({
        success: false,
        error: 'LINE WORKS integration not found'
      } as ServiceDataResponse<UnifiedMessage>);
    }

    // LINE WORKS APIでチャンネル一覧取得
    const channelsResponse = await fetch(`${LINE_WORKS_API_BASE}/channels`, {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`
      }
    });

    if (!channelsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `LINE WORKS API error: ${channelsResponse.status}`
      } as ServiceDataResponse<UnifiedMessage>);
    }

    const channelsData = await channelsResponse.json();
    const allMessages: UnifiedMessage[] = [];

    // 各チャンネルのメッセージを取得
    if (channelsData.channels) {
      for (const channel of channelsData.channels.slice(0, 10)) { // 最初の10チャンネル
        try {
          let messagesUrl = `${LINE_WORKS_API_BASE}/channels/${channel.channelId}/messages?limit=100`;
          
          // 日付フィルタリング
          if (options.dateFrom) {
            messagesUrl += `&since=${options.dateFrom.toISOString()}`;
          }
          if (options.dateTo) {
            messagesUrl += `&until=${options.dateTo.toISOString()}`;
          }

          const messagesResponse = await fetch(messagesUrl, {
            headers: {
              'Authorization': `Bearer ${integration.accessToken}`
            }
          });

          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            
            if (messagesData.messages) {
              // メッセージを正規化
              for (const message of messagesData.messages) {
                try {
                  const normalizedMessage = DataNormalizer.normalizeLineWorksMessage({
                    ...message,
                    channelId: channel.channelId,
                    channelName: channel.name
                  });

                  // メタデータ除去オプション対応
                  const finalMessage: UnifiedMessage = {
                    ...normalizedMessage,
                    ...(options.includeMetadata ? { metadata: normalizedMessage.metadata } : {})
                  };

                  allMessages.push(finalMessage);
                } catch (error) {
                  console.error('LINE WORKS message normalization error:', error);
                }
              }
            }
          }

          // レート制限対策
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`Error fetching messages from channel ${channel.channelId}:`, error);
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
    console.error('LINE WORKS data integration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ServiceDataResponse<UnifiedMessage>, { status: 500 });
  }
}