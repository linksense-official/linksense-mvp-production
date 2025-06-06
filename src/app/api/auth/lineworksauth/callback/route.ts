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
    
    if (!tokenResponse.access_token) {
      console.error('❌ LINE WORKSアクセストークン取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=token_exchange_failed', request.url)
      );
    }

    console.log('✅ LINE WORKSアクセストークン取得成功');

    // ユーザー情報取得
    const userInfo = await getUserInfo(tokenResponse.access_token);
    
    if (!userInfo) {
      console.error('❌ LINE WORKSユーザー情報取得失敗');
      return NextResponse.redirect(
        new URL('/integrations?error=user_info_failed', request.url)
      );
    }

     console.log('✅ LINE WORKSユーザー情報取得成功:', userInfo.displayName);

    // LINE WORKSユーザーIDでユーザー作成
    const lineWorksUserId = `line-works_${userInfo.userId}`;
    const userEmail = userInfo.email || `line-works_${userInfo.userId}@lineworks.local`;
    
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
            name: userInfo.displayName,
            company: userInfo.domainName || null,
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
          service: 'lineworks'
        }
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: userInfo.domainId?.toString() || 'unknown',
        teamName: userInfo.domainName || userInfo.displayName || 'LINE WORKS User',
        updatedAt: new Date()
      },
      create: {
        userId: finalUserId,
        service: 'lineworks',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        isActive: true,
        teamId: userInfo.domainId?.toString() || 'unknown',
        teamName: userInfo.domainName || userInfo.displayName || 'LINE WORKS User'
      }
    });

    console.log('✅ LINE WORKS統合完了');

    // Cookieクリア
    const response = NextResponse.redirect(
      new URL(`/integrations?success=line_works_connected&user=${encodeURIComponent(userInfo.displayName)}`, request.url)
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
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ LINE WORKS API エラーレスポンス:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const userInfo = await response.json();
    console.log('📋 LINE WORKS ユーザー情報取得成功 - RAWデータ:', JSON.stringify(userInfo, null, 2));
    console.log('📋 重要フィールド確認:', {
      displayName: userInfo.displayName,
      userId: userInfo.userId,
      email: userInfo.email,
      domainName: userInfo.domainName,
      domainId: userInfo.domainId,
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