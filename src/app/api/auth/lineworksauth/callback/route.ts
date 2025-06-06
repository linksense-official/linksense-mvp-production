import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS OAuth コールバック処理開始');
  
  try {
    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('📋 LINE WORKSコールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      state, 
      error 
    });

    // エラーハンドリング
    if (error) {
      console.error('❌ LINE WORKS OAuth エラー:', error);
      return NextResponse.redirect(
        new URL(`/integrations?error=line_works_oauth_error&message=${error}`, request.url)
      );
    }

    if (!code) {
      console.error('❌ 認証コードが見つかりません');
      return NextResponse.redirect(
        new URL('/integrations?error=missing_code', request.url)
      );
    }

    // アクセストークン取得
    console.log('🔑 LINE WORKS アクセストークン取得開始');
    const tokenResponse = await exchangeCodeForToken(code);
    
    console.log('🔑 トークンレスポンス確認:', {
      hasAccessToken: !!tokenResponse.access_token,
      hasError: !!tokenResponse.error,
      tokenStart: tokenResponse.access_token ? tokenResponse.access_token.substring(0, 10) + '...' : 'なし'
    });
    
    if (!tokenResponse.access_token) {
      console.error('❌ LINE WORKSアクセストークン取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

    console.log('✅ LINE WORKSアクセストークン取得成功');

    // ユーザー情報取得
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    console.log('👤 ユーザー情報確認:', {
      userInfo: userInfo ? 'あり' : 'なし',
      displayName: userInfo?.displayName,
      userId: userInfo?.userId,
      email: userInfo?.email
    });
    
    if (!userInfo) {
      console.error('❌ LINE WORKSユーザー情報取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=user_info_failed', request.url)
      );
    }

    // 一時的にユーザー名を固定して確認
    const testUserName = userInfo.displayName || userInfo.name || userInfo.userName || 'LINE_WORKS_USER';
    console.log('👤 最終ユーザー名:', testUserName);

    return NextResponse.redirect(
      new URL(`/integrations?success=line_works_connected&user=${encodeURIComponent(testUserName)}&debug=user_info_success`, request.url)
    );

  } catch (error) {
    console.error('❌ LINE WORKS OAuth処理中にエラー:', error);
    return NextResponse.redirect(
      new URL(`/integrations?error=line_works_integration_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}
async function exchangeCodeForToken(code: string) {
  try {
    const clientId = process.env.LINE_WORKS_CLIENT_ID;
    const clientSecret = process.env.LINE_WORKS_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/lineworksauth/callback`;
    
    console.log('🔄 LINE WORKS Token exchange開始');
    
    const response = await fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange error:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📋 LINE WORKS Token exchange成功');
    
    return data;
  } catch (error) {
    console.error('❌ LINE WORKS Token exchange エラー:', error);
    return { error: error instanceof Error ? error.message : 'token_exchange_failed' };
  }
}

async function getUserInfo(accessToken: string) {
  try {
    console.log('🔄 LINE WORKS ユーザー情報取得開始');
    console.log('🔑 使用アクセストークン:', accessToken ? `${accessToken.substring(0, 10)}...` : 'なし');
    
    const response = await fetch('https://www.worksapis.com/v1.0/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 LINE WORKS API レスポンス:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LINE WORKS API エラーレスポンス:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const userInfo = await response.json();
    console.log('📋 LINE WORKS ユーザー情報 RAWデータ:', JSON.stringify(userInfo, null, 2));
    console.log('📋 重要フィールド確認:', {
      displayName: userInfo.displayName,
      userId: userInfo.userId,
      email: userInfo.email,
      userName: userInfo.userName,
      name: userInfo.name
    });
    
    return userInfo;
  } catch (error) {
    console.error('❌ LINE WORKS ユーザー情報取得エラー:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}