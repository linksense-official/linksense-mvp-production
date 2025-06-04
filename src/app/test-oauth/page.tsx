'use client';

import React from 'react';

const TestOAuthPage = () => {
  const handleSlackAuth = () => {
    console.log('🔄 Slack認証開始');
    // ✅ 新しいngrok URLに修正
    const ngrokUrl = 'https://5a7c-2405-1205-f089-cf00-dd4b-351e-2daf-da78.ngrok-free.app';
    const callbackUrl = encodeURIComponent(`${ngrokUrl}/test-oauth`);
    const authUrl = `${ngrokUrl}/api/auth/signin/slack?callbackUrl=${callbackUrl}`;
    
    console.log('🔗 認証URL:', authUrl);
    console.log('🔗 コールバックURL:', `${ngrokUrl}/test-oauth`);
    
    window.location.href = authUrl;
  };

  const handleNextAuthSlack = () => {
    console.log('🔄 NextAuth Slack認証開始');
    // NextAuth.js の signIn 関数を使用
    import('next-auth/react').then(({ signIn }) => {
      signIn('slack', { 
        callbackUrl: 'https://5a7c-2405-1205-f089-cf00-dd4b-351e-2daf-da78.ngrok-free.app/test-oauth',
        redirect: true 
      });
    });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '2rem',
          color: '#2563eb'
        }}>
          🚀 OAuth認証テスト (最新ngrok URL対応)
        </h1>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Slack OAuth認証テスト
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={handleSlackAuth}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#4A154B',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              🔗 Slack OAuth認証テスト (Direct URL)
            </button>

            <button 
              onClick={handleNextAuthSlack}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#4A90E2',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              🔗 Slack OAuth認証テスト (NextAuth)
            </button>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>
            ✅ 修正内容:
          </h3>
          <p>✅ 新しいngrok URLに更新: 5a7c-2405-1205-f089-cf00-dd4b-351e-2daf-da78</p>
          <p>✅ NextAuth.js signIn関数を使用するボタンを追加</p>
          <p>✅ 両方のテスト方法を提供</p>
          <p>現在時刻: {new Date().toLocaleString()}</p>
          <p>現在のURL: {typeof window !== 'undefined' ? window.location.href : 'loading...'}</p>
          
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: '#2d5a2d', fontWeight: 'bold' }}>
              🎯 新しいngrok URLでSlack OAuth認証をテストしてください！
            </p>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', color: '#856404', marginBottom: '0.5rem' }}>
              📋 テスト手順:
            </h4>
            <ol style={{ color: '#856404', fontSize: '0.9rem' }}>
              <li>まず「NextAuth」ボタンをクリック</li>
              <li>Slack認証画面で許可</li>
              <li>成功しない場合は「Direct URL」ボタンをテスト</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestOAuthPage;