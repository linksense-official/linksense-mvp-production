'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// 簡略版のプラン型定義（デバッグ用）
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
}

// 通知状態型定義
interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

// 簡略版プランデータ
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
    icon: '🚀'
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
    icon: '⭐'
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
    icon: '👑'
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

// シンプルな詳細モーダル（デバッグ用）
interface SimpleModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  isYearly: boolean;
}

const SimpleModal = ({ plan, isOpen, onClose, isYearly }: SimpleModalProps) => {
  console.log('Modal render:', { plan, isOpen }); // デバッグログ

  if (!isOpen || !plan) {
    console.log('Modal not showing:', { isOpen, plan: !!plan });
    return null;
  }

  const price = isYearly ? plan.yearlyPrice : plan.price;
  const monthlyPrice = isYearly ? Math.round(plan.yearlyPrice / 12) : plan.price;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200">
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
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 価格情報 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">料金</h3>
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

          {/* 機能一覧 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">含まれる機能</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="p-6 border-t border-gray-200">
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

// プランカードコンポーネント（デバッグ版）
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

  const handleDetailsClick = () => {
    console.log('Details button clicked for plan:', plan.name); // デバッグログ
    onShowDetails(plan);
  };

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
            {plan.features.slice(0, 6).map((feature, index) => (
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
            onClick={handleDetailsClick}
            className="w-full py-2 px-4 border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            📋 詳細を見る
          </button>
        </div>
      </div>
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
    console.log('handleShowDetails called with:', plan.name); // デバッグログ
    setSelectedPlanForDetails(plan);
    setIsDetailModalOpen(true);
    console.log('Modal state set:', { plan: plan.name, isOpen: true }); // デバッグログ
  };

  const handleCloseDetails = () => {
    console.log('handleCloseDetails called'); // デバッグログ
    setIsDetailModalOpen(false);
    setSelectedPlanForDetails(null);
  };

  console.log('Current modal state:', { selectedPlanForDetails: selectedPlanForDetails?.name, isDetailModalOpen }); // デバッグログ

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

        {/* デバッグ情報表示 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-yellow-800">デバッグ情報:</h3>
          <p className="text-yellow-700">選択されたプラン: {selectedPlanForDetails?.name || 'なし'}</p>
          <p className="text-yellow-700">モーダル表示状態: {isDetailModalOpen ? '表示中' : '非表示'}</p>
        </div>

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
      </div>

      {/* プラン詳細モーダル */}
      <SimpleModal
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