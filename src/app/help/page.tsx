'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  helpful: number;
  lastUpdated: string;
}

interface SupportTicket {
  id: string;
  title: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  lastResponse: string;
}

const HelpPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('faq');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    description: ''
  });

  useEffect(() => {
    const fetchHelpData = async () => {
      setIsLoading(true);
      
      // モックFAQデータ
      const mockFAQs: FAQ[] = [
        {
          id: '1',
          category: 'getting-started',
          question: 'LinkSenseの基本的な使い方を教えてください',
          answer: `LinkSenseは組織のチーム健全性を分析・監視するツールです。以下の手順で開始できます：

1. **ダッシュボード**: 組織全体の健全性スコアと主要メトリクスを確認
2. **チームメンバー**: 個別メンバーの状況を詳細に分析
3. **アラート**: 注意が必要な状況を即座に把握
4. **レポート**: 定期的な健全性レポートを生成・共有
5. **設定**: 通知やプライバシー設定をカスタマイズ

各機能の詳細な使い方は、該当ページの「？」アイコンからヘルプを確認できます。`,
          tags: ['基本操作', 'チュートリアル', '初心者'],
          helpful: 156,
          lastUpdated: '2025-05-20'
        },
        {
          id: '2',
          category: 'features',
          question: '健全性スコアはどのように計算されますか？',
          answer: `健全性スコアは以下の5つの要素を総合的に評価して算出されます：

**1. ストレスレベル (20%)**
- 作業負荷、締切プレッシャー、技術的課題の複雑さ
- 低いほど良い（逆算）

**2. チーム満足度 (25%)**
- 職場環境、同僚との関係、仕事内容への満足度
- アンケート結果とコミュニケーション分析

**3. エンゲージメント (20%)**
- 積極的な参加、提案頻度、自主的な学習
- 会議参加率、貢献度指標

**4. ワークライフバランス (20%)**
- 勤務時間、休暇取得率、時間外労働
- カレンダー分析とアクティビティ監視

**5. スキル成長 (15%)**
- 学習活動、スキル向上、目標達成率
- 研修参加、資格取得、プロジェクト成果

スコアは0-100で表示され、80以上が「良好」、60-79が「普通」、60未満が「要注意」となります。`,
          tags: ['健全性スコア', 'メトリクス', '計算方法'],
          helpful: 203,
          lastUpdated: '2025-05-18'
        },
        {
          id: '3',
          category: 'privacy',
          question: '個人データのプライバシーはどのように保護されていますか？',
          answer: `LinkSenseは最高レベルのプライバシー保護を提供します：

**データ暗号化**
- 保存時・転送時ともにAES-256暗号化
- エンドツーエンド暗号化による通信保護

**アクセス制御**
- ロールベースアクセス制御（RBAC）
- 最小権限の原則に基づく情報アクセス
- 二要素認証（2FA）対応

**データ匿名化**
- 個人を特定できない形でのデータ集計
- 統計処理時の個人情報除去
- 差分プライバシー技術の採用

**コンプライアンス**
- GDPR（EU一般データ保護規則）完全準拠
- SOC 2 Type II認証取得
- ISO 27001情報セキュリティ管理システム認証

**ユーザー制御**
- データ削除権の保証
- 設定画面からの詳細なプライバシー制御
- データポータビリティ対応`,
          tags: ['プライバシー', 'セキュリティ', 'GDPR', 'データ保護'],
          helpful: 89,
          lastUpdated: '2025-05-15'
        },
        {
          id: '4',
          category: 'integrations',
          question: 'Slackとの連携でどのような情報が取得されますか？',
          answer: `Slack連携では以下の情報を分析に活用します：

**取得する情報**
- メッセージ送信頻度（内容は取得しません）
- チャンネル参加状況
- リアクション（絵文字）の使用パターン
- オンライン/オフライン状況
- 応答時間パターン

**分析内容**
- コミュニケーション活発度
- チーム内の連携状況
- ストレス指標（応答時間の変化など）
- エンゲージメントレベル

**プライバシー保護**
- メッセージ内容は一切取得・保存しません
- 個人を特定できない統計データのみ使用
- ユーザーが連携を無効化可能
- GDPR準拠の同意管理

設定画面から詳細な制御が可能で、いつでも連携を停止できます。`,
          tags: ['Slack', '統合', 'プライバシー', 'データ取得'],
          helpful: 134,
          lastUpdated: '2025-05-22'
        },
        {
          id: '5',
          category: 'troubleshooting',
          question: 'ダッシュボードにデータが表示されない場合の対処法',
          answer: `データが表示されない場合、以下を順番に確認してください：

**1. 権限の確認**
- 適切なロール（管理者・マネージャー）が割り当てられているか
- チーム/部署の閲覧権限があるか

**2. データ同期の確認**
- 統合設定ページで外部ツールが正常に接続されているか
- 最終同期時刻が最近のものか
- エラーメッセージが表示されていないか

**3. フィルター設定の確認**
- 期間フィルターが適切に設定されているか
- チーム/部署フィルターで除外されていないか

**4. ブラウザの問題**
- ページの再読み込み（Ctrl+F5）
- ブラウザキャッシュのクリア
- 別のブラウザでの動作確認

**5. システム状態の確認**
- ステータスページでサービス稼働状況を確認
- メンテナンス情報の確認

それでも解決しない場合は、サポートチケットを作成してください。`,
          tags: ['トラブルシューティング', 'データ', 'ダッシュボード'],
          helpful: 78,
          lastUpdated: '2025-05-25'
        },
        {
          id: '6',
          category: 'billing',
          question: 'プランのアップグレード・ダウングレードはいつでも可能ですか？',
          answer: `はい、プランの変更はいつでも可能です：

**アップグレード**
- 即座に適用（プロレート課金）
- 新機能へのアクセスが即座に有効
- 追加料金は次回請求時に調整

**ダウングレード**
- 次回請求サイクルから適用
- 現在の期間中は上位プランの機能を継続利用可能
- データは制限内に調整が必要な場合があります

**年間プランの場合**
- アップグレード：差額を即座に請求
- ダウングレード：次回更新時に適用
- 返金ポリシーに基づく差額調整

**注意事項**
- ダウングレード時、利用制限を超える場合は事前通知
- データエクスポート機能で重要情報のバックアップ推奨
- カスタム設定は可能な限り保持

サブスクリプションページから簡単に変更できます。`,
          tags: ['料金', 'プラン変更', 'アップグレード', 'ダウングレード'],
          helpful: 67,
          lastUpdated: '2025-05-19'
        }
      ];

      // モックサポートチケットデータ
      const mockTickets: SupportTicket[] = [
        {
          id: 'TICK-001',
          title: 'Slack統合でデータが同期されない',
          status: 'in-progress',
          priority: 'high',
          createdAt: '2025-05-24T09:00:00Z',
          lastResponse: '2025-05-25T14:30:00Z'
        },
        {
          id: 'TICK-002',
          title: 'レポート生成時のエラーについて',
          status: 'resolved',
          priority: 'medium',
          createdAt: '2025-05-20T16:45:00Z',
          lastResponse: '2025-05-21T10:15:00Z'
        },
        {
          id: 'TICK-003',
          title: '新機能のリクエスト：カスタムダッシュボード',
          status: 'open',
          priority: 'low',
          createdAt: '2025-05-18T11:20:00Z',
          lastResponse: '2025-05-18T11:20:00Z'
        }
      ];

      setTimeout(() => {
        setFaqs(mockFAQs);
        setTickets(mockTickets);
        setIsLoading(false);
      }, 500);
    };

    fetchHelpData();
    return undefined;
  }, []);

  const categories = [
    { id: 'all', name: 'すべて' },
    { id: 'getting-started', name: '使い方' },
    { id: 'features', name: '機能' },
    { id: 'integrations', name: '統合' },
    { id: 'privacy', name: 'プライバシー' },
    { id: 'billing', name: '料金' },
    { id: 'troubleshooting', name: 'トラブル' }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // モック送信処理
    const newTicket: SupportTicket = {
      id: `TICK-${String(tickets.length + 1).padStart(3, '0')}`,
      title: contactForm.subject,
      status: 'open',
      priority: contactForm.priority as any,
      createdAt: new Date().toISOString(),
      lastResponse: new Date().toISOString()
    };
    setTickets([newTicket, ...tickets]);
    setContactForm({ subject: '', category: 'general', priority: 'medium', description: '' });
    setShowContactForm(false);
    setActiveTab('tickets');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">ヘルプ・サポート</h1>
            <p className="text-lg text-gray-600 mb-6">
              LinkSenseの使い方やよくある質問、サポートへのお問い合わせ
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowContactForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.456L3 21l2.456-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
                サポートに問い合わせ
              </button>
              <a
                href="mailto:support@linksense.com"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                メールでお問い合わせ
              </a>
            </div>
          </div>

          {/* クイックリンク */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">クイックスタートガイド</h3>
              <p className="text-gray-600 text-sm mb-4">基本的な使い方を5分で学習</p>
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                ガイドを見る →
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ビデオチュートリアル</h3>
              <p className="text-gray-600 text-sm mb-4">動画で分かりやすく解説</p>
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                動画を見る →
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ベストプラクティス</h3>
              <p className="text-gray-600 text-sm mb-4">効果的な活用方法</p>
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                事例を見る →
              </button>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'faq', label: 'よくある質問', icon: '❓' },
              { id: 'tickets', label: 'サポートチケット', icon: '🎫' },
              { id: 'resources', label: 'リソース', icon: '📚' },
              { id: 'status', label: 'システム状況', icon: '🔧' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* FAQ タブ */}
        {activeTab === 'faq' && (
          <div>
            {/* 検索・フィルター */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="質問や回答から検索..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* FAQ一覧 */}
            <div className="space-y-4">
              {filteredFAQs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-lg shadow-sm">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                    <svg
                      className={`w-5 h-5 text-gray-500 transform transition-transform ${
                        expandedFAQ === faq.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedFAQ === faq.id && (
                    <div className="px-6 pb-6">
                      <div className="prose max-w-none text-gray-700 mb-4">
                        {faq.answer.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-2 whitespace-pre-line">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {faq.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>👍 {faq.helpful}人が参考になったと回答</span>
                          <span>更新: {new Date(faq.lastUpdated).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200">
                          👍 参考になった
                        </button>
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                          💬 コメント
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">該当するFAQが見つかりません</h3>
                <p className="mt-1 text-sm text-gray-500">検索条件を変更するか、サポートにお問い合わせください。</p>
              </div>
            )}
          </div>
        )}

        {/* サポートチケット タブ */}
        {activeTab === 'tickets' && (
          <div>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">あなたのサポートチケット</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">#{ticket.id}</span>
                        <h4 className="text-gray-900">{ticket.title}</h4>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status === 'open' ? '未対応' :
                           ticket.status === 'in-progress' ? '対応中' :
                           ticket.status === 'resolved' ? '解決済み' : '完了'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority === 'urgent' ? '緊急' :
                           ticket.priority === 'high' ? '高' :
                           ticket.priority === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>作成日: {new Date(ticket.createdAt).toLocaleDateString('ja-JP')}</span>
                      <span>最終更新: {new Date(ticket.lastResponse).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {tickets.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">サポートチケットはありません</h3>
                  <p className="mt-1 text-sm text-gray-500">問題がある場合は、新しいチケットを作成してください。</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* リソース タブ */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'API ドキュメント',
                description: '開発者向けAPI仕様書',
                icon: '🔧',
                link: '/docs/api',
                category: '開発者'
              },
              {
                title: 'セキュリティガイド',
                description: 'セキュリティベストプラクティス',
                icon: '🔒',
                link: '/docs/security',
                category: 'セキュリティ'
              },
              {
                title: 'データプライバシー',
                description: 'データ取り扱いポリシー',
                icon: '🛡️',
                link: '/docs/privacy',
                category: 'プライバシー'
              },
              {
                title: '統合ガイド',
                description: '外部ツール連携方法',
                icon: '🔗',
                link: '/docs/integrations',
                category: '統合'
              },
              {
                title: 'トラブルシューティング',
                description: '一般的な問題の解決方法',
                icon: '🔍',
                link: '/docs/troubleshooting',
                category: 'サポート'
              },
              {
                title: 'リリースノート',
                description: '最新アップデート情報',
                icon: '📝',
                link: '/docs/releases',
                category: 'アップデート'
              }
            ].map((resource, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{resource.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                    <span className="text-sm text-gray-500">{resource.category}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  詳細を見る →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* システム状況 タブ */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">システム稼働状況</h3>
              <div className="space-y-4">
                {[
                  { service: 'Webアプリケーション', status: 'operational', uptime: '99.9%' },
                  { service: 'API サービス', status: 'operational', uptime: '99.8%' },
                  { service: 'データ同期', status: 'operational', uptime: '99.7%' },
                  { service: 'レポート生成', status: 'maintenance', uptime: '99.5%' },
                  { service: '通知システム', status: 'operational', uptime: '99.9%' }
                ].map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        service.status === 'operational' ? 'bg-green-500' :
                        service.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium text-gray-900">{service.service}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">稼働率: {service.uptime}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        service.status === 'operational' ? 'bg-green-100 text-green-800' :
                        service.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {service.status === 'operational' ? '正常' :
                         service.status === 'maintenance' ? 'メンテナンス中' : '障害'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">最近のお知らせ</h3>
              <div className="space-y-4">
                {[
                  {
                    date: '2025-05-26',
                    title: '新機能: AI予測分析の精度向上',
                    type: 'update',
                    description: '機械学習モデルを更新し、健全性予測の精度を15%向上させました。'
                  },
                  {
                    date: '2025-05-24',
                    title: '定期メンテナンス完了',
                    type: 'maintenance',
                    description: 'データベース最適化とセキュリティアップデートを実施しました。'
                  },
                  {
                    date: '2025-05-20',
                    title: 'Slack統合の機能拡張',
                    type: 'feature',
                    description: 'チャンネル別分析とカスタムアラート機能を追加しました。'
                  }
                ].map((news, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{news.title}</span>
                      <span className="text-sm text-gray-500">{news.date}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{news.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* お問い合わせモーダル */}
        {showContactForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleContactSubmit} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">サポートチケットを作成</h3>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      件名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                      <select
                        value={contactForm.category}
                        onChange={(e) => setContactForm({...contactForm, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="general">一般的な質問</option>
                        <option value="technical">技術的な問題</option>
                        <option value="billing">料金・請求</option>
                        <option value="feature">機能リクエスト</option>
                        <option value="bug">バグ報告</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">優先度</label>
                      <select
                        value={contactForm.priority}
                        onChange={(e) => setContactForm({...contactForm, priority: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">低</option>
                        <option value="medium">中</option>
                        <option value="high">高</option>
                        <option value="urgent">緊急</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      詳細説明 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={contactForm.description}
                      onChange={(e) => setContactForm({...contactForm, description: e.target.value})}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="問題の詳細、発生状況、期待する結果などを具体的にご記入ください..."
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    チケットを作成
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpPage;