// scripts/validate-env.js
const requiredEnvVars = {
  production: [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DATABASE_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'AZURE_AD_CLIENT_ID',
    'AZURE_AD_CLIENT_SECRET',
    'AZURE_AD_TENANT_ID',
    'STRIPE_SECRET_KEY',
    'RESEND_API_KEY',
  ],
  development: [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DATABASE_URL',
  ],
};

const environment = process.env.NODE_ENV || 'development';
const required = requiredEnvVars[environment] || requiredEnvVars.development;

console.log(`🔍 Validating environment variables for: ${environment}`);

const missing = required.filter(envVar => !process.env[envVar]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(envVar => console.error(`  - ${envVar}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');