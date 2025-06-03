// src/app/api/integrations/google-meet/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const GOOGLE_API_BASE = 'https://www.googleapis.com';

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

    // Google APIトークンの取得
    const googleToken = accessToken || process.env.GOOGLE_ACCESS_TOKEN;
    
    if (!googleToken) {
      return NextResponse.json(
        { success: false, error: 'Google APIトークンが設定されていません' },
        { status: 400 }
      );
    }

    // Google API呼び出し
    const apiUrl = endpoint.startsWith('http') ? endpoint : `${GOOGLE_API_BASE}${endpoint}`;
    
    const apiHeaders = {
      'Authorization': `Bearer ${googleToken}`,
      'Content-Type': 'application/json',
      ...headers
    };

    console.log(`Google Meet API呼び出し: ${method} ${apiUrl}`);

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
      error: response.ok ? undefined : data?.error?.message || `Google Meet API エラー: ${response.status}`,
      code: response.status.toString()
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Google Meet API Proxy エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'サーバーエラー' 
      },
      { status: 500 }
    );
  }
}