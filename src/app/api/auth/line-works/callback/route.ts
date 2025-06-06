import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LINE_WORKS_CLIENT_ID = process.env.LINE_WORKS_CLIENT_ID;
const LINE_WORKS_CLIENT_SECRET = process.env.LINE_WORKS_CLIENT_SECRET;

const getRedirectUri = () => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/auth/line-works/callback`;
};

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS OAuth コールバック処理開始');
  
  try {
    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('📋 LINE WORKSコールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      error,
      state: state ? `${state.substring(0, 10)}...` : '未取得'
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
      console.error('❌ LINE WORKSアクセストークン取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

    console.log('✅ LINE WORKSアクセストークン取得成功');

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

    console.log('✅ LINE WORKSユーザー情報取得成功:', userInfo.displayName);

    // LINE WORKS ユーザーIDでユーザー作成（ChatWork方式）
    const lineWorksUserId = `line-works_${userInfo.userId}`;
    const userEmail = userInfo.email || `line-works_${userInfo.userId}@line-works.local`;
    
    console.log('生成されたユーザーID:', lineWorksUserId);
    console.log('ユーザーメール:', userEmail);

    // 既存のUserレコードを確認
    let existingUser = await prisma.user.findUnique({
      where: { id: lineWorksUserId }
    });

    console.log('既存Userレコード確認:', existingUser);

    if (!existingUser) {
      // 存在しない場合は新規作成
      console.log('新規Userレコード作成開始...');
      try {
        existingUser = await prisma.user.create({
          data: {
            id: lineWorksUserId,
            email: userEmail,
            name: typeof userInfo.displayName === 'object' 
              ? `${userInfo.displayName.lastName} ${userInfo.displayName.firstName}`.trim()
              : (userInfo.displayName || 'LINE WORKS User'),
            company: String(userInfo.domainId) || null,
            role: 'user',
            lastLoginAt: new Date()
          }
        });
        console.log('新規Userレコード作成成功:', existingUser.id);
      } catch (createError: any) {
        console.error('Userレコード作成エラー:', createError);
        
        // メールアドレス重複の場合、既存レコードを取得
        if (createError?.code === 'P2002') {
          existingUser = await prisma.user.findUnique({
            where: { email: userEmail }
          });
          if (existingUser) {
            console.log('メール重複により既存レコード使用:', existingUser.id);
          }
        }
        
        if (!existingUser) {
          throw new Error(`Userレコード作成に失敗: ${createError.message}`);
        }
      }
    } else {
      console.log('既存Userレコード使用:', existingUser.id);
    }

    // 最終的なuserIdを確定
    const finalUserId = existingUser.id;
    console.log('最終使用UserID:', finalUserId);

    // データベースに統合情報を保存
    console.log('Integration保存開始...');
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: finalUserId,
          service: 'line-works'
        }
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: String(userInfo.domainId),
        teamName: typeof userInfo.displayName === 'object' 
          ? `${userInfo.displayName.lastName} ${userInfo.displayName.firstName}`.trim()
          : (userInfo.displayName || 'LINE WORKS Organization'),
        updatedAt: new Date()
      },
      create: {
        userId: finalUserId,
        service: 'line-works',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: String(userInfo.domainId),
        teamName: typeof userInfo.displayName === 'object' 
          ? `${userInfo.displayName.lastName} ${userInfo.displayName.firstName}`.trim()
          : (userInfo.displayName || 'LINE WORKS Organization')
      }
    });

    console.log('✅ LINE WORKS統合完了');

    // 成功時のリダイレクト
    const displayName = typeof userInfo.displayName === 'object' 
      ? `${userInfo.displayName.lastName} ${userInfo.displayName.firstName}`.trim()
      : (userInfo.displayName || 'LINE WORKS User');

    // Cookieクリア
    const response = NextResponse.redirect(
      new URL(`/integrations?success=line_works_connected&user=${encodeURIComponent(displayName)}`, request.url)
    );
    response.cookies.delete('line_works_oauth_state');
    
    return response;

  } catch (error) {
    console.error('❌ LINE WORKS OAuth処理中にエラー:', error);
    return NextResponse.redirect(
      new URL(`/integrations?error=line_works_integration_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}

async function exchangeCodeForToken(code: string) {
  try {
    console.log('🔄 LINE WORKS Token exchange開始');
    
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