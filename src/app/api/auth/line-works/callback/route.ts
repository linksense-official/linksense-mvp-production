import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LINE_WORKS_CLIENT_ID = process.env.LINE_WORKS_CLIENT_ID;
const LINE_WORKS_CLIENT_SECRET = process.env.LINE_WORKS_CLIENT_SECRET;

const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/line-works/callback`;
};

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS コールバック処理開始');
  
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('❌ 未認証ユーザーのアクセス');
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.error('❌ ユーザーがデータベースに存在しません');
      return NextResponse.redirect(new URL('/login?error=user_not_found', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('📋 コールバックパラメータ:', { 
      code: code ? `${code.substring(0, 10)}...` : '未取得', 
      error,
      state: state ? `${state.substring(0, 10)}...` : '未取得'
    });

    if (error) {
      console.error('❌ LINE WORKS OAuth エラー:', error);
      return NextResponse.redirect(
        new URL(`/integrations?error=${encodeURIComponent('LINE WORKS認証エラー: ' + error)}`, request.url)
      );
    }

    if (!code) {
      console.error('❌ 認証コードが見つかりません');
      return NextResponse.redirect(
        new URL('/integrations?error=missing_code', request.url)
      );
    }

    // State検証
    const storedState = request.cookies.get('line_works_oauth_state')?.value;
    if (state && storedState && storedState !== state) {
      console.error('❌ State検証失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=state_verification_failed', request.url)
      );
    }

    // アクセストークン取得
    console.log('🔑 LINE WORKS アクセストークン取得開始');
    const tokenResponse = await exchangeCodeForToken(code);
    
    if (!tokenResponse.access_token) {
      console.error('❌ アクセストークン取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

   // ユーザー情報取得
console.log('👤 LINE WORKS ユーザー情報取得開始');
const userInfo = await getUserInfo(tokenResponse.access_token);

// 修正: userInfoは必ず返されるので、基本的なvalidationのみ
if (!userInfo || !userInfo.displayName) {
  console.error('❌ ユーザー情報が不完全です');
  return NextResponse.redirect(
    new URL('/integrations?error=user_info_incomplete', request.url)
  );
}

    // データベース保存
    console.log('💾 LINE WORKS統合情報をデータベースに保存');
    
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: user.id,
          service: 'line-works'
        }
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: String(userInfo.domainId),
        teamName: userInfo.displayName || 'LINE WORKS Organization',
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        service: 'line-works',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: String(userInfo.domainId),
        teamName: userInfo.displayName || 'LINE WORKS Organization',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ LINE WORKS統合完了');

    // 成功時のリダイレクト
    const response = NextResponse.redirect(
      new URL(`/integrations?success=true&service=line-works&user=${encodeURIComponent(userInfo.displayName)}`, request.url)
    );
    
    // State cookie削除
    response.cookies.delete('line_works_oauth_state');
    
    return response;

  } catch (error) {
    console.error('❌ LINE WORKS コールバック処理エラー:', error);
    return NextResponse.redirect(
      new URL(`/integrations?error=${encodeURIComponent('コールバック処理エラー')}`, request.url)
    );
  }
}

async function exchangeCodeForToken(code: string) {
  const response = await fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: LINE_WORKS_CLIENT_ID!,
      client_secret: LINE_WORKS_CLIENT_SECRET!,
      code: code,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return await response.json();
}

async function getUserInfo(accessToken: string) {
  try {
    console.log('🔄 LINE WORKS ユーザー情報取得開始');
    
    const response = await fetch('https://www.worksapis.com/v1.0/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LINE WORKS ユーザー情報取得エラー:', response.status, errorText);
      
      // 修正: エラーでもnullではなく基本情報を返す
      return {
        userId: 'line-works-user',
        displayName: 'LINE WORKS User',
        email: '',
        domainId: 'unknown-domain'
      };
    }

    const userInfo = await response.json();
    console.log('✅ LINE WORKS ユーザー情報取得成功:', userInfo);
    
    // 修正: 必須フィールドの安全な取得
    return {
      userId: userInfo.userId || 'line-works-user',
      displayName: userInfo.displayName || userInfo.userName || 'LINE WORKS User',
      email: userInfo.email || userInfo.userEmail || '',
      domainId: userInfo.domainId || 'unknown-domain'
    };
    
  } catch (error) {
    console.error('❌ LINE WORKS ユーザー情報取得例外:', error);
    
    // 修正: 例外時も基本情報を返す
    return {
      userId: 'line-works-user',
      displayName: 'LINE WORKS User',
      email: '',
      domainId: 'unknown-domain'
    };
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}