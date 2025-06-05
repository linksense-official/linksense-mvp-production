import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  console.log('🔄 ChatWork OAuth コールバック処理開始 (PKCE対応)');
  console.log('📋 Request URL:', request.url);
  
  try {
    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // 全てのパラメータをログ出力
    console.log('📋 全URLパラメータ:', Object.fromEntries(searchParams.entries()));
    console.log('📋 ChatWorkコールバックパラメータ:', { 
      code: code ? `取得済み(${code.substring(0, 10)}...)` : '未取得', 
      state, 
      error,
      errorDescription
    });

    // エラーハンドリング
    if (error) {
      console.error('❌ ChatWork OAuth エラー:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/integrations?error=chatwork_oauth_error&message=${encodeURIComponent(errorDescription || error)}`, request.url)
      );
    }

    if (!code) {
      console.error('❌ 認証コードが見つかりません');
      console.log('❌ 利用可能なパラメータ:', Array.from(searchParams.keys()));
      return NextResponse.redirect(
        new URL('/integrations?error=missing_code&available_params=' + encodeURIComponent(Array.from(searchParams.keys()).join(',')), request.url)
      );
    }

    // Cookieからstate検証とcode_verifier取得
    const storedState = request.cookies.get('chatwork_oauth_state')?.value;
    const codeVerifier = request.cookies.get('chatwork_code_verifier')?.value;

    if (!codeVerifier) {
      console.error('❌ Code verifier not found');
      return NextResponse.redirect(
        new URL('/integrations?error=code_verifier_missing', request.url)
      );
    }

    // State検証
    if (state !== storedState) {
      console.error('❌ State検証失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=state_verification_failed', request.url)
      );
    }

    // アクセストークン取得
    console.log('🔑 ChatWork アクセストークン取得開始 (PKCE)');
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier);
    
    if (!tokenResponse.access_token) {
      console.error('❌ ChatWorkアクセストークン取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

    console.log('✅ ChatWorkアクセストークン取得成功');

    // ユーザー情報取得
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ ChatWorkユーザー情報取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=user_info_failed', request.url)
      );
    }

    // セッション確認
   const session = await getServerSession(authOptions);

let userId: string;

if (session?.user?.id) {
  // 既存のセッションがある場合はそのユーザーIDを使用
  userId = session.user.id;
  console.log('既存セッション使用:', userId);
} else {
  // セッションがない場合はChatWorkユーザーIDを使用
  userId = `chatwork_${userInfo.account_id}`;
  console.log('ChatWorkユーザーID使用:', userId);
  
  // ChatWorkユーザー情報でUserレコードを作成
  const userEmail = userInfo.login_mail || `chatwork_${userInfo.account_id}@chatwork.local`;
  
  await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      name: userInfo.name,
      company: userInfo.organization_name || null,
      lastLoginAt: new Date()
    },
    create: {
      id: userId,
      email: userEmail,
      name: userInfo.name,
      company: userInfo.organization_name || null,
      role: 'user',
      lastLoginAt: new Date()
    }
  });
}

// データベースに統合情報を保存（userIdを使用）
await prisma.integration.upsert({
  where: {
    userId_service: {
      userId: userId,  // 動的に決定されたuserIdを使用
      service: 'chatwork'
    }
  },
  update: {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || null,
    isActive: true,
    teamId: userInfo.organization_id?.toString() || 'unknown',
    teamName: userInfo.organization_name || userInfo.name || 'ChatWork User',
    updatedAt: new Date()
  },
  create: {
    userId: userId,  // 動的に決定されたuserIdを使用
    service: 'chatwork',
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || null,
    isActive: true,
    teamId: userInfo.organization_id?.toString() || 'unknown',
    teamName: userInfo.organization_name || userInfo.name || 'ChatWork User'
  }
});

    console.log('✅ ChatWork統合完了');

    // Cookieクリア
    const response = NextResponse.redirect(
      new URL(`/integrations?success=chatwork_connected&user=${encodeURIComponent(userInfo.name)}`, request.url)
    );
    response.cookies.delete('chatwork_oauth_state');
    response.cookies.delete('chatwork_code_verifier');

    return response;

  } catch (error) {
    console.error('❌ ChatWork OAuth処理中にエラー:', error);
    return NextResponse.redirect(
      new URL(`/integrations?error=chatwork_integration_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}

async function exchangeCodeForToken(code: string, codeVerifier: string) {
  try {
    const clientId = process.env.CHATWORK_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/chatwork/callback`;
    
    console.log('🔄 ChatWork Token exchange開始 (PKCE)');
    
    const response = await fetch('https://oauth.chatwork.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📋 ChatWork Token exchange成功');
    
    return data;
  } catch (error) {
    console.error('❌ ChatWork Token exchange エラー:', error);
    return { error: error instanceof Error ? error.message : 'token_exchange_failed' };
  }
}

async function getUserInfo(accessToken: string) {
  try {
    console.log('🔄 ChatWork ユーザー情報取得開始');
    
    const response = await fetch('https://api.chatwork.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const userInfo = await response.json();
    console.log('📋 ChatWork ユーザー情報取得成功');
    
    return userInfo;
  } catch (error) {
    console.error('❌ ChatWork ユーザー情報取得エラー:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}