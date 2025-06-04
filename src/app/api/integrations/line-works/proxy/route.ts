// src/app/api/integrations/line-works/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const LINE_WORKS_API_BASE = 'https://www.worksapis.com/v1.0';

export async function POST(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint, method = 'GET', headers = {}, body: requestBody, accessToken } = body;

    // LINE WORKS APIトークンの取得
    const lineWorksToken = accessToken || process.env.LINE_WORKS_ACCESS_TOKEN;
    
    if (!lineWorksToken) {
      return NextResponse.json(
        { success: false, error: 'LINE WORKS APIトークンが設定されていません' },
        { status: 400 }
      );
    }

    // LINE WORKS API呼び出し
    const apiUrl = endpoint.startsWith('http') ? endpoint : `${LINE_WORKS_API_BASE}${endpoint}`;
    
    const apiHeaders = {
      'Authorization': `Bearer ${lineWorksToken}`,
      'Content-Type': 'application/json',
      ...headers
    };

    console.log(`LINE WORKS API呼び出し: ${method} ${apiUrl}`);

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
      error: response.ok ? undefined : data?.message || `LINE WORKS API エラー: ${response.status}`,
      code: response.status.toString()
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('LINE WORKS API Proxy エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'サーバーエラー' 
      },
      { status: 500 }
    );
  }
}