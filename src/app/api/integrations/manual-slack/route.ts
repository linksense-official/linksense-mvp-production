import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 手動Slack統合追加開始');
    
    const KNOWN_USER_ID = 'cmbera14c0000ft0vnadzxdnu';
    
    // 既存のSlack統合をチェック
    const existingSlack = await prisma.integration.findFirst({
      where: {
        userId: KNOWN_USER_ID,
        service: 'slack'
      }
    });
    
    if (existingSlack) {
      console.log('✅ 既存のSlack統合を有効化');
      await prisma.integration.update({
        where: { id: existingSlack.id },
        data: { isActive: true, updatedAt: new Date() }
      });
    } else {
      console.log('🆕 新規Slack統合作成');
      await prisma.integration.create({
        data: {
          userId: KNOWN_USER_ID,
          service: 'slack',
          accessToken: 'manual_token',
          isActive: true,
          teamId: 'linksense_team',
          teamName: 'linksense',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    return NextResponse.json({ success: true, message: 'Slack統合追加完了' });
  } catch (error) {
    console.error('手動統合エラー:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}