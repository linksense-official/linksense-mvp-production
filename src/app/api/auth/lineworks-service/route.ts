import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 LINE WORKS Service Account認証開始');
    
    // JWT トークン生成
    const serviceAccountId = process.env.LINE_WORKS_SERVICE_ACCOUNT_ID;
    const privateKey = process.env.LINE_WORKS_PRIVATE_KEY;
    
    if (!serviceAccountId || !privateKey) {
      return NextResponse.redirect(
        new URL('/integrations?error=service_account_config_missing', request.url)
      );
    }

    // アクセストークン取得
    const accessToken = await getServiceAccountToken(serviceAccountId, privateKey);
    
    if (!accessToken) {
      return NextResponse.redirect(
        new URL('/integrations?error=service_account_token_failed', request.url)
      );
    }

    // ユーザー情報取得（管理者として）
    const userInfo = await getAdminUserInfo(accessToken);
    
    if (!userInfo) {
      return NextResponse.redirect(
        new URL('/integrations?error=service_account_user_info_failed', request.url)
      );
    }

    // データベースに統合情報を保存
    const lineWorksUserId = `line-works-service_${Date.now()}`;
    const userEmail = `service-account@2000dev.lineworks.local`;
    
    // ユーザー作成
    const existingUser = await prisma.user.upsert({
      where: { email: userEmail },
      update: {
        name: 'LINE WORKS Service Account',
        lastLoginAt: new Date()
      },
      create: {
        id: lineWorksUserId,
        email: userEmail,
        name: 'LINE WORKS Service Account',
        company: '2000dev',
        role: 'user',
        lastLoginAt: new Date()
      }
    });

    // 統合情報保存
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: existingUser.id,
          service: 'lineworks'
        }
      },
      update: {
        accessToken: accessToken,
        isActive: true,
        teamId: '2000dev',
        teamName: '2000dev',
        updatedAt: new Date()
      },
      create: {
        userId: existingUser.id,
        service: 'lineworks',
        accessToken: accessToken,
        isActive: true,
        teamId: '2000dev',
        teamName: '2000dev'
      }
    });

    console.log('✅ LINE WORKS Service Account統合完了');

    return NextResponse.redirect(
      new URL(`/integrations?success=line_works_connected&user=Service Account`, request.url)
    );

  } catch (error) {
    console.error('❌ LINE WORKS Service Account認証エラー:', error);
    return NextResponse.redirect(
      new URL(`/integrations?error=service_account_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    );
  }
}

async function getServiceAccountToken(serviceAccountId: string, privateKey: string) {
  try {
    // JWT生成
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccountId,
      sub: serviceAccountId,
      aud: 'https://auth.worksmobile.com/oauth2/v2.0/token',
      exp: now + 3600, // 1時間後
      iat: now
    };

    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

    // アクセストークン取得
    const response = await fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        assertion: token,
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        scope: 'bot'
      })
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Service Account Token取得エラー:', error);
    return null;
  }
}

async function getAdminUserInfo(accessToken: string) {
  try {
    const response = await fetch('https://www.worksapis.com/v1.0/bots', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Admin API request failed: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Admin API呼び出しエラー:', error);
    return null;
  }
}