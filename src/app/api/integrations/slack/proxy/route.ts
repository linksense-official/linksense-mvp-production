// src/app/api/integrations/slack/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const SLACK_API_BASE = 'https://slack.com/api';

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
    const { endpoint, method = 'POST', headers = {}, body: requestBody, accessToken } = body;

    // Slack APIトークンの取得
    const slackToken = accessToken || process.env.SLACK_BOT_TOKEN;
    
    if (!slackToken) {
      return NextResponse.json(
        { success: false, error: 'Slack APIトークンが設定されていません' },
        { status: 400 }
      );
    }

    // Slack API呼び出し
    const apiUrl = endpoint.startsWith('http') ? endpoint : `${SLACK_API_BASE}/${endpoint}`;
    
    const apiHeaders = {
      'Authorization': `Bearer ${slackToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers
    };

    console.log(`Slack API呼び出し: ${method} ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method,
      headers: apiHeaders,
      body: requestBody
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Slack API HTTP エラー: ${response.status}`
      });
    }

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({
        success: false,
        error: data.error || 'Slack API エラー'
      });
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Slack API Proxy エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'サーバーエラー' 
      },
      { status: 500 }
    );
  }
}