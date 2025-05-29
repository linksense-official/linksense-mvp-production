// scripts/quick-ngrok.js
const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');

async function quickStart() {
  try {
    console.log('🚀 ngrok起動中...');
    
    const url = await ngrok.connect(3000);
    
    console.log('\n✅ ngrok URL発行完了!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 Public URL:', url);
    console.log('🔗 Slack Redirect URL:', `${url}/api/auth/slack/callback`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // .env.localを自動更新
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    const ngrokUrlRegex = /^NGROK_URL=.*$/m;
    const newNgrokUrl = `NGROK_URL=${url}`;
    
    if (ngrokUrlRegex.test(envContent)) {
      envContent = envContent.replace(ngrokUrlRegex, newNgrokUrl);
    } else {
      envContent += `\n${newNgrokUrl}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n📋 .env.local更新完了!');
    console.log('🔧 Slack App設定:');
    console.log('1. https://api.slack.com/apps にアクセス');
    console.log('2. OAuth & Permissions → Redirect URLs に上記URLを設定');
    console.log('\n⏹️  終了するには Ctrl+C を押してください');
    
    // プロセス終了時の処理
    process.on('SIGINT', async () => {
      console.log('\n🛑 ngrokを終了中...');
      await ngrok.disconnect();
      await ngrok.kill();
      console.log('✅ 終了完了');
      process.exit(0);
    });
    
    // 無限待機
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

quickStart();