import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const callbackUrl = searchParams.get('callbackUrl') || '/integrations'
  
  console.log('🔧 Slack直接認証開始')
  
  // Slack OAuth URL
  const authUrl = new URL('https://slack.com/oauth/v2/authorize')
  
  authUrl.searchParams.set('client_id', process.env.SLACK_CLIENT_ID!)
  authUrl.searchParams.set('scope', '')
  authUrl.searchParams.set('user_scope', 'identity.basic,identity.email,identity.avatar')
  authUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/slack-callback`)
  authUrl.searchParams.set('state', encodeURIComponent(callbackUrl))
  
  console.log('🔧 Slackリダイレクト先:', authUrl.toString())
  
  return NextResponse.redirect(authUrl.toString())
}