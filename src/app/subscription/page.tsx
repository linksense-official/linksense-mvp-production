'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// プラン型定義
interface Plan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  limits: {
    members: number | string;
    teams: number | string;
    reports: number;
    storage: string;
  };
  popular?: boolean;
  enterprise?: boolean;
  color: string;
  icon: string;
  detailedFeatures: {
    category: string;
    items: string[];
  }[];
  useCases: string[];
  support: string;
}

// 通知状態型定義
interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

// プランデータ（詳細情報追加）
const plans: Plan[] = [
  {
    id: 'starter',
    name: 'スターター',
    price: 0,
    yearlyPrice: 0,
    description: '小規模チーム向けの基本機能',
    features: [
      '基本的な健全性分析',
      '週次レポート',
      'メール通知',
      '基本サポート',
      'データ保持 30日',
      '基本的なダッシュボード'
    ],
    limits: {
      members: 5,
      teams: 1,
      reports: 4,
      storage: '1GB'
    },
    color: 'gray',
    icon: '🚀',
    detailedFeatures: [
      {
        category: '分析機能',
        items: ['基本的な健全性スコア', 'チーム概要ダッシュボード', '基本メトリクス表示']
      },
      {
        category: 'レポート',
        items: ['週次サマリーレポート', 'PDF出力', 'メール配信']
      },
      {
        category: 'サポート',
        items: ['メールサポート', 'ヘルプドキュメント', 'コミュニティフォーラム']
      }
    ],
    useCases: [
      '5人以下の小規模チーム',
      'スタートアップ企業',
      'プロジェクトチーム',
      'フリーランスグループ'
    ],
    support: 'メールサポート（48時間以内返信）'
  },
  {
    id: 'professional',
    name: 'プロフェッショナル',
    price: 2980,
    yearlyPrice: 29800,
    description: '成長企業向けの高度な分析機能',
    features: [
      '高度な健全性分析',
      'リアルタイム分析',
      '日次レポート',
      'カスタムアラート',
      'データ保持 1年',
      '高度なダッシュボード',
      'チーム比較分析',
      'API アクセス',
      '優先サポート'
    ],
    limits: {
      members: 50,
      teams: 10,
      reports: 50,
      storage: '10GB'
    },
    popular: true,
    color: 'blue',
    icon: '⭐',
    detailedFeatures: [
      {
        category: '高度な分析',
        items: ['リアルタイム健全性監視', '予測分析', 'トレンド分析', 'チーム比較', 'カスタムメトリクス']
      },
      {
        category: 'レポート & アラート',
        items: ['日次/週次/月次レポート', 'カスタムレポート', 'リアルタイムアラート', 'Slack/Teams統合']
      },
      {
        category: 'API & 統合',
        items: ['REST API', 'Webhook', 'Slack統合', 'Teams統合', 'Jira統合']
      },
      {
        category: 'サポート',
        items: ['優先メールサポート', 'チャットサポート', 'オンボーディング支援']
      }
    ],
    useCases: [
      '10-50人の成長企業',
      '複数チームを持つ組織',
      'リモートワーク中心企業',
      'アジャイル開発チーム'
    ],
    support: '優先サポート（12時間以内返信）+ チャットサポート'
  },
  {
    id: 'enterprise',
    name: 'エンタープライズ',
    price: 9980,
    yearlyPrice: 99800,
    description: '大企業向けの包括的ソリューション',
    features: [
      'プロフェッショナルの全機能',
      'AI予測分析',
      'カスタムレポート',
      'SSO統合',
      'データ保持 無制限',
      '専用サポート',
      'オンサイト研修',
      'カスタム統合',
      'セキュリティ監査',
      'SLA保証'
    ],
    limits: {
      members: '無制限',
      teams: '無制限',
      reports: 500,
      storage: '無制限'
    },
    enterprise: true,
    color: 'purple',
    icon: '👑',
    detailedFeatures: [
      {
        category: 'AI & 機械学習',
        items: ['AI予測分析', '異常検知', '自動レコメンデーション', '感情分析', 'パフォーマンス予測']
      },
      {
        category: 'エンタープライズ機能',
        items: ['SSO統合（SAML/LDAP）', 'カスタムブランディング', '専用インスタンス', 'API制限なし']
      },
      {
        category: 'セキュリティ & コンプライアンス',
        items: ['SOC2準拠', 'GDPR対応', 'セキュリティ監査', 'データ暗号化', 'アクセス制御']
      },
      {
        category: 'サポート & サービス',
        items: ['専用カスタマーサクセス', 'オンサイト研修', '24/7サポート', 'SLA保証', 'カスタム開発']
      }
    ],
    useCases: [
      '50人以上の大企業',
      '多国籍企業',
      '規制業界（金融・医療等）',
      'カスタム要件のある組織'
    ],
    support: '専用サポート（1時間以内返信）+ 24/7電話サポート + 専属CSM'
  }
];

