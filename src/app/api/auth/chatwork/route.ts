import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiToken = process.env.CHATWORK_API_TOKEN;
    
    if (!apiToken) {
      return NextResponse.json({ error: 'ChatWork API token not configured' }, { status: 500 });
    }

    console.log('ChatWork API接続テスト開始');

    // ChatWork APIでユーザー情報を取得
    const response = await fetch('https://api.chatwork.com/v2/me', {
      headers: {
        'X-ChatWorkToken': apiToken
      }
    });

    if (!response.ok) {
      throw new Error(`ChatWork API Error: ${response.status}`);
    }

    const userInfo = await response.json();
    console.log('ChatWork API接続成功:', userInfo);
    
    // 統合ページに成功メッセージと共にリダイレクト
    return NextResponse.redirect(
      new URL(`/integrations?success=chatwork_connected&user=${encodeURIComponent(userInfo.name)}`, request.url)
    );

  } catch (error) {
    console.error('ChatWork API接続エラー:', error);
    return NextResponse.redirect(
      new URL('/integrations?error=chatwork_connection_failed', request.url)
    );
  }
}