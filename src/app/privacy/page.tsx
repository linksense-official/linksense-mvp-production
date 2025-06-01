import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Lock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                ホームに戻る
              </Button>
            </Link>
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">プライバシーポリシー</h1>
            </div>
            <p className="text-gray-600">最終更新日: 2025年5月31日</p>
          </div>

          {/* コンテンツ */}
          <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-blue-600" />
                1. はじめに
              </h2>
              <p className="text-gray-700 leading-relaxed">
                LinkSense（以下「当社」）は、お客様のプライバシーを尊重し、個人情報の保護に努めています。
                本プライバシーポリシーは、当社がどのように個人情報を収集、使用、保護するかについて説明しています。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-2 text-blue-600" />
                2. 収集する情報
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">2.1 アカウント情報</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>氏名、メールアドレス</li>
                    <li>会社名、役職</li>
                    <li>プロフィール画像</li>
                    <li>認証情報（暗号化済み）</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">2.2 使用データ</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>ワークスペースの統合データ</li>
                    <li>コミュニケーション分析データ</li>
                    <li>アプリケーションの使用履歴</li>
                    <li>デバイス情報、IPアドレス</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-2 text-blue-600" />
                3. 情報の使用目的
              </h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>サービスの提供および改善</li>
                <li>チームコミュニケーション分析の実行</li>
                <li>カスタマーサポートの提供</li>
                <li>セキュリティの維持および不正使用の防止</li>
                <li>法的要件への対応</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 情報の共有</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、以下の場合を除き、お客様の個人情報を第三者と共有することはありません：
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>お客様の明示的な同意がある場合</li>
                <li>法的要求または法執行機関からの要請がある場合</li>
                <li>当社の権利、財産、安全を保護するために必要な場合</li>
                <li>サービス提供に必要な信頼できる第三者パートナー（暗号化された形式のみ）</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. データセキュリティ</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-3">セキュリティ対策</h3>
                <ul className="list-disc list-inside text-blue-800 space-y-2">
                  <li>業界標準のSSL/TLS暗号化</li>
                  <li>多要素認証（2FA）のサポート</li>
                  <li>定期的なセキュリティ監査</li>
                  <li>アクセス制御および監視システム</li>
                  <li>データの定期的なバックアップ</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. お客様の権利</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                お客様には以下の権利があります：
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>個人情報へのアクセス権</li>
                <li>個人情報の訂正権</li>
                <li>個人情報の削除権（忘れられる権利）</li>
                <li>データポータビリティの権利</li>
                <li>処理の制限を求める権利</li>
                <li>異議申立ての権利</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Cookieの使用</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、サービスの機能向上およびユーザー体験の改善のためにCookieを使用します。
                Cookieの設定は、ブラウザの設定から変更することができます。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. 国際的なデータ転送</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、適用される法律に従い、適切な保護措置を講じた上で、
                お客様の個人情報を国境を越えて転送する場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. ポリシーの変更</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、本プライバシーポリシーを随時更新する場合があります。
                重要な変更については、サービス内またはメールでお知らせいたします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. お問い合わせ</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  プライバシーに関するご質問やご懸念がございましたら、以下までお気軽にお問い合わせください：
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>メール:</strong> privacy@linksense.jp</p>
                  <p><strong>住所:</strong> 〒100-0001 東京都千代田区千代田1-1-1</p>
                  <p><strong>電話:</strong> 03-1234-5678</p>
                </div>
              </div>
            </section>
          </div>

          {/* フッター */}
          <div className="mt-8 text-center">
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                ホームに戻る
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}