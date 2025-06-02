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

    if (!user) {
      return NextResponse.json(
        { error: 'このメールアドレスは登録されていません' },
        { status: 404 }
      );
    }

    // 既に認証済みの場合
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に認証済みです' },
        { status: 400 }
      );
    }

    // 既存の認証トークンを削除
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id }
    });

    // 新しい認証トークンを生成
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

    // トークンをデータベースに保存
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expires
      }
    });

    // 認証メール送信（環境変数チェック付き）
    let emailSent = false;
    
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      
      if (resendApiKey) {
        // 動的インポートでResendを使用
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);
        
        const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
        
        await resend.emails.send({
          from: 'LinkSense <noreply@linksense-mvp.vercel.app>',
          to: email,
          subject: 'メールアドレスの認証をお願いします',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                <h1 style="color: #007bff; margin: 0;">LinkSense</h1>
                <p style="color: #666; margin: 10px 0 0 0;">チーム健全性分析SaaS</p>
              </div>
              
              <div style="padding: 30px 20px;">
                <h2 style="color: #333;">メールアドレスの認証</h2>
                <p>こんにちは${user.name ? ` ${user.name}さん` : ''}、</p>
                <p>LinkSenseにご登録いただき、ありがとうございます。</p>
                <p>アカウントの有効化のため、以下のボタンをクリックしてメールアドレスの認証を完了してください：</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" 
                     style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    メールアドレスを認証する
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  上記のボタンが機能しない場合は、以下のURLをコピーしてブラウザに貼り付けてください：<br>
                  <a href="${verificationUrl}" style="color: #007bff; word-break: break-all;">${verificationUrl}</a>
                </p>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404;">
                    <strong>⚠️ 重要:</strong> この認証リンクは24時間後に無効になります。
                  </p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  もしこのメールに心当たりがない場合は、このメールを無視してください。
                </p>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                <p style="margin: 0;">LinkSense チーム</p>
                <p style="margin: 5px 0 0 0;">このメールは自動送信されています。</p>
              </div>
            </div>
          `
        });
        
        emailSent = true;
        console.log('✅ 認証メール送信成功:', { email, userId: user.id });
      } else {
        console.warn('⚠️ RESEND_API_KEY が設定されていません。認証メール送信をスキップします。');
        // 開発環境ではコンソールにリンクを出力
        const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
        console.log('🔗 認証URL:', verificationUrl);
        emailSent = true; // 開発環境では成功として扱う
      }
    } catch (emailError) {
      console.error('❌ 認証メール送信エラー:', emailError);
      emailSent = false;
    }

    if (!emailSent && process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'メール送信に失敗しました。しばらく後にお試しください。' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '認証メールを送信しました。メールボックスをご確認ください。',
      success: true,
      ...(process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY && {
        devNote: 'メール送信機能は無効です。コンソールで認証URLを確認してください。'
      })
    });

  } catch (error) {
    console.error('💥 認証メール送信エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}