'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
  const { user, loading } = useAuth();

  const getTrialButtonLink = () => {
    if (loading) return '/register';
    if (user) {
      return '/subscription';
    }
    return '/register';
  };

  const getTrialButtonText = () => {
    if (loading) return '無料トライアルを開始';
    if (user) {
      return '無料トライアルを開始';
    }
    return '無料トライアルを開始';
  };

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
              {!loading && (
                <>
                  {user ? (
                    <Link href="/dashboard">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        ダッシュボード
                      </Button>
                    </Link>
                  ) : (
                    <>
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
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            チーム健全性分析で組織力を最大化
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            7つの主要コミュニケーションプラットフォームを統合し、
            データドリブンな洞察でチームのパフォーマンスと健全性を向上させます。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={getTrialButtonLink()}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                {getTrialButtonText()}
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

      {/* 主要機能セクション */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            包括的なチーム健全性分析
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            リアルタイムでチームの状態を監視し、問題を早期発見・解決
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">リアルタイム健全性監視</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 text-center leading-relaxed">
                バーンアウトリスク、エンゲージメント低下、コミュニケーション障害を
                早期に検出し、チームの健全性を維持します。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">統合プラットフォーム分析</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 text-center leading-relaxed">
                Slack、Teams、Zoom等の7つのプラットフォームを統合し、
                統一された視点でチーム状況を把握できます。
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">AI駆動インサイト</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600 text-center leading-relaxed">
                機械学習アルゴリズムによる高度な分析で、
                チーム改善のための具体的なアクションプランを提供します。
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
              主要プラットフォーム完全統合
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              日本・グローバル市場の主要コミュニケーションツールに対応
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 items-center justify-items-center">
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
              <span className="text-sm font-medium text-gray-700">LINE WORKS</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Zap className="w-8 h-8 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Zoom</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Globe className="w-8 h-8 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Google Meet</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Discord</span>
            </div>
          </div>
        </div>
      </section>

      {/* 価値提案セクション */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            なぜLinkSenseが選ばれるのか
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
                  バーンアウト早期検出
                </h3>
                <p className="text-gray-600">
                  AIアルゴリズムによりチームメンバーのストレス状況を分析し、
                  バーンアウトのリスクを事前に検知・対策を提案します。
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  コミュニケーション最適化
                </h3>
                <p className="text-gray-600">
                  チーム内の情報フローを可視化し、コミュニケーションボトルネックを
                  特定して生産性向上を支援します。
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  エンタープライズ対応
                </h3>
                <p className="text-gray-600">
                  大規模組織にも対応したセキュリティ基準と、
                  管理者向けの包括的なダッシュボード機能を提供します。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-4 text-white">今すぐ始めませんか？</h3>
            <p className="text-blue-50 mb-6 leading-relaxed">
              LinkSenseでチーム健全性を向上させ、
              持続可能な高パフォーマンス組織を構築しましょう。
            </p>
            <Link href={getTrialButtonLink()}>
              <button 
                className="inline-flex items-center px-6 py-3 bg-white text-blue-700 font-bold rounded-lg shadow-lg hover:bg-blue-50 hover:shadow-xl transition-all duration-200"
              >
                {getTrialButtonText()}
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* 実績セクション */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">100+</div>
              <div className="text-gray-400">導入企業数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">7/7</div>
              <div className="text-gray-400">統合サービス完成</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">99.9%</div>
              <div className="text-gray-400">システム稼働率</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400 mb-2">50%</div>
              <div className="text-gray-400">チーム健全性向上</div>
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
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                利用規約
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
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