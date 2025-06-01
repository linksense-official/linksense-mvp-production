'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Clock, Send, MessageSquare, HelpCircle, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    category: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 実際の実装では、ここでAPIにデータを送信
    try {
      // TODO: お問い合わせAPI実装
      await new Promise(resolve => setTimeout(resolve, 2000)); // 仮の遅延
      setIsSubmitted(true);
    } catch (error) {
      console.error('お問い合わせの送信に失敗しました:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">お問い合わせを受け付けました</h2>
            <p className="text-gray-600 mb-6">
              お問い合わせいただきありがとうございます。
              内容を確認の上、2営業日以内にご返信いたします。
            </p>
            <div className="space-y-3">
              <Link href="/">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  ホームに戻る
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    name: '',
                    email: '',
                    company: '',
                    category: '',
                    subject: '',
                    message: ''
                  });
                }}
              >
                新しいお問い合わせ
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                ホームに戻る
              </Button>
            </Link>
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">お問い合わせ</h1>
            </div>
            <p className="text-gray-600">
              ご質問、ご要望、技術的なサポートが必要でしたら、お気軽にお問い合わせください。
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* お問い合わせフォーム */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>お問い合わせフォーム</CardTitle>
                  <CardDescription>
                    以下のフォームにご記入いただき、送信してください。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          お名前 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="山田 太郎"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          メールアドレス <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="example@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                        会社名
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="株式会社サンプル"
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        お問い合わせ種別 <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">選択してください</option>
                        <option value="general">一般的なお問い合わせ</option>
                        <option value="technical">技術的なサポート</option>
                        <option value="billing">料金・請求について</option>
                        <option value="feature">機能要望</option>
                        <option value="bug">バグ報告</option>
                        <option value="partnership">パートナーシップ</option>
                        <option value="other">その他</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        件名 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="お問い合わせの件名をご記入ください"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        お問い合わせ内容 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="お問い合わせの詳細をご記入ください"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? (
                        <>送信中...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          送信する
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* 連絡先情報 */}
              <Card>
                <CardHeader>
                  <CardTitle>連絡先情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">メール</p>
                      <p className="text-gray-600">support@linksense.jp</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">電話</p>
                      <p className="text-gray-600">03-1234-5678</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">住所</p>
                      <p className="text-gray-600">
                        〒100-0001<br />
                        東京都千代田区千代田1-1-1<br />
                        LinkSenseビル 10F
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">営業時間</p>
                      <p className="text-gray-600">
                        平日 9:00-18:00<br />
                        （土日祝日除く）
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* よくある質問 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
                    よくある質問
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 mb-1">無料トライアルの期間は？</p>
                    <p className="text-sm text-gray-600">14日間の無料トライアルを提供しています。</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">データのセキュリティは？</p>
                    <p className="text-sm text-gray-600">業界標準のSSL暗号化と多要素認証を使用しています。</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">対応プラットフォームは？</p>
                    <p className="text-sm text-gray-600">Slack、Teams、ChatWork、Discord等に対応しています。</p>
                  </div>
                </CardContent>
              </Card>

              {/* 緊急時のサポート */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-800">
                    <Bug className="w-5 h-5 mr-2" />
                    緊急時のサポート
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 mb-3">
                    システムの重大な障害や緊急事態の場合は、
                    以下の緊急連絡先までお電話ください。
                  </p>
                  <p className="font-medium text-red-800">
                    緊急サポート: 03-1234-9999<br />
                    <span className="text-sm">(24時間対応)</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}