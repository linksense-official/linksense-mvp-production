'use client';

import React from 'react';
import type { SubscriptionPlan } from '../../types/subscription';

const Card: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
}> = ({ children, className = '', title, subtitle, onClick }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`} onClick={onClick}>
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    )}
    <div className="px-6 py-4">
      {children}
    </div>
  </div>
);

interface UpgradePromptProps {
  currentPlan: SubscriptionPlan | null;
  feature: string;
  description: string;
  onUpgrade: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  currentPlan,
  feature,
  description,
  onUpgrade,
  onDismiss,
  className = ''
}) => {
  const getRecommendedPlan = () => {
    if (!currentPlan) return 'Pro';
    
    switch (currentPlan.name.toLowerCase()) {
      case 'free':
      case 'フリー':
        return 'Pro';
      case 'pro':
      case 'プロ':
        return 'Enterprise';
      default:
        return 'Pro';
    }
  };

  const getUpgradeIcon = () => {
    return '🚀';
  };

  return (
    <div className={`${className}`}>
      <Card>
        <div className="text-center py-6">
          <div className="text-4xl mb-4">{getUpgradeIcon()}</div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {feature}を利用するにはアップグレードが必要です
          </h3>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {description}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <span className="font-medium">推奨プラン:</span>
              <span className="font-bold">{getRecommendedPlan()}</span>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={onUpgrade}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              プランをアップグレード
            </button>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                後で
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            いつでもプランを変更できます
          </p>
        </div>
      </Card>
    </div>
  );
};

// 特定の機能用のプリセットコンポーネント
export const AIAnalysisUpgradePrompt: React.FC<{
  currentPlan: SubscriptionPlan | null;
  onUpgrade: () => void;
  onDismiss?: () => void;
}> = ({ currentPlan, onUpgrade, onDismiss }) => (
  <UpgradePrompt
    currentPlan={currentPlan}
    feature="AI分析機能"
    description="高度なAI分析でチームの健全性をより詳しく把握し、具体的な改善提案を受け取ることができます。"
    onUpgrade={onUpgrade}
    onDismiss={onDismiss}
  />
);

export const APIAccessUpgradePrompt: React.FC<{
  currentPlan: SubscriptionPlan | null;
  onUpgrade: () => void;
  onDismiss?: () => void;
}> = ({ currentPlan, onUpgrade, onDismiss }) => (
  <UpgradePrompt
    currentPlan={currentPlan}
    feature="API アクセス"
    description="REST APIを使用して、LinkSenseのデータを他のシステムと連携させることができます。"
    onUpgrade={onUpgrade}
    onDismiss={onDismiss}
  />
);

export const AdvancedReportsUpgradePrompt: React.FC<{
  currentPlan: SubscriptionPlan | null;
  onUpgrade: () => void;
  onDismiss?: () => void;
}> = ({ currentPlan, onUpgrade, onDismiss }) => (
  <UpgradePrompt
    currentPlan={currentPlan}
    feature="高度なレポート機能"
    description="カスタマイズ可能なレポートとダッシュボードで、より詳細な分析結果を確認できます。"
    onUpgrade={onUpgrade}
    onDismiss={onDismiss}
  />
);