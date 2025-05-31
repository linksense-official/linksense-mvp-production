// scripts/health-check.js
const https = require('https');
const http = require('http');

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const isHttps = baseUrl.startsWith('https');
const client = isHttps ? https : http;

console.log(`🏥 Health check for: ${baseUrl}`);

const checkEndpoint = (path) => {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}${path}`;
    const request = client.get(url, (res) => {
      const success = res.statusCode >= 200 && res.statusCode < 400;
      resolve({ path, status: res.statusCode, success });
    });

    request.on('error', (error) => {
      reject({ path, error: error.message, success: false });
    });

    request.setTimeout(10000, () => {
      request.destroy();
      reject({ path, error: 'Timeout', success: false });
    });
  });
};

async function runHealthCheck() {
  const endpoints = [
    '/api/health',
    '/api/auth/csrf',
    '/login',
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const result = await checkEndpoint(endpoint);
      results.push(result);
      console.log(`${result.success ? '✅' : '❌'} ${endpoint}: ${result.status}`);
    } catch (error) {
      results.push(error);
      console.log(`❌ ${endpoint}: ${error.error}`);
    }
  }

  const allSuccess = results.every(r => r.success);
  console.log(`\n${allSuccess ? '✅' : '❌'} Overall health: ${allSuccess ? 'HEALTHY' : 'UNHEALTHY'}`);
  
  if (!allSuccess) {
    process.exit(1);
  }
}

runHealthCheck().catch(console.error);