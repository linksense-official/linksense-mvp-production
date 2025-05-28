// src/app/pricing/page.tsx
'use client';

import React, { useState } from 'react';
import { pricingPlans, billingIntervals } from '@/data/pricing-plans';
import { StripePlan } from '@/types/subscription';
import { formatPrice, generatePlanComparison, getPriceId, isFreeplan } from '@/lib/pricing-utils';

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: StripePlan) => {
    console.log('🎯 プラン選択:', plan.name, plan.id, billingInterval);
    
    const priceId = getPriceId(plan, billingInterval);
    
    // 無料プランの場合は決済をスキップ
    if (plan.isFree) {
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

        // 成功メッセージ
        const successMessage = `🎉 ${plan.name}プランを開始しました！

✅ ${plan.features.join('\n✅ ')}

チーム分析ページに移動します...`;
        alert(successMessage);

        // ローカルストレージに保存
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

    // 有料プランの場合はStripe決済
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
            料金プラン
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            チームの規模と必要な機能に応じてプランをお選びください。
            年間プランなら最大17%お得になります。
          </p>
          
          {/* 請求間隔切り替え */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-md border">
              {billingIntervals.map((interval) => (
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
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
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
  billingInterval: 'monthly' | 'yearly';
  isLoading: boolean;
  onSelect: () => void; 
}) {
  const priceDisplay = formatPrice(plan, billingInterval);
  const comparison = generatePlanComparison(plan);

  return (
    <div className={`relative bg-white rounded-xl shadow-lg p-8 transition-all duration-200 hover:shadow-xl ${
      plan.recommended ? 'ring-2 ring-blue-500 scale-105' : ''
    }`}>
      
      {/* バッジ */}
      {plan.recommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
            人気プラン
          </span>
        </div>
      )}

      {plan.isFree && (
        <div className="absolute top-4 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            無料
          </span>
        </div>
      )}

      {priceDisplay.discount && (
        <div className="absolute top-4 right-4">
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {priceDisplay.discount}
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
            {priceDisplay.amount}
          </span>
          <span className="text-gray-600 text-lg">{priceDisplay.interval}</span>
        </div>
        
        {priceDisplay.monthlyEquivalent && (
          <p className="text-sm text-gray-500 mb-1">
            {priceDisplay.monthlyEquivalent}
          </p>
        )}
        
        {priceDisplay.savings && (
          <p className="text-sm text-green-600 font-medium">
            {priceDisplay.savings}
          </p>
        )}
      </div>

      {/* 機能リスト */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA ボタン */}
      <button
        onClick={onSelect}
        disabled={isLoading}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          plan.isFree
            ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
            : plan.recommended
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
            : 'bg-gray-800 text-white hover:bg-gray-900 shadow-lg hover:shadow-xl'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            処理中...
          </div>
        ) : plan.isFree ? (
          '無料で始める'
        ) : (
          'プランを選択'
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
        <h3 className="text-xl font-bold text-gray-900">機能比較表</h3>
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
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    feature.starter
                  )}
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  {typeof feature.professional === 'boolean' ? (
                    feature.professional ? (
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : (
                    feature.professional
                  )}
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  {typeof feature.enterprise === 'boolean' ? (
                    feature.enterprise ? (
                      <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
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

// FAQ セクションコンポーネント
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
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">よくある質問</h3>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4">
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}