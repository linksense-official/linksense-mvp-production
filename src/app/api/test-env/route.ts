// src/app/api/test-env/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const getRedirectUri = () => {
    if (process.env.NODE_ENV === 'production') {
      return 'https://linksense-mvp.vercel.app/api/auth/slack/callback';
    }
    
    if (process.env.NGROK_URL) {
      return `${process.env.NGROK_URL}/api/auth/slack/callback`;
    }
    
    return 'http://localhost:3000/api/auth/slack/callback';
  };

  return NextResponse.json({
    clientId: process.env.SLACK_CLIENT_ID || 'NOT_SET',
    clientSecret: process.env.SLACK_CLIENT_SECRET ? 'SET' : 'NOT_SET',
    ngrokUrl: process.env.NGROK_URL || 'NOT_SET',
    redirectUri: getRedirectUri(),
    nodeEnv: process.env.NODE_ENV
  });
}