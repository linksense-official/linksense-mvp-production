import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // バリデーション
    if (!token) {
      return NextResponse.json(
        { error: '認証トークンが必要です' },
        { status: 400 }
      );
    }

    // トークンの確認
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: '無効な認証トークンです' },
        { status: 400 }
      );
    }

    // トークンの有効期限確認
    if (verificationToken.expires < new Date()) {
      // 期限切れトークンを削除
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id }
      });

      return NextResponse.json(
        { error: '認証トークンの有効期限が切れています。新しい認証メールを送信してください。' },
        { status: 400 }
      );
    }

    // ユーザーのメール認証状態を更新
    const updatedUser = await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: new Date()
      }
    });

    // 使用済みトークンを削除
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id }
    });

    // ウェルカムメール送信（環境変数チェック付き）
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      
      if (resendApiKey) {
        // 動的インポートでResendを使用
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);
        
        const dashboardUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`;
        
        await resend.emails.send({
          from: 'LinkSense <welcome@linksense-mvp.vercel.app>',
          to: updatedUser.email,
          subject: 'LinkSenseへようこそ！アカウント認証完了',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 40px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎉 ようこそ LinkSense へ！</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">チーム健全性分析SaaS</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin-bottom: 20px;">認証完了おめでとうございます！</h2>
                <p>こんにちは${updatedUser.name ? ` ${updatedUser.name}さん` : ''}、</p>
                <p>メールアドレスの認証が正常に完了しました。これでLinkSenseの全機能をご利用いただけます。</p>
                
                <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #007bff; margin: 0 0 15px 0;">✨ 利用可能な機能</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #555;">
                    <li style="margin-bottom: 8px;">🔗 8つの主要サービスとの統合（Slack、Teams、Discord等）</li>
                    <li style="margin-bottom: 8px;">📊 リアルタイムチーム健全性分析</li>
                    <li style="margin-bottom: 8px;">🔒 エンタープライズレベルのセキュリティ</li>
                    <li style="margin-bottom: 8px;">📱 モバイル対応PWAアプリ</li>
                    <li style="margin-bottom: 8px;">🌐 多言語対応（日本語・英語）</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${dashboardUrl}" 
                     style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                    ダッシュボードを開始
                  </a>
                </div>
                
                <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 4px; padding: 20px; margin: 30px 0;">
                  <h4 style="color: #0056b3; margin: 0 0 10px 0;">🚀 次のステップ</h4>
                  <ol style="margin: 0; padding-left: 20px; color: #555;">
                    <li style="margin-bottom: 8px;">ダッシュボードでチーム設定を行う</li>
                    <li style="margin-bottom: 8px;">統合したいサービスを接続する</li>
                    <li style="margin-bottom: 8px;">チームメンバーを招待する</li>
                    <li style="margin-bottom: 8px;">分析レポートを確認する</li>
                  </ol>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  ご不明な点がございましたら、いつでもサポートチームまでお気軽にお問い合わせください。<br>
                  LinkSenseでチームの健全性向上を実現しましょう！
                </p>
              </div>
              
              <hr style="margin: 0; border: none; border-top: 1px solid #eee;">
              <div style="padding: 30px; text-align: center; background-color: #f8f9fa;">
                <p style="margin: 0; color: #999; font-size: 14px;">
                  <strong>LinkSense チーム</strong><br>
                  チーム健全性分析のパートナー
                </p>
                <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                  このメールは自動送信されています。
                </p>
              </div>
            </div>
          `
        });
        
        console.log('✅ ウェルカムメール送信成功:', { email: updatedUser.email });
      } else {
        console.warn('⚠️ RESEND_API_KEY が設定されていません。ウェルカムメール送信をスキップします。');
      }
    } catch (emailError) {
      console.error('❌ ウェルカムメール送信エラー:', emailError);
      // メール送信エラーでも認証は成功しているので続行
    }

    console.log('✅ メール認証完了:', { 
      userId: updatedUser.id, 
      email: updatedUser.email 
    });

    return NextResponse.json({
      message: 'メールアドレスの認証が完了しました！',
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        emailVerified: updatedUser.emailVerified
      }
    });

  } catch (error) {
    console.error('💥 メール認証エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // トークンの確認（GET用）
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // トークンの有効期限確認
    if (verificationToken.expires < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id }
      });
      return NextResponse.redirect(new URL('/login?error=expired_token', request.url));
    }

    // 認証ページにリダイレクト
    return NextResponse.redirect(new URL(`/verify-email?token=${token}`, request.url));

  } catch (error) {
    console.error('💥 メール認証GET エラー:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}