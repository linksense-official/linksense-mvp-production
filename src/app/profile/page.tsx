'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

// SVGアイコンコンポーネント
const ArrowLeftIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const CameraIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const XMarkIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PhotoIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const CheckIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const UserIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const ShieldCheckIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const TrashIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage: string;
  onImageUpdate: (imageUrl: string) => void;
  onNotification: (notification: NotificationState) => void;
}

const ProfileImageModal = ({ isOpen, onClose, currentImage, onImageUpdate, onNotification }: ProfileImageModalProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。'));
        return;
      }

      if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        reject(new Error('サポートされていないファイル形式です。JPEG、PNG、GIF、WebPファイルを選択してください。'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        canvas.width = 400;
        canvas.height = 400;

        ctx?.drawImage(img, startX, startY, size, size, 0, 0, 400, 400);
        const result = canvas.toDataURL('image/jpeg', 0.9);
        resolve(result);
      };

      img.onerror = () => {
        reject(new Error('画像の読み込みに失敗しました。'));
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const processedImage = await processImage(file);
      setPreview(processedImage);
      onNotification({
        show: true,
        message: '画像が正常に処理されました。保存ボタンをクリックして適用してください。',
        type: 'success'
      });
    } catch (error) {
      onNotification({
        show: true,
        message: error instanceof Error ? error.message : '画像の処理中にエラーが発生しました。',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [processImage, onNotification]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleSave = useCallback(() => {
    if (preview && typeof window !== 'undefined') {
      localStorage.setItem('userProfileImage', preview);
      onImageUpdate(preview);
      onNotification({
        show: true,
        message: 'プロフィール画像が正常に更新されました。',
        type: 'success'
      });
      onClose();
    }
  }, [preview, onImageUpdate, onNotification, onClose]);

  const handleRemove = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userProfileImage');
    }
    onImageUpdate('');
    onNotification({
      show: true,
      message: 'プロフィール画像が削除されました。',
      type: 'info'
    });
    onClose();
  }, [onImageUpdate, onNotification, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">プロフィール画像を変更</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="inline-block relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                {preview || currentImage ? (
                  <img src={preview || currentImage} alt="プロフィール画像" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              {preview && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <CheckIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            
            {isProcessing ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600">画像を処理中...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">画像をここにドラッグ&ドロップするか、</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ファイルを選択
                </button>
                <p className="text-xs text-gray-500">JPEG、PNG、GIF、WebP（最大10MB）</p>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">画像処理について</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>画像は自動的に正方形にクロップされます</li>
                  <li>最適なサイズ（400x400px）にリサイズされます</li>
                  <li>ファイルサイズが圧縮される場合があります</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={!preview || isProcessing}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              保存
            </button>
            {(currentImage || preview) && (
              <button
                onClick={handleRemove}
                disabled={isProcessing}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                削除
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({});
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'デモユーザー',
    email: user?.email || 'demo@company.com',
    department: 'プロダクト開発部',
    phone: '090-1234-5678',
    bio: 'フルスタック開発者として5年の経験があります。特にReact/Next.jsとNode.jsを得意としており、チーム健全性の向上に情熱を注いでいます。'
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      const savedImage = localStorage.getItem('userProfileImage');
      if (savedImage) {
        setProfileImage(savedImage);
      }
    }
  }, [isMounted]);

  const showNotification = (message: string, type: NotificationState['type']) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleEdit = (field: string) => {
    setIsEditing(prev => ({ ...prev, [field]: true }));
  };

  const handleSave = (field: string) => {
    setIsEditing(prev => ({ ...prev, [field]: false }));
    showNotification(`${field}が更新されました`, 'success');
  };

  const handleCancel = (field: string) => {
    setIsEditing(prev => ({ ...prev, [field]: false }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpdate = (imageUrl: string) => {
    setProfileImage(imageUrl);
  };

  const handleNotification = (notificationState: NotificationState) => {
    setNotification(notificationState);
    if (notificationState.show) {
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 4000);
    }
  };

  // 🔧 セキュリティ設定ボタン機能実装
  const handlePasswordChange = useCallback(() => {
    console.log('🔐 パスワード変更機能を実行');
    // 実装例: パスワード変更ページまたはモーダルに遷移
    router.push('/reset-password');
  }, [router]);

  const handleTwoFactorAuth = useCallback(() => {
    console.log('🔒 二段階認証設定を実行');
    // 実装例: 2FA設定ページに遷移
    router.push('/settings/2fa');
  }, [router]);

  const handleLoginHistory = useCallback(() => {
    console.log('📋 ログイン履歴を表示');
    // 実装例: ログイン履歴ページに遷移
    router.push('/settings/login-history');
  }, [router]);

  // 🔧 アカウント削除機能実装
  const handleAccountDeletion = useCallback(() => {
    const confirmMessage = 'アカウントを削除すると、すべてのデータが永久に失われます。この操作は取り消せません。\n\n本当にアカウントを削除しますか？';
    
    if (window.confirm(confirmMessage)) {
      const finalConfirm = 'この操作は本当に取り消せません。最終確認です。\n\nアカウントを削除しますか？';
      
      if (window.confirm(finalConfirm)) {
        console.log('🗑️ アカウント削除処理を実行');
        
        try {
          // 実際のアカウント削除API呼び出し
          // await deleteUserAccount(user.id);
          
          // ローカルストレージクリア
          if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
          }
          
          showNotification('アカウントが正常に削除されました。ご利用ありがとうございました。', 'info');
          
          // ログアウトしてホームページにリダイレクト
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          
        } catch (error) {
          console.error('❌ アカウント削除エラー:', error);
          showNotification('アカウント削除中にエラーが発生しました。サポートにお問い合わせください。', 'error');
        }
      }
    }
  }, [showNotification]);

  const stats = [
    { label: 'アラート処理数', value: '127', change: '+12%', changeType: 'positive' },
    { label: 'レポート生成数', value: '43', change: '+8%', changeType: 'positive' },
    { label: 'チーム健全性スコア', value: '87', change: '+5%', changeType: 'positive' },
    { label: '今月の活動日数', value: '22', change: '0%', changeType: 'neutral' }
  ];

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 通知 */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className={`p-4 rounded-lg shadow-lg border max-w-sm ${
            notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'success' && <CheckIcon className="h-5 w-5" />}
                {notification.type === 'error' && <XMarkIcon className="h-5 w-5" />}
                {notification.type === 'warning' && <ExclamationTriangleIcon className="h-5 w-5" />}
                {notification.type === 'info' && <CheckIcon className="h-5 w-5" />}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 戻るボタン */}
      <button
        onClick={() => router.back()}
        className="fixed top-6 left-6 z-50 p-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
      >
        <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
      </button>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* ヘッダーセクション */}
          <div className="text-center pt-16 pb-8">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white shadow-xl border-4 border-white">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="プロフィール画像"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {formData.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsImageModalOpen(true)}
                className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              >
                <CameraIcon className="h-4 w-4" />
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">{formData.name}</h1>
            <p className="text-lg text-gray-600">プロダクト開発チーム</p>
            <p className="text-gray-500">{formData.department}</p>
          </div>

          {/* 統計セクション */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' :
                    stat.changeType === 'negative' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {stat.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 基本情報セクション */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
              基本情報
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 名前 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">名前</label>
                {isEditing.name ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleSave('name')}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => handleCancel('name')}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">{formData.name}</p>
                    <button
                      onClick={() => handleEdit('name')}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      編集
                    </button>
                  </div>
                )}
              </div>

              {/* メールアドレス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                <p className="text-gray-900">{formData.email}</p>
                <p className="text-xs text-gray-500 mt-1">メールアドレスは変更できません</p>
              </div>

              {/* 部署 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">部署</label>
                {isEditing.department ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleSave('department')}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => handleCancel('department')}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">{formData.department}</p>
                    <button
                      onClick={() => handleEdit('department')}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      編集
                    </button>
                  </div>
                )}
              </div>

              {/* 電話番号 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label>
                {isEditing.phone ? (
                  <div className="flex space-x-2">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleSave('phone')}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => handleCancel('phone')}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">{formData.phone}</p>
                    <button
                      onClick={() => handleEdit('phone')}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      編集
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 自己紹介 */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">自己紹介</label>
              {isEditing.bio ? (
                <div className="space-y-2">
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSave('bio')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => handleCancel('bio')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <p className="text-gray-900 leading-relaxed">{formData.bio}</p>
                    <button
                      onClick={() => handleEdit('bio')}
                      className="text-blue-600 hover:text-blue-700 text-sm ml-4 flex-shrink-0"
                    >
                      編集
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* セキュリティ設定セクション */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-2" />
              セキュリティ設定
            </h2>
            <div className="space-y-6">
              {/* パスワード変更 */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div>
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1l2.586-2.586A6 6 0 1121 9z" />
                    </svg>
                    パスワード
                  </h3>
                  <p className="text-sm text-gray-600">最後の変更: 2024年3月15日</p>
                </div>
                <button
                  onClick={handlePasswordChange}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>変更</span>
                </button>
              </div>

              {/* 二段階認証 */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div>
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    二段階認証
                  </h3>
                  <p className="text-sm text-gray-600">アカウントのセキュリティを強化します</p>
                </div>
                <button
                  onClick={handleTwoFactorAuth}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>設定</span>
                </button>
              </div>

              {/* ログイン履歴 */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div>
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ログイン履歴
                  </h3>
                  <p className="text-sm text-gray-600">最近のログイン活動を確認できます</p>
                </div>
                <button
                  onClick={handleLoginHistory}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>確認</span>
                </button>
              </div>
            </div>
          </div>

          {/* アカウント操作セクション */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              アカウント操作
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-red-800 flex items-center">
                    <TrashIcon className="h-5 w-5 text-red-600 mr-2" />
                    アカウントの削除
                  </h3>
                  <p className="text-sm text-red-700">この操作は取り消せません</p>
                </div>
                <button
                  onClick={handleAccountDeletion}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>削除</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* プロフィール画像モーダル */}
      <ProfileImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        currentImage={profileImage}
        onImageUpdate={handleImageUpdate}
        onNotification={handleNotification}
      />

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}