// 現在のユーザープラン（モック）
const currentUserPlan = {
  planId: 'starter',
  memberCount: 3,
  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  usage: {
    members: 3,
    teams: 1,
    reports: 2,
    storage: '0.3GB'
  }
};

// 通知コンポーネント
interface NotificationProps {
  notification: NotificationState;
  onClose: () => void;
}

const Notification = ({ notification, onClose }: NotificationProps) => {
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [notification.show, onClose]);
  
  if (!notification.show) return null;

  const typeConfig = {
    success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '✅' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'ℹ️' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⚠️' },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '❌' }
  };

  const config = typeConfig[notification.type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`${config.bg} ${config.border} border rounded-lg p-4 shadow-lg max-w-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{config.icon}</span>
            <p className={`${config.text} font-medium`}>{notification.message}</p>
          </div>
          <button
            onClick={onClose}
            className={`${config.text} hover:opacity-70 transition-opacity`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// プラン詳細モーダルコンポーネント
interface PlanDetailModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  isYearly: boolean;
}

const PlanDetailModal = ({ plan, isOpen, onClose, isYearly }: PlanDetailModalProps) => {
  if (!isOpen || !plan) return null;

  const price = isYearly ? plan.yearlyPrice : plan.price;
  const monthlyPrice = isYearly ? Math.round(plan.yearlyPrice / 12) : plan.price;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{plan.icon}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{plan.name}プラン</h2>
                <p className="text-gray-600">{plan.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* 価格情報 */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">料金</h3>
            {plan.price === 0 ? (
              <div className="text-3xl font-bold text-gray-900">無料</div>
            ) : (
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-gray-900">
                  ¥{monthlyPrice.toLocaleString()}
                </span>
                <span className="text-gray-600">/月</span>
                {isYearly && (
                  <span className="text-sm text-green-600 font-medium">
                    （年間 ¥{price.toLocaleString()}）
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 制限情報 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">プラン制限</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {plan.limits.members}{typeof plan.limits.members === 'number' ? '人' : ''}
                </div>
                <div className="text-sm text-blue-800">メンバー</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {plan.limits.teams}{typeof plan.limits.teams === 'number' ? '個' : ''}
                </div>
                <div className="text-sm text-green-800">チーム</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{plan.limits.reports}</div>
                <div className="text-sm text-purple-800">レポート/月</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{plan.limits.storage}</div>
                <div className="text-sm text-orange-800">ストレージ</div>
              </div>
            </div>
          </div>

          {/* 詳細機能 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">詳細機能</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plan.detailedFeatures.map((category, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">{category.category}</h4>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 利用用途 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">こんな組織におすすめ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.useCases.map((useCase, index) => (
                <div key={index} className="flex items-center bg-blue-50 rounded-lg p-3">
                  <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-800 font-medium">{useCase}</span>
                </div>
              ))}
            </div>
          </div>

          {/* サポート */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">サポート内容</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{plan.support}</p>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              閉じる
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              {plan.price === 0 ? '無料で始める' : `${plan.name}を選択`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// プランカードコンポーネント
interface PlanCardProps {
  plan: Plan;
  isCurrentPlan: boolean;
  isYearly: boolean;
  onSelectPlan: (planId: string) => void;
  onShowDetails: (plan: Plan) => void;
  index: number;
}

const PlanCard = ({ plan, isCurrentPlan, isYearly, onSelectPlan, onShowDetails, index }: PlanCardProps) => {
  const price = isYearly ? plan.yearlyPrice : plan.price;
  const monthlyPrice = isYearly ? Math.round(plan.yearlyPrice / 12) : plan.price;
  const savings = isYearly && plan.price > 0 ? Math.round(((plan.price * 12 - plan.yearlyPrice) / (plan.price * 12)) * 100) : 0;

  // 現在のプランより上位かどうかを判定
  const currentPlanIndex = plans.findIndex(p => p.id === currentUserPlan.planId);
  const thisPlanIndex = plans.findIndex(p => p.id === plan.id);
  const isUpgrade = thisPlanIndex > currentPlanIndex;
  const isDowngrade = thisPlanIndex < currentPlanIndex && !isCurrentPlan;

  const colorConfig = {
    gray: {
      border: 'border-gray-200',
      bg: 'bg-gray-50',
      button: 'bg-gray-600 hover:bg-gray-700',
      text: 'text-gray-600',
      accent: 'text-gray-900'
    },
    blue: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      button: 'bg-blue-600 hover:bg-blue-700',
      text: 'text-blue-600',
      accent: 'text-blue-900'
    },
    purple: {
      border: 'border-purple-200',
      bg: 'bg-purple-50',
      button: 'bg-purple-600 hover:bg-purple-700',
      text: 'text-purple-600',
      accent: 'text-purple-900'
    }
  };

  const config = colorConfig[plan.color as keyof typeof colorConfig];

  // ボタンテキストとスタイルを決定
  const getButtonConfig = () => {
    if (isCurrentPlan) {
      return {
        text: '現在のプラン',
        className: 'w-full py-3 px-4 bg-green-100 text-green-700 rounded-lg font-medium cursor-not-allowed',
        disabled: true
      };
    }
    
    if (plan.price === 0) {
      return {
        text: '無料で始める',
        className: `w-full py-3 px-4 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${config.button}`,
        disabled: false
      };
    }
    
    if (isUpgrade) {
      return {
        text: `${plan.name}にアップグレード`,
        className: `w-full py-3 px-4 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${config.button}`,
        disabled: false
      };
    }
    
    if (isDowngrade) {
      return {
        text: `${plan.name}にダウングレード`,
        className: `w-full py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium transition-all duration-200 hover:bg-gray-50`,
        disabled: false
      };
    }
    
    return {
      text: `${plan.name}を選択`,
      className: `w-full py-3 px-4 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${config.button}`,
      disabled: false
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <div 
      className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-slide-up ${
        plan.popular ? 'border-blue-500 ring-4 ring-blue-100' : config.border
      } ${isCurrentPlan ? 'ring-4 ring-green-100 border-green-500' : ''}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* 人気バッジ */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
            🔥 最も人気
          </span>
        </div>
      )}

      {/* 現在のプランバッジ */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            ✅ 現在のプラン
          </span>
        </div>
      )}

      {/* アップグレード推奨バッジ */}
      {isUpgrade && plan.popular && (
        <div className="absolute -top-3 right-4">
          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            🚀 おすすめ
          </span>
        </div>
      )}

      <div className="p-8">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{plan.icon}</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-gray-600">{plan.description}</p>
        </div>

        {/* 価格 */}
        <div className="text-center mb-6">
          {plan.price === 0 ? (
            <div className="text-4xl font-bold text-gray-900">無料</div>
          ) : (
            <div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-4xl font-bold text-gray-900">
                  ¥{monthlyPrice.toLocaleString()}
                </span>
                <span className="text-gray-600">/月</span>
              </div>
              {isYearly && savings > 0 && (
                <div className="mt-2">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    年払いで{savings}%お得！
                  </span>
                </div>
              )}
              {isYearly && plan.price > 0 && (
                <div className="text-sm text-gray-500 mt-1">
                  年間 ¥{price.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 制限情報（視認性改善） */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">メンバー:</span>
              <span className="font-bold text-blue-900">{plan.limits.members}{typeof plan.limits.members === 'number' ? '人' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">チーム:</span>
              <span className="font-bold text-blue-900">{plan.limits.teams}{typeof plan.limits.teams === 'number' ? '個' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">レポート:</span>
              <span className="font-bold text-blue-900">{plan.limits.reports}/月</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">ストレージ:</span>
              <span className="font-bold text-blue-900">{plan.limits.storage}</span>
            </div>
          </div>
        </div>

        {/* 機能一覧 */}
        <div className="mb-8">
          <h4 className="font-semibold text-gray-900 mb-3">含まれる機能</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* アクションボタン */}
        <div className="space-y-3">
          <button
            onClick={() => onSelectPlan(plan.id)}
            disabled={buttonConfig.disabled}
            className={buttonConfig.className}
          >
            {buttonConfig.text}
          </button>
          
          <button 
            onClick={() => onShowDetails(plan)}
            className="w-full py-2 px-4 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            詳細を見る
          </button>
        </div>
      </div>
    </div>
  );
};

// 使用状況コンポーネント（視認性改善）
const UsageStats = () => {
  const currentPlan = plans.find(p => p.id === currentUserPlan.planId)!;
  
  const usagePercentages = {
    members: (currentUserPlan.usage.members / (currentPlan.limits.members as number)) * 100,
    teams: (currentUserPlan.usage.teams / (currentPlan.limits.teams as number)) * 100,
    reports: (currentUserPlan.usage.reports / currentPlan.limits.reports) * 100,
    storage: 30 // 0.3GB / 1GB = 30%
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsageTextColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-700';
    if (percentage >= 70) return 'text-yellow-700';
    return 'text-green-700';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 animate-slide-up">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">現在の使用状況</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-bold text-blue-800">メンバー</span>
            <span className="text-sm font-bold text-blue-900">
              {currentUserPlan.usage.members}/{currentPlan.limits.members}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getUsageColor(usagePercentages.members)}`}
              style={{ width: `${usagePercentages.members}%` }}
            ></div>
          </div>
          <div className={`text-xs font-medium mt-1 ${getUsageTextColor(usagePercentages.members)}`}>
            {Math.round(usagePercentages.members)}% 使用中
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-green-800">チーム</span>
            <span className="text-sm font-bold text-green-900">
              {currentUserPlan.usage.teams}/{currentPlan.limits.teams}
            </span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getUsageColor(usagePercentages.teams)}`}
              style={{ width: `${usagePercentages.teams}%` }}
            ></div>
          </div>
          <div className={`text-xs font-medium mt-1 ${getUsageTextColor(usagePercentages.teams)}`}>
            {Math.round(usagePercentages.teams)}% 使用中
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-purple-800">レポート</span>
            <span className="text-sm font-bold text-purple-900">
              {currentUserPlan.usage.reports}/{currentPlan.limits.reports}
            </span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getUsageColor(usagePercentages.reports)}`}
              style={{ width: `${usagePercentages.reports}%` }}
            ></div>
          </div>
          <div className={`text-xs font-medium mt-1 ${getUsageTextColor(usagePercentages.reports)}`}>
            {Math.round(usagePercentages.reports)}% 使用中
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-orange-800">ストレージ</span>
            <span className="text-sm font-bold text-orange-900">
              {currentUserPlan.usage.storage}/{currentPlan.limits.storage}
            </span>
          </div>
          <div className="w-full bg-orange-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getUsageColor(usagePercentages.storage)}`}
              style={{ width: `${usagePercentages.storage}%` }}
            ></div>
          </div>
          <div className={`text-xs font-medium mt-1 ${getUsageTextColor(usagePercentages.storage)}`}>
            {Math.round(usagePercentages.storage)}% 使用中
          </div>
        </div>
      </div>

      {/* アップグレード促進メッセージ */}
      {Object.values(usagePercentages).some(p => p >= 70) && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-yellow-600 text-lg mr-3">⚠️</div>
            <div>
              <h4 className="text-yellow-800 font-medium">使用量が上限に近づいています</h4>
              <p className="text-yellow-700 text-sm mt-1">
                より多くの機能とリソースを利用するために、プランのアップグレードをご検討ください。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// メインコンポーネント
export default function SubscriptionPage() {
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState<Plan | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });

  const showNotification = (message: string, type: NotificationState['type'] = 'info') => {
    setNotification({
      show: true,
      message,
      type
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const handleSelectPlan = (planId: string) => {
    const selectedPlan = plans.find(p => p.id === planId);
    const currentPlanIndex = plans.findIndex(p => p.id === currentUserPlan.planId);
    const selectedPlanIndex = plans.findIndex(p => p.id === planId);
    
    if (selectedPlan?.price === 0) {
      showNotification('無料プランでの利用を開始します', 'success');
    } else if (selectedPlanIndex > currentPlanIndex) {
      showNotification(`${selectedPlan?.name}プランへのアップグレードを開始します`, 'success');
    } else if (selectedPlanIndex < currentPlanIndex) {
      showNotification(`${selectedPlan?.name}プランへのダウングレードを受け付けました`, 'info');
    } else {
      showNotification(`${selectedPlan?.name}プランを選択しました`, 'success');
    }
  };

  const handleShowDetails = (plan: Plan) => {
    setSelectedPlanForDetails(plan);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailModalOpen(false);
    setSelectedPlanForDetails(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8 pb-16">
        {/* ヘッダー */}
        <div className="text-center py-12 animate-slide-down">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            あなたのチームに最適なプランを選択
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            LinkSenseでチームの健全性を向上させ、生産性を最大化しましょう
          </p>
          
          {/* 年払い/月払い切り替え */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              月払い
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isYearly ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              年払い
            </span>
            {isYearly && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                最大20%お得！
              </span>
            )}
          </div>
        </div>

        {/* 使用状況 */}
        <UsageStats />

        {/* プランカード */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={plan.id === currentUserPlan.planId}
              isYearly={isYearly}
              onSelectPlan={handleSelectPlan}
              onShowDetails={handleShowDetails}
              index={index}
            />
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">よくある質問</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">プランの変更はいつでも可能ですか？</h4>
              <p className="text-gray-600 text-sm">はい、いつでもプランの変更が可能です。アップグレードは即座に反映され、ダウングレードは次の請求サイクルから適用されます。</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">データの移行はどうなりますか？</h4>
              <p className="text-gray-600 text-sm">すべてのデータは自動的に移行されます。プラン変更によるデータの損失はありません。</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">14日間無料トライアルについて</h4>
              <p className="text-gray-600 text-sm">クレジットカード登録が必要です。14日間の試用期間終了後、自動的に有料プランに移行し、課金が開始されます。</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">サポートはどの程度受けられますか？</h4>
              <p className="text-gray-600 text-sm">プランに応じて、メールサポートやチャットサポートを提供しています。エンタープライズプランでは専用サポートチームが対応します。</p>
            </div>
          </div>
        </div>

        {/* CTA セクション */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-2xl font-bold mb-4">まだ迷っていますか？</h3>
          <p className="text-blue-100 mb-6">
            14日間の無料トライアルで、LinkSenseの全機能をお試しください。<br />
            ※クレジットカード登録が必要です。14日後に自動的に課金が開始されます。
          </p>
          <div className="flex justify-center">
            <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              14日間無料トライアル開始
            </button>
          </div>
          <p className="text-xs text-blue-200 mt-4">
            ※無料トライアル開始にはクレジットカード情報の登録が必要です
          </p>
        </div>

        <div className="h-8"></div>
      </div>

      {/* プラン詳細モーダル */}
      <PlanDetailModal
        plan={selectedPlanForDetails}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetails}
        isYearly={isYearly}
      />

      {/* 通知 */}
      <Notification
        notification={notification}
        onClose={closeNotification}
      />
    </div>
  );
}
 