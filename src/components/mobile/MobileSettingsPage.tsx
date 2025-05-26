// src/components/mobile/MobileSettingsPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notifications');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // モバイル専用のタブナビゲーション
  const MobileTabNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-4 gap-1 p-2">
        {[
          { id: 'notifications', icon: '🔔', label: '通知' },
          { id: 'api', icon: '🔗', label: 'API' },
          { id: 'ai', icon: '🤖', label: 'AI' },
          { id: 'general', icon: '⚙️', label: '一般' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center py-2 px-1 rounded-lg ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <span className="text-lg mb-1">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // モバイル専用のヘッダー
  const MobileHeader = () => (
    <div className="sticky top-0 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 text-gray-600"
        >
          ← 戻る
        </button>
        <h1 className="text-lg font-semibold text-gray-900">設定</h1>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-gray-600"
        >
          ⋮
        </button>
      </div>
    </div>
  );

  // スワイプ対応のコンテンツエリア
  const SwipeableContent = ({ children }: { children: React.ReactNode }) => (
    <div className="pb-20 px-4 pt-4 min-h-screen bg-gray-50">
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader />
      
      <SwipeableContent>
        {activeTab === 'notifications' && <MobileNotificationSettings />}
        {activeTab === 'api' && <MobileAPISettings />}
        {activeTab === 'ai' && <MobileAISettings />}
        {activeTab === 'general' && <MobileGeneralSettings />}
      </SwipeableContent>

      <MobileTabNavigation />
    </div>
  );
}

// モバイル専用の通知設定コンポーネント
const MobileNotificationSettings = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">通知設定</h2>
    
    {/* カード形式で各設定を表示 */}
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">24時間孤立アラート</h3>
          <p className="text-sm text-gray-600">24時間以上連絡がない場合</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      {/* モバイル最適化された設定項目 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">基準値</span>
          <div className="flex items-center space-x-2">
            <input 
              type="number" 
              defaultValue="24"
              className="w-16 text-center border border-gray-300 rounded-lg px-2 py-1 text-sm"
            />
            <span className="text-sm text-gray-600">時間</span>
          </div>
        </div>
        
        <div>
          <span className="text-sm text-gray-700 block mb-2">通知方法</span>
          <div className="flex flex-wrap gap-2">
            {['Email', 'Slack', 'Teams'].map((method) => (
              <button
                key={method}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
              >
                {method}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// その他のモバイル専用コンポーネントも同様に実装...
const MobileAPISettings = () => <div>API設定（モバイル版）</div>;
const MobileAISettings = () => <div>AI設定（モバイル版）</div>;
const MobileGeneralSettings = () => <div>一般設定（モバイル版）</div>;