// src/app/api/integrations/zoom/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const ZOOM_API_BASE = 'https://api.zoom.us/v2';

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

    // Zoom APIトークンの取得
    const zoomToken = accessToken || process.env.ZOOM_ACCESS_TOKEN;
    
    if (!zoomToken) {
      return NextResponse.json(
        { success: false, error: 'Zoom APIトークンが設定されていません' },
        { status: 400 }
      );
    }

    // Zoom API呼び出し
    const apiUrl = endpoint.startsWith('http') ? endpoint : `${ZOOM_API_BASE}${endpoint}`;
    
    const apiHeaders = {
      'Authorization': `Bearer ${zoomToken}`,
      'Content-Type': 'application/json',
      ...headers
    };

    console.log(`Zoom API呼び出し: ${method} ${apiUrl}`);

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
      error: response.ok ? undefined : data?.message || `Zoom API エラー: ${response.status}`,
      code: response.status.toString()
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Zoom API Proxy エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'サーバーエラー' 
      },
      { status: 500 }
    );
  }
}