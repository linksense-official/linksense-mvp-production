import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 ChatWork統合ページ表示');

    // 認証確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 簡単なHTMLページを返す
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChatWork統合</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center">
    <div class="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold">ChatWork統合</h1>
            <p class="text-gray-600">APIトークンで接続</p>
        </div>
        
        <div class="space-y-4">
            <input 
                type="password" 
                id="apiToken" 
                placeholder="APIトークンを入力"
                class="w-full px-3 py-2 border rounded"
            >
            <button 
                onclick="connect()" 
                class="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
            >
                接続
            </button>
            <a href="/integrations" class="block text-center text-blue-500">← 戻る</a>
        </div>
    </div>

    <script>
        async function connect() {
            const token = document.getElementById('apiToken').value;
            if (!token) {
                alert('APIトークンを入力してください');
                return;
            }
            
            try {
                const res = await fetch('/api/integrations/chatwork', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiToken: token })
                });
                
                const data = await res.json();
                
                if (data.success) {
                    alert('接続成功！');
                    window.location.href = '/integrations?success=true';
                } else {
                    alert('接続失敗: ' + data.error);
                }
            } catch (error) {
                alert('エラーが発生しました');
            }
        }
    </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error) {
    console.error('❌ ChatWork GET エラー:', error);
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 ChatWork統合API開始');

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const { apiToken } = await request.json();

    if (!apiToken) {
      return NextResponse.json({ error: 'APIトークンが必要です' }, { status: 400 });
    }

    // ChatWork API確認
    const meResponse = await fetch('https://api.chatwork.com/v2/me', {
      headers: {
        'X-ChatWorkToken': apiToken,
        'Content-Type': 'application/json'
      }
    });

    if (!meResponse.ok) {
      return NextResponse.json({ 
        error: 'APIトークンが無効です',
        details: `Status: ${meResponse.status}`
      }, { status: 400 });
    }

    const chatworkUser = await meResponse.json();

    // 統合情報保存
    const integration = await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: user.id,
          service: 'chatwork',
        },
      },
      update: {
        accessToken: apiToken,
        refreshToken: '',
        scope: 'api_access',
        tokenType: 'APIToken',
        isActive: true,
        teamId: chatworkUser.organization_id?.toString() || null,
        teamName: chatworkUser.organization_name || null,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        service: 'chatwork',
        accessToken: apiToken,
        refreshToken: '',
        scope: 'api_access',
        tokenType: 'APIToken',
        isActive: true,
        teamId: chatworkUser.organization_id?.toString() || null,
        teamName: chatworkUser.organization_name || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ ChatWork統合完了:', {
      userId: user.id,
      integrationId: integration.id,
      chatworkUser: chatworkUser.name
    });

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        service: 'chatwork',
        isActive: true,
        teamName: integration.teamName,
        user: {
          name: chatworkUser.name,
          account_id: chatworkUser.account_id
        }
      }
    });

  } catch (error) {
    console.error('❌ ChatWork統合エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'ChatWork統合に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    await prisma.integration.deleteMany({
      where: {
        userId: user.id,
        service: 'chatwork'
      }
    });

    return NextResponse.json({ success: true, message: 'ChatWork統合を削除しました' });

  } catch (error) {
    console.error('❌ ChatWork統合削除エラー:', error);
    return NextResponse.json(
      { error: 'ChatWork統合の削除に失敗しました' },
      { status: 500 }
    );
  }
}