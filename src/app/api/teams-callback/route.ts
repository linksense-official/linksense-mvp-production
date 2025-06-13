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
  
  console.log('🔧 Teams認証コールバック:', { code: !!code, error })
  
  if (error) {
    console.error('❌ Teams認証エラー:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=teams_auth_failed`)
  }
  
  if (!code) {
    console.error('❌ 認証コードなし')
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=no_code`)
  }
  
  try {
    // 🔧 現在のセッション取得
    const session = await getServerSession(authOptions)
    console.log('🔍 現在のセッション:', session?.user?.email)
    
    // トークン取得
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID!,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/teams-callback`,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      console.error('❌ トークン取得失敗:', tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=token_failed`)
    }
    
    // ユーザー情報取得
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    })
    
    const userData = await userResponse.json()
    const email = userData.mail || userData.userPrincipalName
    
    console.log('🔍 Teams認証ユーザー:', email)
    
    // 🔧 セッションユーザーを優先使用
    let targetUserId = session?.user?.id
    
    if (!targetUserId) {
      // セッションがない場合のみ新規作成
      const user = await prisma.user.upsert({
        where: { email },
        update: { 
          name: userData.displayName || '',
          updatedAt: new Date() 
        },
        create: {
          email,
          name: userData.displayName || '',
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      targetUserId = user.id
    }
    
    console.log('🔍 対象ユーザーID:', targetUserId)
    
    // 統合保存
    await prisma.integration.upsert({
      where: {
        userId_service: {
          userId: targetUserId,
          service: 'teams',
        },
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        scope: tokenData.scope || null,
        tokenType: 'Bearer',
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId: targetUserId,
        service: 'teams',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        scope: tokenData.scope || null,
        tokenType: 'Bearer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    
    console.log('✅ Teams統合保存完了 - ユーザーID:', targetUserId)
    
    const callbackUrl = state ? decodeURIComponent(state) : '/integrations?success=true'
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}${callbackUrl}`)
    
  } catch (error) {
    console.error('❌ Teams認証処理エラー:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=processing_failed`)
  }
}