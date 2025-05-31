import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { totpService } from '@/lib/totp';

export async function POST(request: NextRequest) {
  try {
    // 開発環境では認証チェックをスキップ
    const userEmail = 'dev@example.com'; // 実際の実装では session.user.email を使用

    // 新しい秘密鍵を生成
    const secret = totpService.generateSecret();

    // OTPAuth URLを生成
    const otpAuthUrl = totpService.generateOtpAuthUrl(secret, userEmail);

    // QRコードを生成
    const qrCodeDataUrl = await totpService.generateQRCode(otpAuthUrl);

    // バックアップコードを生成
    const backupCodes = totpService.generateBackupCodes();

    console.log('🔐 [開発環境] 2FA設定生成:', {
      email: userEmail,
      secret: secret.substring(0, 8) + '...',
      backupCodesCount: backupCodes.length
    });

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes,
      manualEntryKey: secret,
      success: true
    });

  } catch (error) {
    console.error('2FA設定エラー:', error);
    return NextResponse.json(
      { error: '2FA設定の生成に失敗しました' },
      { status: 500 }
    );
  }
}