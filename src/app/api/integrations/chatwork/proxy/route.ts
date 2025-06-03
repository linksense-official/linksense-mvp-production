// src/app/api/integrations/chatwork/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const CHATWORK_API_BASE = 'https://api.chatwork.com/v2';

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
    const { endpoint, method = 'GET', headers = {}, body: requestBody } = body;

    // ChatWork APIトークンの取得（環境変数またはユーザー設定から）
    const chatworkToken = process.env.CHATWORK_API_TOKEN || headers['X-ChatWorkToken'];
    
    if (!chatworkToken) {
      return NextResponse.json(
        { success: false, error: 'ChatWork APIトークンが設定されていません' },
        { status: 400 }
      );
    }

    // ChatWork API呼び出し
    const apiUrl = `${CHATWORK_API_BASE}${endpoint}`;
    
    const apiHeaders = {
      'Content-Type': 'application/json',
      'X-ChatWorkToken': chatworkToken,
      ...headers
    };

    console.log(`ChatWork API呼び出し: ${method} ${apiUrl}`);

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
      error: response.ok ? undefined : data?.message || `ChatWork API エラー: ${response.status}`,
      code: response.status.toString(),
      rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
      rateLimitReset: rateLimitReset ? parseInt(rateLimitReset, 10) * 1000 : undefined
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('ChatWork API Proxy エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'サーバーエラー' 
      },
      { status: 500 }
    );
  }
}