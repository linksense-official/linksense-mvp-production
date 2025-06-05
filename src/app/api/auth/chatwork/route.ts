import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  console.log('=== ChatWork統合処理開始 ===');
  
  try {
    const apiToken = process.env.CHATWORK_API_TOKEN;
    
    // ChatWork API呼び出し
    const response = await fetch('https://api.chatwork.com/v2/me', {
      method: 'GET',
      headers: {
        'X-ChatWorkToken': apiToken!,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ChatWork API Error:', errorText);
      return NextResponse.redirect(
        new URL('/integrations?error=chatwork_api_error', request.url)
      );
    }

    const userInfo = await response.json();
    console.log('ChatWork API成功:', userInfo.name);

    // 既存のUserレコードを全て取得して確認
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      },
      take: 5 // 最初の5件のみ
    });

    console.log('既存Userレコード一覧:', allUsers);

    // 最初の既存ユーザーを使用（テスト用）
    let targetUserId = null;
    
    if (allUsers.length > 0) {
      targetUserId = allUsers[0].id;
      console.log('使用するUserID:', targetUserId);
    } else {
      // ユーザーが存在しない場合は、ChatWorkのメールアドレスでユーザーを検索
      const userEmail = userInfo.login_mail;
      if (userEmail) {
        const existingUser = await prisma.user.findUnique({
          where: { email: userEmail }
        });
        
        if (existingUser) {
          targetUserId = existingUser.id;
          console.log('メールアドレスで見つかったUserID:', targetUserId);
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.redirect(
        new URL('/integrations?debug=no_users_found&message=データベースにユーザーが存在しません', request.url)
      );
    }

    // Integrationレコードを作成
    console.log('Integrationレコード作成開始...');
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: targetUserId,
          service: 'chatwork'
        }
      },
      update: {
        accessToken: apiToken!,
        isActive: true,
        teamId: userInfo.organization_id?.toString() || 'unknown',
        teamName: userInfo.organization_name || userInfo.name || 'ChatWork User',
        updatedAt: new Date()
      },
      create: {
        userId: targetUserId,
        service: 'chatwork',
        accessToken: apiToken!,
        isActive: true,
        teamId: userInfo.organization_id?.toString() || 'unknown',
        teamName: userInfo.organization_name || userInfo.name || 'ChatWork User'
      }
    });

    console.log('ChatWork統合完了');
    
    // 成功時のリダイレクト
    return NextResponse.redirect(
      new URL(`/integrations?success=chatwork_connected&user=${encodeURIComponent(userInfo.name)}&service=ChatWork`, request.url)
    );

  } catch (error) {
    console.error('ChatWork統合エラー:', error);
    return NextResponse.redirect(
      new URL(`/integrations?error=chatwork_integration_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}