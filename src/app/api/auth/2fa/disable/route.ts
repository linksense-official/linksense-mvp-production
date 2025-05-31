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

    // 開発環境では認証チェックをスキップ
    let isValid = false;

    if (token) {
      // 実際の実装では、DBから秘密鍵を取得して検証
      console.log('🔐 [開発環境] TOTPトークンでの2FA無効化試行:', token);
      isValid = token === '123456'; // 開発環境用の固定値
    } else if (backupCode) {
      // 実際の実装では、DBからバックアップコードを取得して検証
      console.log('🔐 [開発環境] バックアップコードでの2FA無効化試行:', backupCode);
      isValid = backupCode === '12345678'; // 開発環境用の固定値
    }

    if (!isValid) {
      return NextResponse.json(
        { error: '認証コードまたはバックアップコードが正しくありません' },
        { status: 400 }
      );
    }

    console.log('🔐 [開発環境] 2FA無効化成功');

    return NextResponse.json({
      message: '2要素認証が無効になりました',
      success: true
    });

  } catch (error) {
    console.error('2FA無効化エラー:', error);
    return NextResponse.json(
      { error: '2FA無効化に失敗しました' },
      { status: 500 }
    );
  }
}