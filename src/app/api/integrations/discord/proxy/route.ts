// src/app/api/integrations/discord/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export async function POST(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint, method = 'GET', headers = {}, body: requestBody, accessToken } = body;

    // Discord APIトークンの取得
    const discordToken = accessToken || process.env.DISCORD_BOT_TOKEN;
    
    if (!discordToken) {
      return NextResponse.json(
        { success: false, error: 'Discord APIトークンが設定されていません' },
        { status: 400 }
      );
    }

    // Discord API呼び出し
    const apiUrl = endpoint.startsWith('http') ? endpoint : `${DISCORD_API_BASE}${endpoint}`;
    
    const apiHeaders = {
      'Authorization': `Bot ${discordToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'LinkSense (https://linksense-mvp.vercel.app, 1.0)',
      ...headers
    };

    console.log(`Discord API呼び出し: ${method} ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method,
      headers: apiHeaders,
      body: requestBody ? JSON.stringify(requestBody) : undefined
    });

    // レート制限情報取得
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');

    let data;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    const result = {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data?.message || `Discord API エラー: ${response.status}`,
      code: response.status.toString(),
      rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
      rateLimitReset: rateLimitReset ? parseInt(rateLimitReset, 10) * 1000 : undefined
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Discord API Proxy エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'サーバーエラー' 
      },
      { status: 500 }
    );
  }
}