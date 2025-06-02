import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // バリデーション
    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // セキュリティ上、ユーザーが存在しない場合でも成功レスポンスを返す
    if (!user) {
      console.log('⚠️ 存在しないメールアドレスでのパスワードリセット要求:', email);
      return NextResponse.json({
        message: 'パスワードリセットメールを送信しました。メールボックスをご確認ください。',
        success: true
      });
    }

    // 既存のリセットトークンを削除
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // 新しいリセットトークンを生成
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

    // トークンをデータベースに保存
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires
      }
    });

    // メール送信機能（環境変数チェック付き）
    let emailSent = false;
    
    try {
      // Resend APIキーの確認
      const resendApiKey = process.env.RESEND_API_KEY;
      
      if (resendApiKey) {
        // 動的インポートでResendを使用
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);
        
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        
        await resend.emails.send({
          from: 'LinkSense <noreply@linksense-mvp.vercel.app>',
          to: email,
          subject: 'パスワードリセットのご案内',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">パスワードリセットのご案内</h2>
              <p>こんにちは${user.name ? ` ${user.name}さん` : ''}、</p>
              <p>LinkSenseアカウントのパスワードリセットが要求されました。</p>
              <p>以下のリンクをクリックして、新しいパスワードを設定してください：</p>
              <p style="margin: 20px 0;">
                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  パスワードをリセット
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                このリンクは1時間後に無効になります。<br>
                もしこのメールに心当たりがない場合は、このメールを無視してください。
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                LinkSense チーム<br>
                このメールは自動送信されています。
              </p>
            </div>
          `
        });
        
        emailSent = true;
        console.log('✅ パスワードリセットメール送信成功:', { email, userId: user.id });
      } else {
        console.warn('⚠️ RESEND_API_KEY が設定されていません。メール送信をスキップします。');
        // 開発環境ではコンソールにリンクを出力
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        console.log('🔗 パスワードリセットURL:', resetUrl);
        emailSent = true; // 開発環境では成功として扱う
      }
    } catch (emailError) {
      console.error('❌ メール送信エラー:', emailError);
      // メール送信に失敗してもトークンは保存されているので、部分的成功として扱う
      emailSent = false;
    }

    return NextResponse.json({
      message: 'パスワードリセットメールを送信しました。メールボックスをご確認ください。',
      success: true,
      ...(process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY && {
        devNote: 'メール送信機能は無効です。コンソールでリセットURLを確認してください。'
      })
    });

  } catch (error) {
    console.error('💥 パスワードリセット要求エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}