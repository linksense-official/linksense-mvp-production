'use client';

import React from 'react';

export default function SubscriptionSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 無料プランを開始しました！
        </h1>
        <p className="text-gray-600 mb-6">
          LinkSense無料プランの利用を開始できます。
        </p>
        
        <button
          onClick={() => window.location.href = '/members'}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          チーム分析を開始
        </button>
      </div>
    </div>
  );
}