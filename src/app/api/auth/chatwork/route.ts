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

    // まず既存のUserレコードをチェック
    let existingUser = await prisma.user.findUnique({
      where: { id: chatworkUserId }
    });

    console.log('既存Userレコード:', existingUser);

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
        console.log('新規Userレコード作成成功:', existingUser);
      } catch (createError: any) {
        console.error('Userレコード作成エラー:', createError);
        
        // メールアドレスの重複エラーの場合、IDで再検索
        if (createError?.code === 'P2002') {
          existingUser = await prisma.user.findUnique({
            where: { email: userEmail }
          });
          console.log('メール重複により既存レコード取得:', existingUser);
        } else {
          throw createError;
        }
      }
    } else {
      // 存在する場合は更新
      console.log('既存Userレコード更新開始...');
      existingUser = await prisma.user.update({
        where: { id: chatworkUserId },
        data: {
          name: userInfo.name,
          company: userInfo.organization_name || null,
          lastLoginAt: new Date()
        }
      });
      console.log('既存Userレコード更新成功:', existingUser);
    }

    // 最終確認
    const finalUser = await prisma.user.findUnique({
      where: { id: chatworkUserId }
    });

    console.log('最終確認Userレコード:', finalUser);

    if (!finalUser) {
      throw new Error(`User still not found: ${chatworkUserId}`);
    }

    // 成功時のリダイレクト
    return NextResponse.redirect(
      new URL(`/integrations?debug=user_ready&user=${encodeURIComponent(userInfo.name)}&userId=${encodeURIComponent(chatworkUserId)}`, request.url)
    );

  } catch (error) {
    console.error('ChatWork統合エラー:', error);
    return NextResponse.redirect(
      new URL(`/integrations?error=chatwork_integration_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}