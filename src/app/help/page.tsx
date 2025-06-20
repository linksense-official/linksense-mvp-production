'use client';

import React, { useState } from 'react';
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  Search, 
  ChevronDown, 
  ChevronRight,
  BookOpen,
  Settings,
  Shield,
  Zap,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Play
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // セットアップ・導入
  {
    id: '1',
    category: 'setup',
    question: 'LinkSenseの導入にはどのくらい時間がかかりますか？',
    answer: 'LinkSenseの導入は非常簡単です。アカウント作成後、各サービス（Slack、Discord、Teams、Google Meet）との連携は1つあたり約2-3分で完了します。全体で10-15分程度でチーム分析を開始できます。'
  },
  {
    id: '2',
    category: 'setup',
    question: 'どのサービスと連携できますか？',
    answer: '現在、以下の4つの主要サービスと連携可能です：\n• Slack - チーム内コミュニケーション分析\n• Discord - コミュニティ・サーバー分析\n• Microsoft Teams - 企業内チーム分析\n• Google Meet - 会議・カレンダー分析\n\n今後、Notion、Asana等の追加統合も予定しています。'
  },
  {
    id: '3',
    category: 'setup',
    question: '管理者権限は必要ですか？',
    answer: '基本的な分析機能には管理者権限は不要です。ただし、以下の高度な機能には管理者権限が必要な場合があります：\n• 組織全体のメンバー情報取得\n• チーム構造の詳細分析\n• 管理者向けレポート機能\n\n個人レベルでの利用であれば、通常のユーザー権限で十分ご利用いただけます。'
  },

  // 機能・分析
  {
    id: '4',
    category: 'features',
    question: 'どのような分析ができますか？',
    answer: 'LinkSenseでは以下の分析が可能です：\n\n📊 チーム健全性分析\n• コミュニケーション頻度測定\n• メンバー参加状況の可視化\n• 孤立メンバーの検出\n\n📈 生産性インサイト\n• チャンネル・チーム活動状況\n• 会議効率性の分析\n• ワークフローの最適化提案\n\n🎯 カスタムレポート\n• 週次・月次レポート生成\n• 部門別分析\n• トレンド分析'
  },
  {
    id: '5',
    category: 'features',
    question: 'リアルタイムで分析結果は更新されますか？',
    answer: 'はい、LinkSenseはリアルタイム分析に対応しています：\n\n⚡ リアルタイム更新\n• ダッシュボードデータ：5分間隔\n• アラート通知：即座\n• チーム状況：15分間隔\n\n📅 定期更新\n• 詳細レポート：毎日午前6時\n• 週次サマリー：毎週月曜日\n• 月次分析：毎月1日\n\nEnterprise プランでは、更新頻度をカスタマイズ可能です。'
  },
  {
    id: '6',
    category: 'features',
    question: 'アラート機能について教えてください',
    answer: 'LinkSenseのアラート機能は、チームの健全性に関する重要な変化を即座に通知します：\n\n🚨 重要アラート\n• 孤立メンバーの検出\n• コミュニケーション急減\n• チーム参加率の低下\n\n📧 通知方法\n• メール通知\n• ダッシュボード内通知\n• Slack/Teams連携通知\n\n⚙️ カスタマイズ\n• 通知頻度の調整\n• アラートしきい値の設定\n• 通知対象者の指定'
  },

  // プライバシー・セキュリティ
  {
    id: '7',
    category: 'privacy',
    question: 'メッセージの内容は分析されますか？',
    answer: 'いいえ、LinkSenseはメッセージの内容を読み取ったり保存したりすることはありません。\n\n🔒 分析対象（安全）\n• メッセージ送信頻度\n• チャンネル参加状況\n• アクティブ時間帯\n• メンバー間のやり取り頻度\n\n❌ 分析対象外\n• メッセージの具体的内容\n• 個人的な会話内容\n• ファイル・画像の内容\n• プライベートな情報\n\nプライバシーファーストの設計により、個人情報は厳格に保護されます。'
  },
  {
    id: '8',
    category: 'privacy',
    question: 'データはどこに保存されますか？',
    answer: 'お客様のデータは以下の方針で安全に管理されています：\n\n🌍 データセンター\n• 主要：日本国内（AWS Tokyo リージョン）\n• バックアップ：米国（暗号化済み）\n• GDPR準拠の適切な保護措置\n\n🔐 セキュリティ対策\n• AES-256暗号化\n• TLS 1.3通信暗号化\n• SOC2 Type II準拠\n• 定期的セキュリティ監査\n\n📝 データ保持期間\n• アクティブデータ：最大2年\n• バックアップ：最大90日\n• アカウント削除時：30日以内に完全削除'
  },

  // 料金・プラン
  {
    id: '9',
    category: 'pricing',
    question: '料金プランについて教えてください',
    answer: 'LinkSenseでは、チームサイズに応じた柔軟な料金プランをご用意しています：\n\n🆓 Freeプラン（無料）\n• 最大50名まで\n• 基本ダッシュボード\n• 月次レポート\n\n💼 Professional（¥2,980/月）\n• 最大500名まで\n• 高度な分析機能\n• 週次レポート\n• メール通知\n\n🏢 Enterprise（¥9,800/月）\n• 無制限メンバー\n• リアルタイム分析\n• API アクセス\n• 専用サポート\n\n全プランで14日間の無料トライアルをご利用いただけます。'
  },
  {
    id: '10',
    category: 'pricing',
    question: 'プラン変更はいつでも可能ですか？',
    answer: 'はい、プランの変更はいつでも可能です：\n\n⬆️ アップグレード\n• 即座に適用\n• 日割り計算で課金\n• データ移行は自動\n\n⬇️ ダウングレード\n• 次回請求日から適用\n• 現在の期間は継続利用可能\n• データは保持（制限内）\n\n💳 支払い方法\n• クレジットカード\n• 銀行振込（年間契約）\n• 請求書払い（Enterprise）\n\nご不明な点がございましたら、サポートチームまでお気軽にお問い合わせください。'
  },

  // トラブルシューティング
  {
    id: '11',
    category: 'troubleshooting',
    question: '連携がうまくいかない場合の対処法は？',
    answer: '連携でお困りの場合は、以下の手順をお試しください：\n\n🔧 基本的な対処法\n1. ブラウザの再読み込み\n2. 別のブラウザで試行\n3. プライベートモードで接続\n4. ブラウザキャッシュの削除\n\n⚙️ 権限関連\n• 必要な権限が付与されているか確認\n• 組織の管理者に権限申請\n• 2要素認証の一時無効化\n\n📞 それでも解決しない場合\n• サポートチャット（平日9-18時）\n• メールサポート（24時間以内返信）\n• 画面共有サポート（予約制）'
  },
  {
    id: '12',
    category: 'troubleshooting',
    question: 'データが表示されない・更新されない',
    answer: 'データ表示の問題については、以下をご確認ください：\n\n⏱️ 更新タイミング\n• 初回連携後：最大30分\n• 通常の更新：5-15分間隔\n• 大量データ：最大2時間\n\n🔍 確認項目\n1. 連携サービスでの活動があるか\n2. 必要な権限が維持されているか\n3. サービス側でのAPI制限\n4. ネットワーク接続状況\n\n🛠️ 解決方法\n• 統合設定の再接続\n• データ同期の手動実行\n• ページの完全リロード\n\n問題が継続する場合は、エラーメッセージのスクリーンショットと併せてサポートまでご連絡ください。'
  }
];

