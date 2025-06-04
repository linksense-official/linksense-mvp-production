import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * 統合サービス専用OAuth認証開始エンドポイント
 * 
 * 既存ユーザーが追加の統合サービスを接続する際の
 * OAuth認証フローを開始します。
 */

interface OAuthStartRequest {
  integrationId: string;
}

interface OAuthStartResponse {
  authUrl: string;
  integrationId: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  console.log('🔄 統合サービスOAuth認証開始処理');
  
  try {
    // セッション確認
    const session = await getServerSession();
    if (!session?.user?.id) {
      console.error('❌ 未認証ユーザーのアクセス');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: '認証が必要です。ログインしてください。'
      }, { status: 401 });
    }

    // リクエストボディ取得
    const body: OAuthStartRequest = await request.json();
    const { integrationId } = body;

    if (!integrationId) {
      console.error('❌ 統合サービスIDが指定されていません');
      return NextResponse.json({ 
        error: 'Bad Request',
        message: '統合サービスIDが必要です。'
      }, { status: 400 });
    }

    console.log(`🔗 OAuth認証開始: ${integrationId} (ユーザー: ${session.user.email})`);

    // ベースURL取得
    const baseUrl = process.env.NEXTAUTH_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://linksense-mvp.vercel.app' 
        : 'http://localhost:3000');

    // 統合モード用のコールバックURL
    const callbackUrl = encodeURIComponent('/integrations?mode=integration&source=oauth');
    
    // 統合サービスごとのOAuth認証URL生成
let authUrl = '';

