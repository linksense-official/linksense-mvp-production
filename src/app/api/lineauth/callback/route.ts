import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS コールバック 詳細診断版');
  
  const url = new URL(request.url);
  const { searchParams } = url;
  
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');
  
  console.log('📋 受信パラメータ:', { code, error, state });
  console.log('📋 完全URL:', request.url);
  
  return NextResponse.json({
    message: 'LINE WORKS Callback 詳細診断',
    receivedParams: {
      code: code || 'なし',
      error: error || 'なし', 
      state: state || 'なし'
    },
    fullUrl: request.url,
    searchParams: Object.fromEntries(searchParams.entries()),
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}