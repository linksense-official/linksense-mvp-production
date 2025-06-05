import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== ChatWork API テスト開始 ===');
  
  try {
    const apiToken = process.env.CHATWORK_API_TOKEN;
    console.log('API Token確認:', apiToken ? '設定済み' : '未設定');
    
    // ChatWork API呼び出し
    console.log('ChatWork API呼び出し中...');
    const response = await fetch('https://api.chatwork.com/v2/me', {
      method: 'GET',
      headers: {
        'X-ChatWorkToken': apiToken!,
        'Content-Type': 'application/json'
      }
    });

    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      return NextResponse.json({
        error: 'ChatWork API Error',
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText
      }, { status: 500 });
    }

    const userInfo = await response.json();
    console.log('API Success:', userInfo);
    
    return NextResponse.json({
      success: true,
      message: 'ChatWork API接続成功',
      userInfo: userInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ChatWork API テストエラー:', error);
    return NextResponse.json({
      error: 'Exception occurred',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}