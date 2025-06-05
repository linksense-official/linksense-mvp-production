import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    const apiToken = process.env.CHATWORK_API_TOKEN;
    
    if (!apiToken) {
      return NextResponse.redirect(
        new URL('/integrations?error=chatwork_api_token_missing', request.url)
      );
    }

    console.log('ChatWork API接続開始');

    // ChatWork APIでユーザー情報を取得
    const response = await fetch('https://api.chatwork.com/v2/me', {
      headers: {
        'X-ChatWorkToken': apiToken
      }
    });

    if (!response.ok) {
      console.error('ChatWork API Error:', response.status, response.statusText);
      return NextResponse.redirect(
        new URL('/integrations?error=chatwork_api_failed', request.url)
      );
    }

    const userInfo = await response.json();
    console.log('ChatWork API接続成功:', userInfo);

    // データベースに統合情報を保存
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: session.user.id,
          service: 'chatwork'
        }
      },
      update: {
        accessToken: apiToken,
        isActive: true,
        teamId: userInfo.organization_id?.toString() || 'unknown',
        teamName: userInfo.organization_name || 'Unknown Organization',
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        service: 'chatwork',
        accessToken: apiToken,
        isActive: true,
        teamId: userInfo.organization_id?.toString() || 'unknown',
        teamName: userInfo.organization_name || 'Unknown Organization'
      }
    });

    console.log('ChatWork統合情報保存完了');
    
    // 統合ページに成功メッセージと共にリダイレクト
    return NextResponse.redirect(
      new URL(`/integrations?success=chatwork_connected&user=${encodeURIComponent(userInfo.name)}`, request.url)
    );

  } catch (error) {
    console.error('ChatWork統合処理エラー:', error);
    return NextResponse.redirect(
      new URL('/integrations?error=chatwork_integration_failed', request.url)
    );
  }
}