const categories = [
  { id: 'all', name: 'すべて', icon: BookOpen },
  { id: 'setup', name: 'セットアップ', icon: Settings },
  { id: 'features', name: '機能・分析', icon: BarChart3 },
  { id: 'privacy', name: 'プライバシー', icon: Shield },
  { id: 'pricing', name: '料金・プラン', icon: Zap },
  { id: 'troubleshooting', name: 'トラブル解決', icon: AlertTriangle }
];

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <HelpCircle className="h-10 w-10 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">ヘルプ・サポート</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              LinkSenseの使い方、よくある質問、トラブル解決方法をご案内します
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* クイックアクセス */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">チャットサポート</h3>
            </div>
            <p className="text-gray-600 mb-4">
              リアルタイムでサポートスタッフと直接やり取りできます
            </p>
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Clock className="h-4 w-4 mr-1" />
              平日 9:00-18:00 (JST)
            </div>
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
              チャットを開始
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">メールサポート</h3>
            </div>
            <p className="text-gray-600 mb-4">
              詳細な質問や技術的な問題についてメールでお問い合わせ
            </p>
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Clock className="h-4 w-4 mr-1" />
              24時間以内に返信
            </div>
            <a 
              href="mailto:support@linksense-mvp.vercel.app"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              メールを送信
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <Play className="h-8 w-8 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">動画ガイド</h3>
            </div>
            <p className="text-gray-600 mb-4">
              セットアップから高度な機能まで、動画で分かりやすく解説
            </p>
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Users className="h-4 w-4 mr-1" />
              初心者から上級者まで
            </div>
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
              動画を見る
            </button>
          </div>
        </div>

        {/* 検索バー */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="質問を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* カテゴリフィルター */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ セクション */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">よくある質問</h2>
          <div className="max-w-4xl mx-auto">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">該当する質問が見つかりませんでした</p>
                <p className="text-gray-400 mt-2">検索条件を変更するか、直接サポートにお問い合わせください</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-lg shadow-sm border">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                      {expandedFAQ === faq.id ? (
                        <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="px-6 pb-4">
                        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 追加リソース */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">その他のリソース</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">ユーザーガイド</h3>
              <p className="text-gray-600 text-sm mb-4">詳細な機能説明と使い方</p>
              <a href="#" className="text-blue-600 hover:underline text-sm flex items-center justify-center">
                詳しく見る <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <Settings className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">API ドキュメント</h3>
              <p className="text-gray-600 text-sm mb-4">開発者向けAPI仕様書</p>
              <a href="#" className="text-green-600 hover:underline text-sm flex items-center justify-center">
                詳しく見る <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">コミュニティ</h3>
              <p className="text-gray-600 text-sm mb-4">ユーザー同士の情報交換</p>
              <a href="#" className="text-purple-600 hover:underline text-sm flex items-center justify-center">
                参加する <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <Zap className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">アップデート</h3>
              <p className="text-gray-600 text-sm mb-4">新機能とリリース情報</p>
              <a href="#" className="text-orange-600 hover:underline text-sm flex items-center justify-center">
                確認する <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        </div>

        {/* 緊急時サポート */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">緊急時サポート</h3>
              <p className="text-red-800 mb-4">
                サービスに重大な問題が発生している場合、または緊急を要する問題については、
                以下の方法で即座にサポートチームにご連絡ください。
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="mailto:emergency@linksense-mvp.vercel.app"
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  緊急メール送信
                </a>
                <a 
                  href="tel:+81-3-XXXX-XXXX"
                  className="bg-white text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm"
                >
                  緊急電話サポート
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ステータスページ */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="font-semibold text-green-900">システム稼働状況</h3>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-green-800">メインサービス</p>
              <p className="text-xs text-green-600">正常稼働</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-green-800">API</p>
              <p className="text-xs text-green-600">正常稼働</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-green-800">データベース</p>
              <p className="text-xs text-green-600">正常稼働</p>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-green-800">統合サービス</p>
              <p className="text-xs text-green-600">正常稼働</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <a href="#" className="text-green-600 hover:underline text-sm">
              詳細なステータス情報を見る
            </a>
          </div>
        </div>

        {/* フッター */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">
            まだ解決しない問題がありますか？お気軽にお問い合わせください。
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="mailto:support@linksense-mvp.vercel.app"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              サポートに連絡
            </a>
            <a 
              href="/privacy"
              className="text-blue-600 hover:underline px-6 py-2"
            >
              プライバシーポリシー
            </a>
            <a 
              href="/terms"
              className="text-blue-600 hover:underline px-6 py-2"
            >
              利用規約
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            © 2025 LinkSense. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}