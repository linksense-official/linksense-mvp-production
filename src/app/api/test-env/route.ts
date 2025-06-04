import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const envStatus = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '❌ 未設定',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ 設定済み' : '❌ 未設定',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '❌ 未設定',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ 設定済み' : '❌ 未設定',
    NODE_ENV: process.env.NODE_ENV || '❌ 未設定',
    VERCEL_URL: process.env.VERCEL_URL || '❌ 未設定',
  }

  console.log('🔍 環境変数チェック結果:', envStatus)

  return NextResponse.json({
    status: 'Environment Check',
    timestamp: new Date().toISOString(),
    environment: envStatus,
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('NEXTAUTH') || 
      key.includes('GOOGLE') || 
      key.includes('CLIENT')
    ),
  })
}