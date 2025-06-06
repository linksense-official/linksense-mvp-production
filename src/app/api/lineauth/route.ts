import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔄 LINE WORKS 新認証システム - TEST VERSION');
  
  return NextResponse.json({ 
    message: 'LINE WORKS Auth Test - Working!',
    timestamp: new Date().toISOString(),
    url: request.url
  });
}