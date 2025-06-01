import Link from 'next/link';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfServicePage() {
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
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">利用規約</h1>
            </div>
            <p className="text-gray-600">最終更新日: 2025年5月31日</p>
          </div>

          {/* コンテンツ */}
          <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 規約への同意</h2>
              <p className="text-gray-700 leading-relaxed">
                LinkSense（以下「本サービス」）をご利用いただくことで、
                お客様は本利用規約（以下「本規約」）に同意したものとみなされます。
                本規約に同意いただけない場合は、本サービスのご利用をお控えください。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. サービスの概要</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                LinkSenseは、チームコミュニケーションの分析と最適化を支援するSaaSプラットフォームです。
                以下の機能を提供しています：
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>複数のコミュニケーションプラットフォームとの統合</li>
                <li>チーム健全性の分析とモニタリング</li>
                <li>コミュニケーションパターンの可視化</li>
                <li>改善提案とアラート機能</li>
                <li>レポート生成と共有機能</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                3. 利用者の義務
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">3.1 適切な利用</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>本サービスを法的かつ適切な目的でのみ使用すること</li>
                    <li>他のユーザーや第三者の権利を尊重すること</li>
                    <li>正確で最新の情報を提供すること</li>
                    <li>アカウントのセキュリティを維持すること</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">3.2 アカウント管理</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>アカウント情報の機密性を保持すること</li>
                    <li>不正アクセスを発見した場合は直ちに報告すること</li>
                    <li>多要素認証の設定を推奨します</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <XCircle className="w-6 h-6 mr-2 text-red-600" />
                4. 禁止事項
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800 mb-4 font-medium">以下の行為は固く禁止されています：</p>
                <ul className="list-disc list-inside text-red-700 space-y-2">
                  <li>違法または不正な目的での使用</li>
                  <li>他者の知的財産権の侵害</li>
                  <li>システムへの不正アクセスやハッキング行為</li>
                  <li>マルウェアやウイルスの配布</li>
                  <li>他のユーザーへの嫌がらせや迷惑行為</li>
                  <li>虚偽の情報の提供</li>
                  <li>サービスの逆行分析やリバースエンジニアリング</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 料金とお支払い</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">5.1 料金体系</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>無料トライアル期間: 14日間</li>
                    <li>Starterプラン: 月額料金制</li>
                    <li>Businessプラン: 月額料金制</li>
                    <li>Enterpriseプラン: 年間契約制</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">5.2 支払い条件</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>料金は前払い制です</li>
                    <li>自動更新が適用されます</li>
                    <li>支払い遅延の場合、サービスが停止される場合があります</li>
                    <li>返金は特定の条件下でのみ適用されます</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. 知的財産権</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                本サービスに関するすべての知的財産権は当社に帰属します。
                お客様は以下について同意するものとします：
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>本サービスの著作権、商標権、特許権を尊重すること</li>
                <li>許可なく本サービスの複製、配布、改変を行わないこと</li>
                <li>お客様が投稿したデータの適切な使用権を当社に許諾すること</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-2 text-yellow-600" />
                7. 免責事項と責任制限
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-yellow-900 mb-2">7.1 サービスの提供</h3>
                    <p className="text-yellow-800">
                      本サービスは「現状有姿」で提供されます。
                      当社は、サービスの可用性、正確性、完全性について保証いたしません。
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-yellow-900 mb-2">7.2 責任の制限</h3>
                    <p className="text-yellow-800">
                      当社の責任は、お客様が支払った料金の総額を上限とします。
                      間接的、特別な、偶発的な損害については責任を負いません。
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. データの取り扱い</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                お客様のデータの取り扱いについては、別途プライバシーポリシーに定めるところによります。
                重要なポイント：
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>お客様のデータは暗号化して保存されます</li>
                <li>データのバックアップを定期的に実行します</li>
                <li>お客様はいつでもデータの削除を要求できます</li>
                <li>サービス終了時には、データを安全に削除します</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. サービスの変更・終了</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                当社は、以下の権利を留保します：
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>サービス内容の変更または改善</li>
                <li>新機能の追加または既存機能の削除</li>
                <li>メンテナンスのための一時的なサービス停止</li>
                <li>事前通知によるサービスの終了</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. 契約の解除</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">10.1 お客様による解除</h3>
                  <p className="text-gray-700">
                    お客様はいつでもアカウント設定から契約を解除することができます。
                    解除後もデータは30日間保持されます。
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">10.2 当社による解除</h3>
                  <p className="text-gray-700">
                    本規約違反、料金未払い、その他正当な理由がある場合、
                    当社は事前通知の上で契約を解除することができます。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. 準拠法と管轄</h2>
              <p className="text-gray-700 leading-relaxed">
                本規約は日本法に準拠し、本規約に関する一切の紛争については、
                東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. お問い合わせ</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  本規約に関するご質問やご不明な点がございましたら、以下までお問い合わせください：
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>メール:</strong> legal@linksense.jp</p>
                  <p><strong>住所:</strong> 〒100-0001 東京都千代田区千代田1-1-1</p>
                  <p><strong>電話:</strong> 03-1234-5678</p>
                  <p><strong>営業時間:</strong> 平日 9:00-18:00（土日祝日除く）</p>
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