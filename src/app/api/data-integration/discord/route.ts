// src/app/api/data-integration/discord/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { DataNormalizer } from '@/lib/data-integration/normalizer';
import { ServiceDataResponse, UnifiedMessage, DataIntegrationOptions } from '@/lib/data-integration/types';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

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

    // Discord統合情報取得
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'discord'
      }
    });

    if (!account?.access_token) {
      return NextResponse.json({
        success: false,
        error: 'Discord integration not found'
      } as ServiceDataResponse<UnifiedMessage>);
    }

    // Discord APIでギルド一覧取得
    const guildsResponse = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
      headers: {
        'Authorization': `Bearer ${account.access_token}`
      }
    });

    if (!guildsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Discord API error: ${guildsResponse.status}`
      } as ServiceDataResponse<UnifiedMessage>);
    }

    const guilds = await guildsResponse.json();
    const allMessages: UnifiedMessage[] = [];

    // 各ギルドのチャンネルとメッセージを取得
    for (const guild of guilds.slice(0, 5)) { // 最初の5ギルド
      try {
        // ギルドのチャンネル取得
        const channelsResponse = await fetch(`${DISCORD_API_BASE}/guilds/${guild.id}/channels`, {
          headers: {
            'Authorization': `Bearer ${account.access_token}`
          }
        });

        if (channelsResponse.ok) {
          const channels = await channelsResponse.json();
          
          // テキストチャンネルのみフィルタリング
          const textChannels = channels.filter((ch: any) => ch.type === 0);

          for (const channel of textChannels.slice(0, 10)) { // 最初の10チャンネル
            try {
              let messagesUrl = `${DISCORD_API_BASE}/channels/${channel.id}/messages?limit=50`;

              const messagesResponse = await fetch(messagesUrl, {
                headers: {
                  'Authorization': `Bearer ${account.access_token}`
                }
              });

              if (messagesResponse.ok) {
                const messages = await messagesResponse.json();
                
                // メッセージを正規化
                for (const message of messages) {
                  try {
                    // 日付フィルタリング
                    const messageDate = new Date(message.timestamp);
                    if (options.dateFrom && messageDate < options.dateFrom) continue;
                    if (options.dateTo && messageDate > options.dateTo) continue;

                    const normalizedMessage = DataNormalizer.normalizeDiscordMessage({
                      ...message,
                      channel_id: channel.id,
                      channel_name: channel.name,
                      guild_id: guild.id
                    });

                    // メタデータ除去オプション対応
                    const finalMessage: UnifiedMessage = {
                      ...normalizedMessage,
                      ...(options.includeMetadata ? { metadata: normalizedMessage.metadata } : {})
                    };

                    allMessages.push(finalMessage);
                  } catch (error) {
                    console.error('Discord message normalization error:', error);
                  }
                }
              }

              // レート制限対策
              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
              console.error(`Error fetching messages from channel ${channel.id}:`, error);
            }
          }
        }

        // ギルド間の間隔
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error fetching data from guild ${guild.id}:`, error);
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
    console.error('Discord data integration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ServiceDataResponse<UnifiedMessage>, { status: 500 });
  }
}