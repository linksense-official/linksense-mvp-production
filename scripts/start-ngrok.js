// scripts/start-ngrok.js
const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');

async function startNgrokAndUpdateConfig() {
  try {
    console.log('🚀 ngrokを起動中...');
    
    // ngrokでポート3000をトンネル
    const url = await ngrok.connect({
      port: 3000,
      region: 'jp', // 日本リージョン
      authtoken: process.env.NGROK_AUTHTOKEN // 必要に応じて
    });
    
    console.log('✅ ngrok URL:', url);
    
    // .env.localファイルを更新
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    // 既存の.env.localを読み込み
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // NGROK_URLを更新または追加
    const ngrokUrlRegex = /^NGROK_URL=.*$/m;
    const newNgrokUrl = `NGROK_URL=${url}`;
    
    if (ngrokUrlRegex.test(envContent)) {
      envContent = envContent.replace(ngrokUrlRegex, newNgrokUrl);
    } else {
      envContent += `\n${newNgrokUrl}\n`;
    }
    
    // .env.localファイルに書き込み
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local updated with ngrok URL');
    
    // Slack App設定用の情報を表示
    console.log('\n📋 Slack App設定情報:');
    console.log('Redirect URL:', `${url}/api/auth/slack/callback`);
    console.log('Request URL:', `${url}/api/auth/slack/events`);
    
    // 設定ファイルに保存
    const configPath = path.join(process.cwd(), 'ngrok-config.json');
    const config = {
      url,
      redirectUrl: `${url}/api/auth/slack/callback`,
      requestUrl: `${url}/api/auth/slack/events`,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ ngrok設定をngrok-config.jsonに保存しました');
    
    // ブラウザで設定ページを開く（オプション）
    const open = require('open');
    console.log('\n🌐 Slack App設定ページを開いています...');
    await open('https://api.slack.com/apps');
    
    return url;
    
  } catch (error) {
    console.error('❌ ngrok起動エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行時の処理
if (require.main === module) {
  startNgrokAndUpdateConfig();
}

module.exports = { startNgrokAndUpdateConfig };