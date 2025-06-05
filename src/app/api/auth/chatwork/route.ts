import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.CHATWORK_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/chatwork/callback`;
    
    if (!clientId) {
      return NextResponse.json({ error: 'ChatWork client ID not configured' }, { status: 500 });
    }

    // ChatWork OAuth認証URL生成
    const authUrl = new URL('https://oauth.chatwork.com/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'users.profile.me:read rooms.all:read');
    authUrl.searchParams.append('state', session.user.id); // CSRF保護用

    console.log('ChatWork認証URL:', authUrl.toString());

    // 直接リダイレクトではなく、URLを返す
    return NextResponse.json({
      redirectUrl: authUrl.toString(),
      message: 'ChatWork認証URLを生成しました'
    });

  } catch (error) {
    console.error('ChatWork OAuth開始エラー:', error);
    return NextResponse.json(
      { error: 'ChatWork認証の開始に失敗しました' },
      { status: 500 }
    );
  }
}