switch (integrationId) {
  case 'slack':
    const slackClientId = process.env.SLACK_CLIENT_ID;
    if (!slackClientId) {
      throw new Error('Slack設定が不完全です');
    }
    
    const slackRedirectUri = `${baseUrl}/api/auth/slack/callback`;
    const slackState = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now(),
      mode: 'integration'
    })).toString('base64');
    
    const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize');
    slackAuthUrl.searchParams.set('client_id', slackClientId);
    slackAuthUrl.searchParams.set('scope', 'channels:read,chat:write,users:read,team:read');
    slackAuthUrl.searchParams.set('user_scope', 'identity.basic,identity.email,identity.team');
    slackAuthUrl.searchParams.set('redirect_uri', slackRedirectUri);
    slackAuthUrl.searchParams.set('state', slackState);
    slackAuthUrl.searchParams.set('response_type', 'code');
    
    authUrl = slackAuthUrl.toString();
    console.log('✅ Slack OAuth URL生成');
    break;
    
  case 'microsoft-teams':
    // 🔧 修正: 正しい環境変数名を使用
    const teamsClientId = process.env.AZURE_AD_CLIENT_ID;
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    if (!teamsClientId || !tenantId) {
      throw new Error('Teams設定が不完全です');
    }
    
    const teamsRedirectUri = `${baseUrl}/api/auth/teams/callback`;
    const teamsState = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now(),
      mode: 'integration'
    })).toString('base64');
    
    // 🔧 修正: テナントIDを使用したURL
    const teamsAuthUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
    teamsAuthUrl.searchParams.set('client_id', teamsClientId);
    teamsAuthUrl.searchParams.set('response_type', 'code');
    teamsAuthUrl.searchParams.set('redirect_uri', teamsRedirectUri);
    teamsAuthUrl.searchParams.set('scope', 'https://graph.microsoft.com/Team.ReadBasic.All https://graph.microsoft.com/User.Read.All https://graph.microsoft.com/Chat.Read');
    teamsAuthUrl.searchParams.set('state', teamsState);
    
    authUrl = teamsAuthUrl.toString();
    console.log('✅ Microsoft Teams OAuth URL生成');
    break;
    
  case 'chatwork':
    const chatworkClientId = process.env.CHATWORK_CLIENT_ID;
    if (!chatworkClientId) {
      throw new Error('ChatWork設定が不完全です');
    }
    
    const chatworkRedirectUri = `${baseUrl}/api/auth/chatwork/callback`;
    const chatworkState = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now(),
      mode: 'integration'
    })).toString('base64');
    
    const chatworkAuthUrl = new URL('https://www.chatwork.com/packages/oauth2/login.php');
    chatworkAuthUrl.searchParams.set('client_id', chatworkClientId);
    chatworkAuthUrl.searchParams.set('response_type', 'code');
    chatworkAuthUrl.searchParams.set('redirect_uri', chatworkRedirectUri);
    chatworkAuthUrl.searchParams.set('scope', 'users.profile.me:read rooms.all:read_write');
    chatworkAuthUrl.searchParams.set('state', chatworkState);
    
    authUrl = chatworkAuthUrl.toString();
    console.log('✅ ChatWork OAuth URL生成');
    break;
    
  case 'line-works':
    const lineWorksClientId = process.env.LINE_WORKS_CLIENT_ID;
    if (!lineWorksClientId) {
      throw new Error('LINE WORKS設定が不完全です');
    }
    
    const lineWorksRedirectUri = `${baseUrl}/api/auth/line-works/callback`;
    const lineWorksState = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now(),
      mode: 'integration'
    })).toString('base64');
    
    const lineWorksAuthUrl = new URL('https://auth.worksmobile.com/oauth2/v2.0/authorize');
    lineWorksAuthUrl.searchParams.set('client_id', lineWorksClientId);
    lineWorksAuthUrl.searchParams.set('response_type', 'code');
    lineWorksAuthUrl.searchParams.set('redirect_uri', lineWorksRedirectUri);
    lineWorksAuthUrl.searchParams.set('scope', 'user,user.read');
    lineWorksAuthUrl.searchParams.set('state', lineWorksState);
    
    authUrl = lineWorksAuthUrl.toString();
    console.log('✅ LINE WORKS OAuth URL生成');
    break;
    
  case 'zoom':
    const zoomClientId = process.env.ZOOM_CLIENT_ID;
    if (!zoomClientId) {
      throw new Error('Zoom設定が不完全です');
    }
    
    const zoomRedirectUri = `${baseUrl}/api/auth/zoom/callback`;
    const zoomState = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now(),
      mode: 'integration'
    })).toString('base64');
    
    const zoomAuthUrl = new URL('https://zoom.us/oauth/authorize');
    zoomAuthUrl.searchParams.set('client_id', zoomClientId);
    zoomAuthUrl.searchParams.set('response_type', 'code');
    zoomAuthUrl.searchParams.set('redirect_uri', zoomRedirectUri);
    zoomAuthUrl.searchParams.set('scope', 'user:read meeting:read');
    zoomAuthUrl.searchParams.set('state', zoomState);
    
    authUrl = zoomAuthUrl.toString();
    console.log('✅ Zoom OAuth URL生成');
    break;
    
  case 'google-meet':
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new Error('Google設定が不完全です');
    }
    
    const googleRedirectUri = `${baseUrl}/api/auth/google-meet/callback`;
    const googleState = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now(),
      mode: 'integration'
    })).toString('base64');
    
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', googleClientId);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('redirect_uri', googleRedirectUri);
    googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile');
    googleAuthUrl.searchParams.set('state', googleState);
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');
    
    authUrl = googleAuthUrl.toString();
    console.log('✅ Google Meet OAuth URL生成');
    break;
    
  case 'discord':
    const discordClientId = process.env.DISCORD_CLIENT_ID;
    if (!discordClientId) {
      throw new Error('Discord設定が不完全です');
    }
    
    const discordRedirectUri = `${baseUrl}/api/auth/discord/callback`;
    const discordState = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now(),
      mode: 'integration'
    })).toString('base64');
    
    const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
    discordAuthUrl.searchParams.set('client_id', discordClientId);
    discordAuthUrl.searchParams.set('response_type', 'code');
    discordAuthUrl.searchParams.set('redirect_uri', discordRedirectUri);
    discordAuthUrl.searchParams.set('scope', 'identify email guilds');
    discordAuthUrl.searchParams.set('state', discordState);
    
    authUrl = discordAuthUrl.toString();
    console.log('✅ Discord OAuth URL生成');
    break;
    
  default:
    console.error(`❌ 未対応の統合サービス: ${integrationId}`);
    return NextResponse.json({ 
      error: 'Unsupported Integration',
      message: `統合サービス '${integrationId}' はサポートされていません。`,
      supportedServices: [
        'slack', 'microsoft-teams', 'chatwork', 
        'line-works', 'zoom', 'google-meet', 'discord'
      ]
    }, { status: 400 });
}

    // レスポンス生成
    const response: OAuthStartResponse = {
      authUrl,
      integrationId,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ OAuth認証URL生成成功: ${integrationId}`);
    console.log(`🔗 リダイレクト先: ${authUrl}`);

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ OAuth認証開始処理エラー:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'OAuth認証開始処理中に予期しないエラーが発生しました';
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET メソッドは許可しない
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Method Not Allowed',
    message: 'このエンドポイントはPOSTメソッドのみサポートしています。'
  }, { status: 405 });
}

// その他のHTTPメソッドも許可しない
export async function PUT(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Method Not Allowed',
    message: 'このエンドポイントはPOSTメソッドのみサポートしています。'
  }, { status: 405 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Method Not Allowed',
    message: 'このエンドポイントはPOSTメソッドのみサポートしています。'
  }, { status: 405 });
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Method Not Allowed',
    message: 'このエンドポイントはPOSTメソッドのみサポートしています。'
  }, { status: 405 });
}