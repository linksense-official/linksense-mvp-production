import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // NextAuth関連のリクエストを全て監視
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    console.log('🔍 NextAuth リクエスト監視:', {
      pathname: request.nextUrl.pathname,
      method: request.method,
      searchParams: request.nextUrl.searchParams.toString(),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
    
    // 問題のあるパターンを検出
    if (request.nextUrl.pathname.includes('chatwork')) {
      console.error('❌ 削除済みChatWorkエンドポイントへのアクセス検出:', request.nextUrl.pathname);
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/auth/:path*']
}