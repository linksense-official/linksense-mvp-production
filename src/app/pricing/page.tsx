/// src/app/pricing/page.tsx
'use client';

import React, { useState } from 'react';
import { pricingPlans, billingIntervalConfig, isFreeplan, isRecommendedPlan } from '@/data/pricing-plans';
import type { StripePlan, BillingInterval } from '@/types/subscription';
import { formatPrice, generatePlanComparison, getPriceId } from '@/lib/pricing-utils';
import { CheckCircle, ArrowRight, Star, Zap, X } from 'lucide-react';

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: StripePlan) => {
    console.log('🎯 プラン選択:', plan.name, plan.id, billingInterval);
    
    const priceId = getPriceId(plan, billingInterval);
    
    if (isFreeplan(plan)) {
      setIsLoading(plan.id);
      console.log('✅ 無料プラン処理開始');
      
      try {
        const response = await fetch('/api/subscriptions/activate-free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan.id }),
        });

        console.log('📡 無料プランAPI応答:', response.status);

        if (!response.ok) {
          throw new Error('無料プランのアクティベートに失敗しました');
        }

        const successMessage = `🎉 ${plan.name}プランを開始しました！

✅ ${plan.features.join('\n✅ ')}

チーム分析ページに移動します...`;
        alert(successMessage);

        localStorage.setItem('currentPlan', plan.id);
        localStorage.setItem('billingInterval', billingInterval);
        localStorage.setItem('planStartDate', new Date().toISOString());
        console.log('💾 無料プラン情報をローカルストレージに保存');

        window.location.href = '/members';
      } catch (error) {
        console.error('❌ 無料プランエラー:', error);
        alert('無料プランの設定でエラーが発生しました。もう一度お試しください。');
      } finally {
        setIsLoading(null);
      }
      return;
    }

    setIsLoading(plan.id);
    console.log('💳 有料プラン処理開始:', priceId);
    
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          priceId: priceId,
          interval: billingInterval,
          successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      console.log('📡 決済API応答:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ 決済APIエラー:', errorData);
        throw new Error('決済セッションの作成に失敗しました');
      }

      const { url } = await response.json();
      console.log('🔗 決済URL取得:', url);
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('決済URLが取得できませんでした');
      }
    } catch (error) {
      console.error('❌ 決済エラー:', error);
      alert('決済処理でエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            シンプルで透明性のある料金プラン
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            チームの規模と必要な機能に応じてプランをお選びください。
            年間プランなら最大17%お得になります。
          </p>
          
          {/* 請求間隔切り替え */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-md border">
              {billingIntervalConfig.map((interval) => (
                <button
                  key={interval.type}
                  onClick={() => setBillingInterval(interval.type)}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
                    billingInterval === interval.type
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {interval.label}
                  {interval.type === 'yearly' && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      お得
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 年間プランの節約表示 */}
          {billingInterval === 'yearly' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto mb-8">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-800 font-medium">
                  年間プランで最大 ¥17,800 の節約！
                </span>
              </div>
            </div>
          )}
        </div>

        {/* プランカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingInterval={billingInterval}
              isLoading={isLoading === plan.id}
              onSelect={() => handleSelectPlan(plan)}
            />
          ))}
        </div>

        {/* 機能比較表 */}
        <div className="mt-20">
          <FeatureComparisonTable plans={pricingPlans} />
        </div>

        {/* 信頼性セクション */}
        <div className="mt-20 bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              なぜLinkSenseが選ばれるのか
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              数百のチームが既にLinkSenseを使用してコミュニケーション効果を向上させています
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                即座に開始
              </h4>
              <p className="text-gray-600">
                複雑な設定は不要。数分でチーム分析を開始できます。
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                実証済みの効果
              </h4>
              <p className="text-gray-600">
                平均40%のコミュニケーション改善を実現しています。
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                継続的サポート
              </h4>
              <p className="text-gray-600">
                専門チームによる充実したサポートで安心してご利用いただけます。
              </p>
            </div>
          </div>
        </div>

        {/* FAQ セクション */}
        <div className="mt-20">
          <FAQSection />
        </div>
      </div>
    </div>
  );
}

// 料金プランカードコンポーネント
function PricingCard({ 
  plan, 
  billingInterval,
  isLoading,
  onSelect 
}: { 
  plan: StripePlan;
  billingInterval: BillingInterval;
  isLoading: boolean;
  onSelect: () => void; 
}) {
  const priceDisplay = formatPrice(plan, billingInterval);
  const comparison = generatePlanComparison(plan);

  return (
    <div className={`relative bg-white rounded-xl shadow-lg p-8 transition-all duration-200 hover:shadow-xl ${
      isRecommendedPlan(plan) ? 'ring-2 ring-blue-500 scale-105' : ''
    }`}>
      
      {/* 人気プランバッジ */}
      {isRecommendedPlan(plan) && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg flex items-center">
            <Star className="w-4 h-4 mr-1" />
            人気プラン
          </span>
        </div>
      )}

      {/* 無料プランバッジ */}
      {isFreeplan(plan) && (
        <div className="absolute top-4 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            無料
          </span>
        </div>
      )}

      {/* 割引バッジ */}
      {billingInterval === 'yearly' && plan.yearlyDiscount && (
        <div className="absolute top-4 right-4">
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {Math.round(plan.yearlyDiscount * 100)}% OFF
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {plan.name}
        </h3>
        <p className="text-gray-600 mb-4">{plan.description}</p>
        
        <div className="mb-2">
          <span className="text-4xl font-bold text-gray-900">
            {priceDisplay.formatted}
          </span>
        </div>
        
        {/* 年間プランの月額換算表示 */}
        {billingInterval === 'yearly' && plan.yearlyDiscount && (
          <p className="text-sm text-gray-500 mb-1">
            月割り ¥{Math.round((plan.price * 12 * (1 - plan.yearlyDiscount)) / 12).toLocaleString()}
          </p>
        )}
        
        {/* 年間プランの節約額表示 */}
        {billingInterval === 'yearly' && plan.yearlyDiscount && (
          <p className="text-sm text-green-600 font-medium">
            年間 ¥{(plan.price * 12 * plan.yearlyDiscount).toLocaleString()} お得
          </p>
        )}
      </div>

      {/* 機能リスト */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTAボタン */}
      <button
        onClick={onSelect}
        disabled={isLoading}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
          isFreeplan(plan)
            ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
            : isRecommendedPlan(plan)
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
            : 'bg-gray-800 text-white hover:bg-gray-900 shadow-lg hover:shadow-xl'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            処理中...
          </div>
        ) : (
          <>
            {isFreeplan(plan) ? '無料で始める' : 'プランを選択'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </button>
    </div>
  );
}

// 機能比較表コンポーネント
function FeatureComparisonTable({ plans }: { plans: StripePlan[] }) {
  const allFeatures = [
    { name: 'チーム健全性分析', starter: true, professional: true, enterprise: true },
    { name: 'メンバー数', starter: '最大3名', professional: '最大50名', enterprise: '無制限' },
    { name: 'レポート頻度', starter: '月次', professional: '週次', enterprise: '日次' },
    { name: 'リアルタイム監視', starter: false, professional: true, enterprise: true },
    { name: 'カスタムダッシュボード', starter: false, professional: true, enterprise: true },
    { name: 'API連携', starter: false, professional: true, enterprise: true },
    { name: 'AI予測分析', starter: false, professional: false, enterprise: true },
    { name: 'オンプレミス対応', starter: false, professional: false, enterprise: true },
    { name: 'SLA保証', starter: false, professional: false, enterprise: true },
    { name: 'サポート', starter: 'コミュニティ', professional: '優先サポート', enterprise: '専任サポート' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-xl font-bold text-gray-900">詳細機能比較</h3>
        <p className="text-gray-600 text-sm mt-1">各プランで利用できる機能の詳細比較表</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">機能</th>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Starter</th>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Professional</th>
              <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Enterprise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allFeatures.map((feature, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{feature.name}</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  {typeof feature.starter === 'boolean' ? (
                    feature.starter ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )
                  ) : (
                    feature.starter
                  )}
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  {typeof feature.professional === 'boolean' ? (
                    feature.professional ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )
                  ) : (
                    feature.professional
                  )}
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  {typeof feature.enterprise === 'boolean' ? (
                    feature.enterprise ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )
                  ) : (
                    feature.enterprise
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// FAQセクションコンポーネント
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: '年間プランの支払いはいつ行われますか？',
      answer: '年間プランは契約時に1年分の料金を一括でお支払いいただきます。次回の請求は1年後となります。'
    },
    {
      question: 'プランの変更は可能ですか？',
      answer: 'はい、いつでもプランの変更が可能です。アップグレードは即座に反映され、ダウングレードは次の請求サイクルから適用されます。'
    },
    {
      question: '無料プランから有料プランへの移行時にデータは引き継がれますか？',
      answer: 'はい、すべてのデータは引き継がれます。分析履歴やチーム設定なども継続してご利用いただけます。'
    },
    {
      question: '年間プランを途中でキャンセルした場合、返金はありますか？',
      answer: '年間プランの途中キャンセルの場合、未使用期間分を日割り計算で返金いたします。詳細は利用規約をご確認ください。'
    },
    {
      question: 'チームメンバーの追加に追加料金はかかりますか？',
      answer: 'プランで定められた人数内であれば追加料金はかかりません。上限を超える場合は上位プランへのアップグレードが必要です。'
    },
    {
      question: 'セキュリティ対策はどのようになっていますか？',
      answer: '業界標準のSSL暗号化、定期的なセキュリティ監査、GDPR準拠のデータ保護を実施しています。Enterpriseプランではさらに高度なセキュリティ機能を提供します。'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">よくある質問</h3>
        <p className="text-gray-600">料金プランに関するよくある質問と回答</p>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
              <ArrowRight
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openIndex === index ? 'rotate-90' : ''
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4">
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}