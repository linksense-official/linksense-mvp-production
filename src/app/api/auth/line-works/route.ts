import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 最小限のテスト
  const testUrl = 'https://auth.worksmobile.com/oauth2/v2.0/authorize?' + 
    `client_id=${process.env.LINE_WORKS_CLIENT_ID}&` +
    'response_type=code&' +
    `redirect_uri=${encodeURIComponent('https://linksense-mvp.vercel.app/api/auth/line-works/callback')}&` +
    'scope=user.read%20user.profile.read%20user.email.read&' +
    'state=test123';

  // デバッグ情報をHTMLで返す（一時的）
  return new Response(`
    <html>
      <head><title>LINE WORKS Debug</title></head>
      <body>
        <h1>LINE WORKS OAuth Debug</h1>
        <p><strong>Client ID:</strong> ${process.env.LINE_WORKS_CLIENT_ID ? 'Set' : 'Not Set'}</p>
        <p><strong>Client Secret:</strong> ${process.env.LINE_WORKS_CLIENT_SECRET ? 'Set' : 'Not Set'}</p>
        <p><strong>Generated URL:</strong></p>
        <p style="word-break: break-all;">${testUrl}</p>
        <br>
        <a href="${testUrl}" style="background: green; color: white; padding: 10px; text-decoration: none;">
          → LINE WORKS認証画面へ
        </a>
        <script>
          console.log('Debug URL:', '${testUrl}');
          // 3秒後に自動リダイレクト
          setTimeout(() => {
            window.location.href = '${testUrl}';
          }, 3000);
        </script>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' },
  });
}