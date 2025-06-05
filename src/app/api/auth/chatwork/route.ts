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

    console.log('生成されたユーザーID:', chatworkUserId);
    console.log('ユーザーメール:', userEmail);

    // まずUserレコードを作成または更新
    console.log('Userレコード作成/更新開始...');
    
    const user = await prisma.user.upsert({
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

    console.log('作成されたUserレコード:', user);

    // Userレコードが存在するか確認
    const existingUser = await prisma.user.findUnique({
      where: { id: chatworkUserId }
    });

    console.log('確認されたUserレコード:', existingUser);

    if (!existingUser) {
      throw new Error(`User not found after creation: ${chatworkUserId}`);
    }

    // 成功時のリダイレクト（Integration作成は一旦スキップ）
    return NextResponse.redirect(
      new URL(`/integrations?debug=user_created&user=${encodeURIComponent(userInfo.name)}&userId=${encodeURIComponent(chatworkUserId)}`, request.url)
    );

  } catch (error) {
    console.error('ChatWork統合エラー:', error);
    return NextResponse.redirect(
      new URL(`/integrations?error=chatwork_integration_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}