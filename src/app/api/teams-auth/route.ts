import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const callbackUrl = searchParams.get('callbackUrl') || '/integrations'
  
  console.log('🔧 Teams直接認証開始')
  
  // Azure AD 直接認証URL
  const authUrl = new URL(`https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`)
  
  authUrl.searchParams.set('client_id', process.env.AZURE_AD_CLIENT_ID!)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/teams-callback`)
  authUrl.searchParams.set('scope', 'openid profile email User.Read')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', encodeURIComponent(callbackUrl))
  
  console.log('🔧 リダイレクト先:', authUrl.toString())
  
  return NextResponse.redirect(authUrl.toString())
}