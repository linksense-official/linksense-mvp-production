import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasClientId: !!process.env.AZURE_AD_CLIENT_ID,
    hasClientSecret: !!process.env.AZURE_AD_CLIENT_SECRET,
    hasTenantId: !!process.env.AZURE_AD_TENANT_ID,
    clientIdPreview: process.env.AZURE_AD_CLIENT_ID?.substring(0, 8) + '...',
    tenantIdPreview: process.env.AZURE_AD_TENANT_ID?.substring(0, 8) + '...',
    secretLength: process.env.AZURE_AD_CLIENT_SECRET?.length || 0,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}