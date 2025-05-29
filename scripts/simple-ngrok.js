// scripts/simple-ngrok.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function startSimpleNgrok() {
  try {
    console.log('🚀 ngrok起動中...');
    
    // 既存のngrokプロセスを終了
    console.log('🧹 既存のngrokプロセスをクリーンアップ中...');
    try {
      await killExistingNgrok();
    } catch (error) {
      console.log('   既存のngrokプロセスはありませんでした');
    }
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📡 ngrokトンネルを開始中...');
    
    // ngrokをコマンドラインで直接起動
    const ngrokProcess = spawn('npx', ['ngrok', 'http', '3000', '--log=stdout'], {
      stdio: 'pipe',
      shell: true
    });
    
    let ngrokUrl = null;
    let isReady = false;
    
    // ngrokの出力を監視
    ngrokProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('ngrok:', output.trim());
      
      // URLを抽出
      const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/);
      if (urlMatch && !isReady) {
        ngrokUrl = urlMatch[0];
        isReady = true;
        onNgrokReady(ngrokUrl);
      }
    });
    
    ngrokProcess.stderr.on('data', (data) => {
      console.error('ngrok error:', data.toString());
    });
    
    ngrokProcess.on('close', (code) => {
      console.log(`ngrok process exited with code ${code}`);
    });
    
    // 30秒後にタイムアウト
    setTimeout(() => {
      if (!isReady) {
        console.error('❌ ngrok起動タイムアウト（30秒）');
        ngrokProcess.kill();
        process.exit(1);
      }
    }, 30000);
    
    // プロセス終了時の処理
    process.on('SIGINT', () => {
      console.log('\n🛑 ngrokを終了中...');
      ngrokProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ ngrok起動エラー:', error.message);
    process.exit(1);
  }
}

async function killExistingNgrok() {
  return new Promise((resolve) => {
    const killProcess = spawn('npx', ['ngrok', 'kill'], { shell: true });
    killProcess.on('close', () => {
      resolve();
    });
  });
}

function onNgrokReady(url) {
  console.log('\n✅ ngrok URL発行完了!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 Public URL:', url);
  console.log('🔗 Slack Redirect URL:', `${url}/api/auth/slack/callback`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // .env.localを自動更新
  try {
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
    
  } catch (error) {
    console.error('⚠️  .env.local更新エラー:', error.message);
  }
  
  console.log('\n🔧 Slack App設定手順:');
  console.log('1. https://api.slack.com/apps にアクセス');
  console.log('2. LinkSense MVPアプリを選択');
  console.log('3. OAuth & Permissions → Redirect URLs に上記URLを設定');
  console.log('\n⏹️  終了するには Ctrl+C を押してください');
}

startSimpleNgrok();