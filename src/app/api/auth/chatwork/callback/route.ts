import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  console.log('🔄 ChatWork OAuth コールバック処理開始');
  
  try {
    // URLパラメータ取得
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('📋 ChatWorkコールバックパラメータ:', { 
      code: code ? '取得済み' : '未取得', 
      state, 
      error 
    });

    // エラーハンドリング
    if (error) {
      console.error('❌ ChatWork OAuth エラー:', error);
      return NextResponse.redirect(
        new URL(`/integrations?error=chatwork_oauth_error&message=${error}`, request.url)
      );
    }

    if (!code) {
      console.error('❌ 認証コードが見つかりません');
      return NextResponse.redirect(
        new URL('/integrations?error=missing_code', request.url)
      );
    }

    // Cookieからcode_verifier取得
    const codeVerifier = request.cookies.get('chatwork_code_verifier')?.value;

    if (!codeVerifier) {
      console.error('❌ Code verifier not found');
      return NextResponse.redirect(
        new URL('/integrations?error=code_verifier_missing', request.url)
      );
    }

    // アクセストークン取得
    console.log('🔑 ChatWork アクセストークン取得開始');
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

     console.log('✅ ChatWorkユーザー情報取得成功:', userInfo.name);

    // ChatWorkユーザーIDでユーザー作成
    const chatworkUserId = `chatwork_${userInfo.account_id}`;
    const userEmail = userInfo.login_mail || `chatwork_${userInfo.account_id}@chatwork.local`;
    
    console.log('生成されたユーザーID:', chatworkUserId);
    console.log('ユーザーメール:', userEmail);

    // 既存のUserレコードを確認
    let existingUser = await prisma.user.findUnique({
      where: { id: chatworkUserId }
    });

    console.log('既存Userレコード確認:', existingUser);

    if (!existingUser) {
      // 存在しない場合は新規作成
      console.log('新規Userレコード作成開始...');
      try {
        existingUser = await prisma.user.create({
          data: {
            id: chatworkUserId,
            email: userEmail,
            name: userInfo.name,
            company: userInfo.organization_name || null,
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
          userId: finalUserId,  // 確実に存在するuserIdを使用
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
        userId: finalUserId,  // 確実に存在するuserIdを使用
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
    
    console.log('🔄 ChatWork Token exchange開始');
    
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
      const errorText = await response.text();
      console.error('Token exchange error:', errorText);
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