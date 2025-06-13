import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      session: session,
      hasSession: !!session,
      userEmail: session?.user?.email,
      expires: session?.expires
    });

  } catch (error) {
    return NextResponse.json({ error: 'セッション取得エラー' }, { status: 500 });
  }
}