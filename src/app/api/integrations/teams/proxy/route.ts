// src/app/api/integrations/teams/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const TEAMS_API_BASE = 'https://graph.microsoft.com/v1.0';

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

    // Microsoft Graph APIトークンの取得
    const teamsToken = accessToken || process.env.TEAMS_ACCESS_TOKEN;
    
    if (!teamsToken) {
      return NextResponse.json(
        { success: false, error: 'Microsoft Teams APIトークンが設定されていません' },
        { status: 400 }
      );
    }

    // Microsoft Graph API呼び出し
    const apiUrl = endpoint.startsWith('http') ? endpoint : `${TEAMS_API_BASE}${endpoint}`;
    
    const apiHeaders = {
      'Authorization': `Bearer ${teamsToken}`,
      'Content-Type': 'application/json',
      ...headers
    };

    console.log(`Microsoft Teams API呼び出し: ${method} ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method,
      headers: apiHeaders,
      body: requestBody ? JSON.stringify(requestBody) : undefined
    });

    let data;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    const result = {
      success: response.ok,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data?.error?.message || `Microsoft Teams API エラー: ${response.status}`,
      code: response.status.toString()
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Microsoft Teams API Proxy エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'サーバーエラー' 
      },
      { status: 500 }
    );
  }
}