// src/app/api/data-integration/chatwork/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DataNormalizer } from '@/lib/data-integration/normalizer';
import { ServiceDataResponse, UnifiedMessage, DataIntegrationOptions } from '@/lib/data-integration/types';

const CHATWORK_API_BASE = 'https://api.chatwork.com/v2';

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

    // ChatWork統合情報取得
    const integration = await prisma.integration.findFirst({
      where: {
        userId: session.user.id,
        service: 'chatwork',
        isActive: true
      }
    });

    if (!integration) {
      return NextResponse.json({
        success: false,
        error: 'ChatWork integration not found'
      } as ServiceDataResponse<UnifiedMessage>);
    }

    // ChatWork APIでルーム一覧取得
    const roomsResponse = await fetch(`${CHATWORK_API_BASE}/rooms`, {
      headers: {
  'X-ChatWorkToken': integration.accessToken!  // non-null assertion追加
}
    });

    if (!roomsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `ChatWork API error: ${roomsResponse.status}`,
        rateLimit: {
          remaining: parseInt(roomsResponse.headers.get('X-RateLimit-Remaining') || '0'),
          resetTime: new Date(parseInt(roomsResponse.headers.get('X-RateLimit-Reset') || '0') * 1000)
        }
      } as ServiceDataResponse<UnifiedMessage>);
    }

    const rooms = await roomsResponse.json();
    const allMessages: UnifiedMessage[] = [];

    // 各ルームのメッセージを取得
for (const room of rooms.slice(0, 10)) { // 最初の10ルームのみ（レート制限対策）
  try {
    const messagesResponse = await fetch(
      `${CHATWORK_API_BASE}/rooms/${room.room_id}/messages?force=1`, 
      {
        headers: {
          'X-ChatWorkToken': integration.accessToken! // ← ここに ! を追加
        }
      }
    );

    if (messagesResponse.ok) {
      const messages = await messagesResponse.json();
      
      // メッセージを正規化して追加
      for (const message of messages) {
        try {
          // 日付フィルタリング
          const messageDate = new Date(message.send_time * 1000);
          if (options.dateFrom && messageDate < options.dateFrom) continue;
          if (options.dateTo && messageDate > options.dateTo) continue;

          const normalizedMessage = DataNormalizer.normalizeChatWorkMessage({
            ...message,
            room_id: room.room_id,
            room_name: room.name
          });

          // メタデータ除去オプション対応
          const finalMessage: UnifiedMessage = {
            ...normalizedMessage,
            ...(options.includeMetadata ? { metadata: normalizedMessage.metadata } : {})
          };

          allMessages.push(finalMessage);
        } catch (error) {
          console.error('ChatWork message normalization error:', error);
        }
      }
    }

    // レート制限対策：リクエスト間隔を空ける
    await new Promise(resolve => setTimeout(resolve, 100));

  } catch (error) {
    console.error(`Error fetching messages from room ${room.room_id}:`, error);
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
    console.error('ChatWork data integration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ServiceDataResponse<UnifiedMessage>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, roomId, message } = body;

    // ChatWork統合情報取得
    const integration = await prisma.integration.findFirst({
      where: {
        userId: session.user.id,
        service: 'chatwork',
        isActive: true
      }
    });

    if (!integration) {
      return NextResponse.json({
        success: false,
        error: 'ChatWork integration not found'
      });
    }

    // アクション別処理
    switch (action) {
      case 'send_message':
        const response = await fetch(`${CHATWORK_API_BASE}/rooms/${roomId}/messages`, {
  method: 'POST',
  headers: {
    'X-ChatWorkToken': integration.accessToken!, // ← ここにも ! を追加
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: `body=${encodeURIComponent(message)}`
});

        const result = await response.json();
        return NextResponse.json({
          success: response.ok,
          data: result
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Unsupported action'
        });
    }

  } catch (error) {
    console.error('ChatWork action error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}