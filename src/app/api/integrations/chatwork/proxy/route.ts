import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 ChatWork統合API開始');

    // 認証確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザー取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // リクエストボディからAPIトークンを取得
    const { apiToken } = await request.json();

    if (!apiToken) {
      return NextResponse.json({ error: 'ChatWork APIトークンが必要です' }, { status: 400 });
    }

    // ChatWork APIでトークンの有効性確認
    const meResponse = await fetch('https://api.chatwork.com/v2/me', {
      headers: {
        'X-ChatWorkToken': apiToken,
        'Content-Type': 'application/json'
      }
    });

    if (!meResponse.ok) {
      return NextResponse.json({ 
        error: 'ChatWork APIトークンが無効です',
        details: `API Status: ${meResponse.status}`
      }, { status: 400 });
    }

    const chatworkUser = await meResponse.json();

    // 統合情報を保存
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

    // ChatWork統合を削除
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
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 ChatWork統合ページ表示');

    // 認証確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      // 未認証の場合はログインページにリダイレクト
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // ユーザー取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 既存のChatWork統合状況を確認
    const existingIntegration = await prisma.integration.findUnique({
      where: {
        userId_service: {
          userId: user.id,
          service: 'chatwork',
        },
      },
    });

    // ChatWork統合ページのHTMLを返す
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChatWork統合 - LinkSense MVP</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-2xl mx-auto py-12 px-4">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-white font-bold text-xl">CW</span>
                </div>
                <h1 class="text-2xl font-bold text-gray-900">ChatWork統合</h1>
                <p class="text-gray-600 mt-2">APIトークンを使用してChatWorkを統合します</p>
            </div>

            ${existingIntegration && existingIntegration.isActive ? `
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div class="flex items-center">
                    <div class="text-green-600 mr-3">✅</div>
                    <div>
                        <h3 class="font-medium text-green-800">ChatWork統合済み</h3>
                        <p class="text-sm text-green-600">
                            チーム: ${existingIntegration.teamName || '未設定'}<br>
                            接続日時: ${new Date(existingIntegration.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
                <button onclick="disconnectChatWork()" class="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                    統合を削除
                </button>
            </div>
            ` : `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        ChatWork APIトークン
                    </label>
                    <input 
                        type="password" 
                        id="apiToken" 
                        placeholder="APIトークンを入力してください"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                    <p class="text-sm text-gray-500 mt-1">
                        <a href="https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php" 
                           target="_blank" 
                           class="text-orange-500 hover:underline">
                            APIトークンの取得方法 →
                        </a>
                    </p>
                </div>
                
                <button 
                    onclick="connectChatWork()" 
                    class="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                    ChatWorkに接続
                </button>
            </div>
            `}

            <div class="mt-6 text-center">
                <a href="/integrations" class="text-blue-500 hover:underline">
                    ← 統合管理に戻る
                </a>
            </div>
        </div>
    </div>

    <script>
        async function connectChatWork() {
            const apiToken = document.getElementById('apiToken').value.trim();
            
            if (!apiToken) {
                alert('APIトークンを入力してください');
                return;
            }

            try {
                const response = await fetch('/api/integrations/chatwork', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ apiToken }),
                });

                const result = await response.json();

                if (result.success) {
                    alert('ChatWork統合が完了しました！');
                    window.location.href = '/integrations?success=true&service=chatwork';
                } else {
                    alert('統合に失敗しました: ' + (result.error || '不明なエラー'));
                }
            } catch (error) {
                alert('ネットワークエラーが発生しました');
                console.error('ChatWork統合エラー:', error);
            }
        }

        async function disconnectChatWork() {
            if (!confirm('ChatWork統合を削除しますか？')) {
                return;
            }

            try {
                const response = await fetch('/api/integrations/chatwork', {
                    method: 'DELETE',
                });

                const result = await response.json();

                if (result.success) {
                    alert('ChatWork統合を削除しました');
                    window.location.reload();
                } else {
                    alert('削除に失敗しました');
                }
            } catch (error) {
                alert('ネットワークエラーが発生しました');
                console.error('ChatWork削除エラー:', error);
            }
        }
    </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('❌ ChatWork統合ページエラー:', error);
    return NextResponse.json(
      { error: 'ページの表示に失敗しました' },
      { status: 500 }
    );
  }
}