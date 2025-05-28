// src/components/UpgradePrompt.tsx
'use client';

import React from 'react';

interface UpgradePromptProps {
  title?: string;
  message?: string;
  buttonText?: string;
  onUpgrade?: () => void;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title = 'プランのアップグレードが必要です',
  message = 'この機能を利用するには有料プランへのアップグレードが必要です。',
  buttonText = 'プランを確認',
  onUpgrade,
  className = ''
}) => {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = '/pricing';
    }
  };

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
      <div className="text-gray-400 mb-2">
        <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-4">
        {message}
      </p>
      <button
        onClick={handleUpgrade}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default UpgradePrompt;