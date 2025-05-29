// scripts/ngrok-latest.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function startLatestNgrok() {
  try {
    console.log('🚀 最新ngrok起動中...');
    
    // バージョン確認
    console.log('📋 ngrokバージョン確認中...');
    await checkNgrokVersion();
    
    // 既存プロセス終了
    console.log('🧹 既存のngrokプロセスをクリーンアップ中...');
    await killExistingNgrok();
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📡 ngrokトンネルを開始中...');
    
    // 最新ngrokでHTTPトンネル起動
    const ngrokProcess = spawn('ngrok', ['http', '3000', '--log=stdout'], {
      stdio: 'pipe',
      shell: true
    });
    
    let ngrokUrl = null;
    let isReady = false;
    
    // ngrokの出力を監視
    ngrokProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('ngrok:', output.trim());
      
      // URL抽出（v3形式）
      const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/) || 
                      output.match(/https:\/\/[a-z0-9-]+\.ngrok\.io/);
      
      if (urlMatch && !isReady) {
        ngrokUrl = urlMatch[0];
        isReady = true;
        onNgrokReady(ngrokUrl);
      }
    });
    
    ngrokProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      console.log('ngrok info:', errorOutput.trim());
      
      // エラー出力からもURL抽出を試行
      const urlMatch = errorOutput.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/) || 
                      errorOutput.match(/https:\/\/[a-z0-9-]+\.ngrok\.io/);
      
      if (urlMatch && !isReady) {
        ngrokUrl = urlMatch[0];
        isReady = true;
        onNgrokReady(ngrokUrl);
      }
    });
    
    ngrokProcess.on('close', (code) => {
      console.log(`ngrok process exited with code ${code}`);
      if (code !== 0 && !isReady) {
        console.log('\n❌ ngrok起動に失敗しました');
        suggestAlternatives();
      }
    });
    
    // 30秒後にタイムアウト
    setTimeout(() => {
      if (!isReady) {
        console.log('\n⏰ ngrok起動に時間がかかっています...');
        console.log('手動確認: http://127.0.0.1:4040 でWeb UIを確認してください');
        suggestAlternatives();
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
    suggestAlternatives();
  }
}

async function checkNgrokVersion() {
  return new Promise((resolve) => {
    const versionProcess = spawn('ngrok', ['version'], { 
      stdio: 'pipe', 
      shell: true 
    });
    
    versionProcess.stdout.on('data', (data) => {
      console.log('📋 ngrokバージョン:', data.toString().trim());
    });
    
    versionProcess.on('close', () => {
      resolve();
    });
    
    // タイムアウト
    setTimeout(() => {
      versionProcess.kill();
      resolve();
    }, 5000);
  });
}

async function killExistingNgrok() {
  return new Promise((resolve) => {
    const killProcess = spawn('taskkill', ['/F', '/IM', 'ngrok.exe'], { 
      shell: true, 
      stdio: 'pipe' 
    });
    
    killProcess.on('close', () => {
      resolve();
    });
    
    // タイムアウト
    setTimeout(() => {
      resolve();
    }, 3000);
  });
}

function onNgrokReady(url) {
  console.log('\n✅ ngrok URL発行完了!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 Public URL:', url);
  console.log('🔗 Slack Redirect URL:', `${url}/api/auth/slack/callback`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // .env.local更新
  updateEnvFile(url);
  
  console.log('\n🔧 Slack App設定手順:');
  console.log('1. https://api.slack.com/apps にアクセス');
  console.log('2. LinkSense MVPアプリを選択');
  console.log('3. OAuth & Permissions → Redirect URLs に上記URLを設定');
  console.log('\n⏹️  終了するには Ctrl+C を押してください');
}

function updateEnvFile(url) {
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
}

function suggestAlternatives() {
  console.log('\n🔧 代替手段:');
  console.log('1. ngrok更新: npm install -g ngrok@latest');
  console.log('2. 直接ダウンロード: https://ngrok.com/download');
  console.log('3. localtunnel使用: npx localtunnel --port 3000');
  console.log('4. 手動ngrok: ngrok http 3000');
}

startLatestNgrok();