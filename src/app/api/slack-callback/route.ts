import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  console.log('🔧 Slack認証コールバック:', { code: !!code, error })
  
  if (error) {
    console.error('❌ Slack認証エラー:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=slack_auth_failed`)
  }
  
  if (!code) {
    console.error('❌ 認証コードなし')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=no_code`)
  }
  
  try {
    // 🔧 現在のセッション取得
    const session = await getServerSession(authOptions)
    console.log('🔍 現在のセッション:', session?.user?.email)
    
    // Slack トークン取得
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code: code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/slack-callback`,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.ok) {
      console.error('❌ Slackトークン取得失敗:', tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=token_failed`)
    }
    
    // Slack ユーザー情報取得
    const userResponse = await fetch('https://slack.com/api/users.identity', {
      headers: {
        'Authorization': `Bearer ${tokenData.authed_user?.access_token}`,
      },
    })
    
    const userData = await userResponse.json()
    
    if (!userData.ok) {
      console.error('❌ Slackユーザー情報取得失敗:', userData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=user_failed`)
    }
    
    const email = userData.user?.email
    console.log('🔍 Slack認証ユーザー:', email)
    
    // 🔧 セッションユーザーを優先使用
    let targetUserId = session?.user?.id
    
    if (!targetUserId) {
      // セッションがない場合のみ新規作成
      const user = await prisma.user.upsert({
        where: { email },
        update: { 
          name: userData.user?.name || '',
          updatedAt: new Date() 
        },
        create: {
          email,
          name: userData.user?.name || '',
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      targetUserId = user.id
    }
    
    console.log('🔍 対象ユーザーID:', targetUserId)
    
    // Slack統合保存
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: targetUserId,
          service: 'slack',
        },
      },
      update: {
        accessToken: tokenData.authed_user?.access_token,
        refreshToken: null,
        scope: tokenData.authed_user?.scope,
        tokenType: 'bearer',
        isActive: true,
        teamId: tokenData.team?.id,
        teamName: tokenData.team?.name,
        updatedAt: new Date(),
      },
      create: {
        userId: targetUserId,
        service: 'slack',
        accessToken: tokenData.authed_user?.access_token,
        refreshToken: null,
        scope: tokenData.authed_user?.scope,
        tokenType: 'bearer',
        isActive: true,
        teamId: tokenData.team?.id,
        teamName: tokenData.team?.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    
    console.log('✅ Slack統合保存完了 - ユーザーID:', targetUserId)
    
    const callbackUrl = state ? decodeURIComponent(state) : '/integrations?success=true'
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}${callbackUrl}`)
    
  } catch (error) {
    console.error('❌ Slack認証処理エラー:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=processing_failed`)
  }
}