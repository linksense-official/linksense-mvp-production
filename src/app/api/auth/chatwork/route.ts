import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  console.log('=== ChatWork統合処理開始 ===');
  
  try {
    const apiToken = process.env.CHATWORK_API_TOKEN;
    
    // ChatWork API呼び出し
    console.log('ChatWork API呼び出し中...');
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

    // ChatWorkユーザーIDを使って固有のユーザーIDを生成
    const chatworkUserId = `chatwork_${userInfo.account_id}`;
    const userEmail = userInfo.login_mail || `chatwork_${userInfo.account_id}@chatwork.local`;

    // まずUserレコードを作成または更新
    console.log('Userレコード作成/更新開始...');
    await prisma.user.upsert({
      where: {
        email: userEmail
      },
      update: {
        name: userInfo.name,
        company: userInfo.organization_name || null,
        lastLoginAt: new Date()
      },
      create: {
        id: chatworkUserId,
        email: userEmail,
        name: userInfo.name,
        company: userInfo.organization_name || null,
        role: 'user',
        lastLoginAt: new Date()
      }
    });

    // 次にIntegrationレコードを作成または更新
    console.log('Integrationレコード作成/更新開始...');
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: chatworkUserId,
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
        userId: chatworkUserId,
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