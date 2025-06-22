'use client';

import React from 'react';
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  Mail, 
  FileText, 
  Users, 
  Globe,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">プライバシーポリシー</h1>
              <p className="text-gray-600 mt-1">LinkSense - Team Health Analytics Platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 最終更新日 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-medium">最終更新日: 2025年6月19日</span>
          </div>
          <p className="text-blue-700 mt-2">
            このプライバシーポリシーは、LinkSenseサービスにおけるお客様の個人情報の取り扱いについて説明します。
          </p>
        </div>

        {/* 概要 */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Eye className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">1. 概要</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              LinkSense（以下「当サービス」）は、チームコミュニケーションの健全性分析を提供するSaaSプラットフォームです。
              当社は、お客様のプライバシーを最重要視し、個人情報保護法およびGDPR等の関連法規に準拠してサービスを提供しています。
            </p>
            <p className="text-gray-700 leading-relaxed">
              このプライバシーポリシーでは、当サービスがどのような情報を収集し、どのように使用・保護するかについて詳しく説明します。
            </p>
          </div>
        </section>

        {/* 収集する情報 */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">2. 収集する情報</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.1 アカウント情報</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>氏名、メールアドレス</li>
                  <li>プロフィール画像（提供された場合）</li>
                  <li>所属組織・チーム情報</li>
                  <li>アカウント設定情報</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.2 統合サービス情報</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Slack:</strong> チャンネル一覧、メンバー情報、メッセージ頻度（内容は収集しません）</li>
                  <li><strong>Discord:</strong> サーバー情報、メンバー一覧、チャンネル構造</li>
                  <li><strong>Microsoft Teams:</strong> チーム構成、チャンネル情報、プレゼンス状態</li>
                  <li><strong>Google Workspace:</strong> 組織構造、グループ情報、カレンダー空き状況</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2.3 利用状況データ</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>サービス利用ログ</li>
                  <li>アクセス頻度・時間</li>
                  <li>機能使用状況</li>
                  <li>エラーログ・診断情報</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 情報の使用目的 */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">3. 情報の使用目的</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">チーム分析・レポート生成</h4>
                  <p className="text-gray-700">コミュニケーション頻度、参加状況、チーム健全性の分析</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">サービス提供・改善</h4>
                  <p className="text-gray-700">機能提供、バグ修正、ユーザー体験の向上</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">セキュリティ・不正利用防止</h4>
                  <p className="text-gray-700">アカウントセキュリティ、不正アクセス検知</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">法的義務の履行</h4>
                  <p className="text-gray-700">法令遵守、規制当局への報告</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* データ保護・セキュリティ */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Lock className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">4. データ保護・セキュリティ</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">技術的保護措置</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>AES-256暗号化</li>
                  <li>TLS 1.3通信暗号化</li>
                  <li>多要素認証（2FA）</li>
                  <li>定期的セキュリティ監査</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">管理的保護措置</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>アクセス権限管理</li>
                  <li>従業員教育・研修</li>
                  <li>インシデント対応体制</li>
                  <li>第三者監査実施</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 第三者提供 */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">5. 第三者への情報提供</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-medium">
                ⚠️ 当サービスは、以下の場合を除き、お客様の個人情報を第三者に提供いたしません。
              </p>
            </div>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>お客様の明示的な同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合</li>
              <li>サービス提供に必要な業務委託先（秘密保持契約締結済み）</li>
            </ul>
          </div>
        </section>

        {/* データ保存期間 */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-teal-600" />
            <h2 className="text-2xl font-bold text-gray-900">6. データ保存期間</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-900">アカウント情報</span>
                <span className="text-gray-700">アカウント削除まで</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-900">分析データ</span>
                <span className="text-gray-700">最大2年間</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-900">利用ログ</span>
                <span className="text-gray-700">最大1年間</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-900">バックアップデータ</span>
                <span className="text-gray-700">最大90日間</span>
              </div>
            </div>
          </div>
        </section>

        {/* お客様の権利 */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">7. お客様の権利</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">データに関する権利</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>個人情報の開示請求</li>
                  <li>個人情報の訂正・削除</li>
                  <li>処理の制限・停止</li>
                  <li>データポータビリティ</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">権利行使方法</h3>
                <p className="text-gray-700 mb-2">以下の連絡先までご連絡ください：</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    <strong>メール:</strong> privacy@linksense-mvp.vercel.app<br/>
                    <strong>対応時間:</strong> 平日 9:00-18:00 (JST)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

          {/* メール使用同意セクション - 新規追加 */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">8. メール通信への明示的同意</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                事前同意の徹底
              </h3>
              <p className="text-green-800 mb-4">
                LinkSenseは、お客様のメールアドレスを使用する前に、必ず明示的な同意を取得します。
                同意なしにメール送信を行うことはありません。
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">同意取得が必要なメール送信</h4>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>チーム健全性アラート:</strong> 孤立メンバー検出時の重要通知</li>
                  <li><strong>定期レポート:</strong> 週次・月次のチーム分析レポート</li>
                  <li><strong>改善提案:</strong> AIによるチーム運営改善アドバイス</li>
                  <li><strong>セキュリティ通知:</strong> アカウント・データ保護関連の重要連絡</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">同意取得の方法</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">初回設定時</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 統合設定画面での明示的チェックボックス</li>
                      <li>• 各通知タイプごとの個別同意</li>
                      <li>• 同意内容の詳細説明表示</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h5 className="font-medium text-purple-900 mb-2">設定変更時</h5>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• 設定画面での同意状況確認</li>
                      <li>• ワンクリックでの配信停止</li>
                      <li>• 同意撤回の即座反映</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">お客様の権利</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ul className="text-gray-700 space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>配信停止権:</strong> いつでも全ての通知を停止可能</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>選択的同意:</strong> 通知タイプごとの個別設定</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>透明性:</strong> 送信理由と頻度の明確な説明</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span><strong>データ保護:</strong> 第三者への提供は一切なし</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-900 mb-2">重要な保証</h4>
                    <p className="text-yellow-800 text-sm">
                      LinkSenseは、マーケティング目的でのメール送信は一切行いません。
                      送信するメールは全て、チーム健全性の向上とサービス運営に必要な
                      重要な情報のみに限定されます。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cookie・トラッキング */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">9. Cookie・トラッキング技術</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">使用するCookie</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">必須Cookie</h4>
                      <p className="text-gray-700 text-sm">認証、セッション管理に必要</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">機能Cookie</h4>
                      <p className="text-gray-700 text-sm">ユーザー設定、言語設定の保存</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900">分析Cookie</h4>
                      <p className="text-gray-700 text-sm">サービス改善のための利用状況分析</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 国際データ転送 */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">10. 国際データ転送</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              当サービスは、サービス提供のため、お客様の個人情報を日本国外（主に米国）のデータセンターで処理する場合があります。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">適切な保護措置</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
                <li>EU標準契約条項（SCC）の適用</li>
                <li>GDPR第45条に基づく十分性認定国での処理</li>
                <li>プライバシーシールド認証事業者の利用</li>
                <li>データ処理契約（DPA）の締結</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 子供のプライバシー */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-pink-600" />
            <h2 className="text-2xl font-bold text-gray-900">11. 子供のプライバシー</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <p className="text-pink-800">
                当サービスは13歳未満のお子様を対象としておらず、意図的に13歳未満のお子様から個人情報を収集することはありません。
                13歳未満のお子様の個人情報を収集したことが判明した場合、速やかに削除いたします。
              </p>
            </div>
          </div>
        </section>

        {/* ポリシー変更 */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">12. プライバシーポリシーの変更</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              当社は、法令の変更やサービスの改善に伴い、このプライバシーポリシーを変更する場合があります。
              重要な変更については、サービス内通知またはメールにてお知らせいたします。
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>変更通知方法:</strong><br/>
                • サービス内ダッシュボード通知<br/>
                • 登録メールアドレスへの通知<br/>
                • 当ウェブサイトでの告知
              </p>
            </div>
          </div>
        </section>

        {/* お問い合わせ */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">13. お問い合わせ</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              プライバシーに関するご質問、ご不明な点がございましたら、以下の連絡先までお気軽にお問い合わせください。
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-4">LinkSense プライバシー担当</h3>
              <div className="space-y-2 text-blue-800">
                <p><strong>メールアドレス:</strong> privacy@linksense-mvp.vercel.app</p>
                <p><strong>サポートページ:</strong> https://linksense-mvp.vercel.app/help</p>
                <p><strong>対応時間:</strong> 平日 9:00-18:00 (日本標準時)</p>
                <p><strong>対応言語:</strong> 日本語、English</p>
              </div>
            </div>
          </div>
        </section>

        {/* フッター */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            © 2025 LinkSense. All rights reserved. | 
            <a href="/terms" className="text-blue-600 hover:underline ml-1">利用規約</a> | 
            <a href="/help" className="text-blue-600 hover:underline ml-1">ヘルプ</a>
          </p>
        </div>
      </div>
    </div>
  );
}