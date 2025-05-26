'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

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
    position: 'シニアエンジニア',
    phone: '090-1234-5678',
    location: '東京オフィス',
    bio: 'フルスタック開発者として5年の経験があります。特にReact/Next.jsとNode.jsを得意としており、チーム健全性の向上に情熱を注いでいます。',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
    languages: [
      { name: '日本語', level: 'ネイティブ' },
      { name: '英語', level: 'ビジネスレベル' },
      { name: '中国語', level: '初級' }
    ]
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
            <p className="text-lg text-gray-600">{formData.position}</p>
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
            <h2 className="text-xl font-bold text-gray-900 mb-6">基本情報</h2>
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

              {/* 役職 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">役職</label>
                {isEditing.position ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleSave('position')}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => handleCancel('position')}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">{formData.position}</p>
                    <button
                      onClick={() => handleEdit('position')}
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

              {/* 勤務地 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">勤務地</label>
                {isEditing.location ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleSave('location')}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => handleCancel('location')}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900">{formData.location}</p>
                    <button
                      onClick={() => handleEdit('location')}
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

          {/* スキルセクション */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">スキル</h2>
              <button
                onClick={() => handleEdit('skills')}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                編集
              </button>
            </div>
            {isEditing.skills ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      <span>{skill}</span>
                      <button
                        onClick={() => {
                          const newSkills = formData.skills.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, skills: newSkills }));
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="新しいスキルを追加"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          setFormData(prev => ({ 
                            ...prev, 
                            skills: [...prev.skills, input.value.trim()] 
                          }));
                          input.value = '';
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSave('skills')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => handleCancel('skills')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
                <p className="text-xs text-gray-500">Enterキーで追加できます</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 言語スキルセクション */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">言語スキル</h2>
              <button
                onClick={() => handleEdit('languages')}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                編集
              </button>
            </div>
            {isEditing.languages ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  {formData.languages.map((language, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="text"
                        value={language.name}
                        onChange={(e) => {
                          const newLanguages = [...formData.languages];
                          newLanguages[index] = { ...newLanguages[index], name: e.target.value };
                          setFormData(prev => ({ ...prev, languages: newLanguages }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="言語名"
                      />
                      <select
                        value={language.level}
                        onChange={(e) => {
                          const newLanguages = [...formData.languages];
                          newLanguages[index] = { ...newLanguages[index], level: e.target.value };
                          setFormData(prev => ({ ...prev, languages: newLanguages }));
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="初級">初級</option>
                        <option value="中級">中級</option>
                        <option value="上級">上級</option>
                        <option value="ビジネスレベル">ビジネスレベル</option>
                        <option value="ネイティブ">ネイティブ</option>
                      </select>
                      <button
                        onClick={() => {
                          const newLanguages = formData.languages.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, languages: newLanguages }));
                        }}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      languages: [...prev.languages, { name: '', level: '初級' }] 
                    }));
                  }}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  + 言語を追加
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSave('languages')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => handleCancel('languages')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.languages.map((language, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{language.name}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      language.level === 'ネイティブ' ? 'bg-green-100 text-green-800' :
                      language.level === 'ビジネスレベル' ? 'bg-blue-100 text-blue-800' :
                      language.level === '上級' ? 'bg-purple-100 text-purple-800' :
                      language.level === '中級' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {language.level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* セキュリティ設定セクション */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">セキュリティ設定</h2>
            <div className="space-y-6">
              {/* パスワード変更 */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">パスワード</h3>
                  <p className="text-sm text-gray-600">最後の変更: 2024年3月15日</p>
                </div>
                <button
                  onClick={() => showNotification('パスワード変更機能は開発中です', 'info')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  変更
                </button>
              </div>

              {/* 二段階認証 */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">二段階認証</h3>
                  <p className="text-sm text-gray-600">アカウントのセキュリティを強化します</p>
                </div>
                <button
                  onClick={() => showNotification('二段階認証設定は開発中です', 'info')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  設定
                </button>
              </div>

              {/* ログイン履歴 */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">ログイン履歴</h3>
                  <p className="text-sm text-gray-600">最近のログイン活動を確認できます</p>
                </div>
                <button
                  onClick={() => showNotification('ログイン履歴機能は開発中です', 'info')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  確認
                </button>
              </div>
            </div>
          </div>

          {/* アカウント操作セクション */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">アカウント操作</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-yellow-800">データのエクスポート</h3>
                  <p className="text-sm text-yellow-700">あなたのデータをダウンロードできます</p>
                </div>
                <button
                  onClick={() => showNotification('データエクスポート機能は開発中です', 'info')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  エクスポート
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-red-800">アカウントの削除</h3>
                  <p className="text-sm text-red-700">この操作は取り消せません</p>
                </div>
                <button
                  onClick={() => showNotification('アカウント削除機能は開発中です', 'warning')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  削除
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
    </div>
  );
}