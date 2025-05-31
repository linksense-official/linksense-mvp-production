// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Shield, 
  Zap, 
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Globe,
  Lock,
  Activity,
  Target
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ナビゲーション */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">LinkSense</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  ログイン
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  無料で始める
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* メインセクション */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            チームコミュニケーションを変革する
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            LinkSenseは、すべてのコミュニケーションプラットフォームを横断した包括的な分析を提供し、
            データドリブンな洞察を通じて、より強固で結束したチームの構築をサポートします。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                無料トライアルを開始
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3">
                料金プランを見る
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            包括的なコミュニケーション分析
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            すべてのプラットフォームでチームのコミュニケーションを監視、分析、最適化
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">リアルタイム分析</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 text-center leading-relaxed">
                統合されたすべてのプラットフォームで、コミュニケーションパターン、
                応答時間、チームエンゲージメントの即座な洞察を取得できます。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">チーム健全性モニタリング</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 text-center leading-relaxed">
                孤立リスク、コミュニケーションギャップ、より良いコラボレーションの
                機会を生産性に影響する前に特定します。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">実行可能な洞察</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 text-center leading-relaxed">
                データドリブンな分析に基づいて、チームダイナミクスと
                コミュニケーション効果を改善するためのパーソナライズされた推奨事項を受け取ります。
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 統合プラットフォームセクション */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              シームレスなプラットフォーム統合
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              すべてのコミュニケーションツールを接続して、チームコラボレーションの統一されたビューを実現
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center justify-items-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Slack</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Microsoft Teams</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Globe className="w-8 h-8 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">ChatWork</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Discord</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Zap className="w-8 h-8 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Zoom</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Lock className="w-8 h-8 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Workplace</span>
            </div>
          </div>
        </div>
      </section>

      {/* メリットセクション */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            なぜLinkSenseを選ぶのか？
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  チーム孤立の削減
                </h3>
                <p className="text-gray-600">
                  孤立している可能性のあるチームメンバーを特定し、
                  パフォーマンスに影響する前にコミュニケーションギャップに積極的に対処します。
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  コミュニケーションフローの最適化
                </h3>
                <p className="text-gray-600">
                  組織内での情報の流れを理解し、
                  生産性を低下させるボトルネックを特定します。
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  データドリブンな意思決定
                </h3>
                <p className="text-gray-600">
                  実際の使用データに基づいて、チーム構造、コミュニケーションポリシー、
                  コラボレーションツールについて情報に基づいた決定を行います。
                </p>
              </div>
            </div>
          </div>

          {/* CTAセクション - 完全修正版 */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-4 text-white">今すぐ始めませんか？</h3>
            <p className="text-blue-50 mb-6 leading-relaxed">
              すでにLinkSenseを使用してコミュニケーションと
              コラボレーション効果を向上させている数百のチームに参加しましょう。
            </p>
            <Link href="/register">
              <button 
                className="inline-flex items-center px-6 py-3 bg-white text-blue-700 font-bold rounded-lg shadow-lg hover:bg-blue-50 hover:shadow-xl transition-all duration-200"
              >
                無料トライアルを開始
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 統計セクション */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">500+</div>
              <div className="text-gray-400">導入チーム数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">95%</div>
              <div className="text-gray-400">顧客満足度</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">250万+</div>
              <div className="text-gray-400">分析済みメッセージ</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">40%</div>
              <div className="text-gray-400">コミュニケーション改善</div>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold">LinkSense</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white">
                プライバシーポリシー
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">
                利用規約
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">
                お問い合わせ
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 LinkSense. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}