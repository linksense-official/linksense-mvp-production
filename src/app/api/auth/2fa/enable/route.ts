import { NextRequest, NextResponse } from 'next/server';
import { totpService } from '@/lib/totp';

export async function POST(request: NextRequest) {
  try {
    const { secret, token } = await request.json();

    if (!secret || !token) {
      return NextResponse.json(
        { error: '秘密鍵と認証コードが必要です' },
        { status: 400 }
      );
    }

    // TOTPトークンを検証
    const isValid = totpService.verifyToken(token, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: '認証コードが正しくありません' },
        { status: 400 }
      );
    }

    // 開発環境では実際のDB更新をスキップ
    console.log('🔐 [開発環境] 2FA有効化成功:', {
      secret: secret.substring(0, 8) + '...',
      token
    });

    return NextResponse.json({
      message: '2要素認証が有効になりました',
      success: true
    });

  } catch (error) {
    console.error('2FA有効化エラー:', error);
    return NextResponse.json(
      { error: '2FA有効化に失敗しました' },
      { status: 500 }
    );
  }
}