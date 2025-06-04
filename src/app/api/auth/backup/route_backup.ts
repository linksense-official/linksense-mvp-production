import NextAuth from 'next-auth'
import SlackProvider from 'next-auth/providers/slack'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import AzureADProvider from 'next-auth/providers/azure-ad'

// 🚨 緊急修正: 環境変数強制設定
process.env.NEXTAUTH_URL = 'https://5a7c-2405-1205-f089-cf00-dd4b-351e-2daf-da78.ngrok-free.app';

console.log('🔧 NextAuth デバッグ強化版起動');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ 設定済み' : '❌ 未設定');

const handler = NextAuth({
  providers: [
    // Google OAuth (デバッグ強化)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn Callback:', {
        provider: account?.provider,
        user: user?.email,
        account: account,
      });
      return true;
    },
    
    async redirect({ url, baseUrl }) {
      console.log('🔧 Redirect Callback:', { url, baseUrl });
      
      if (url.startsWith('/')) {
        const finalUrl = `${process.env.NEXTAUTH_URL}${url}`;
        console.log('✅ 相対URL リダイレクト:', finalUrl);
        return finalUrl;
      }
      
      const finalUrl = `${process.env.NEXTAUTH_URL}/integrations`;
      console.log('✅ 固定リダイレクト:', finalUrl);
      return finalUrl;
    },
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  debug: true,
  
  logger: {
    error(code: string, metadata?: any) {
      console.error('🚨 NextAuth ERROR:', { code, metadata });
    },
    warn(code: string) {
      console.warn('⚠️ NextAuth WARNING:', code);
    },
    debug(code: string, metadata?: any) {
      console.log('🔧 NextAuth DEBUG:', { code, metadata });
    },
  },
});

export { handler as GET, handler as POST }