import { NextRequest, NextResponse } from 'next/server';
import { totpService } from '@/lib/totp';

export async function POST(request: NextRequest) {
  try {
    const { token, backupCode } = await request.json();

    if (!token && !backupCode) {
      return NextResponse.json(
        { error: '認証コードまたはバックアップコードが必要です' },
        { status: 400 }
      );
    }

    let isValid = false;
    let usedBackupCode = false;

    if (token) {
      // 実際の実装では、DBからユーザーの秘密鍵を取得
      console.log('🔐 [開発環境] TOTPトークン検証:', token);
      isValid = token === '123456'; // 開発環境用の固定値
    } else if (backupCode) {
      // 実際の実装では、DBからバックアップコードを取得して検証
      console.log('🔐 [開発環境] バックアップコード検証:', backupCode);
      isValid = backupCode === '12345678'; // 開発環境用の固定値
      usedBackupCode = true;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: '認証コードが正しくありません' },
        { status: 400 }
      );
    }

    console.log('🔐 [開発環境] 2FA検証成功:', { usedBackupCode });

    return NextResponse.json({
      message: '2要素認証が成功しました',
      success: true,
      usedBackupCode
    });

  } catch (error) {
    console.error('2FA検証エラー:', error);
    return NextResponse.json(
      { error: '2FA検証に失敗しました' },
      { status: 500 }
    );
  }
}