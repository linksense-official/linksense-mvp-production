import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS コールバック TEST VERSION');
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  return NextResponse.json({
    message: 'LINE WORKS Callback Test Success',
    code: code ? 'コード取得済み' : 'コード未取得',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}