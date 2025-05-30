'use client';

import React from 'react';
import { User } from '../../types';

// ✅ Avatar コンポーネント群を直接定義（型安全性強化）
const Avatar: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`relative flex shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);

const AvatarImage: React.FC<{ 
  src: string; 
  alt: string; 
  className?: string;
}> = ({ src, alt, className = '' }) => (
  <img 
    className={`aspect-square h-full w-full object-cover ${className}`} 
    src={src} 
    alt={alt}
    onError={(e) => {
      // 画像読み込みエラー時のフォールバック
      e.currentTarget.style.display = 'none';
    }}
  />
);

const AvatarFallback: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-medium ${className}`}>
    {children}
  </div>
);

// ✅ Card コンポーネント拡張定義（title対応）
const Card: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  title?: string;
  onClick?: () => void;
}> = ({ children, className = '', title, onClick }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`} onClick={onClick}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
    )}
    <div className="px-6 py-4">
      {children}
    </div>
  </div>
);

interface IsolationAlertProps {
  isolatedUserIds: string[];
  users: User[];
}

export const IsolationAlert: React.FC<IsolationAlertProps> = ({ 
  isolatedUserIds, 
  users 
}) => {
  const isolatedUsers = users.filter(user => isolatedUserIds.includes(user.id));

  if (isolatedUsers.length === 0) {
    return (
      <Card title="孤立リスクアラート" className="border-l-4 border-l-green-500">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-green-800">良好な状態です</h4>
            <p className="text-sm text-gray-600">
              現在、孤立リスクの高いメンバーは検出されていません。
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="孤立リスクアラート" className="border-l-4 border-l-yellow-500">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-yellow-800">注意が必要です</h4>
            <p className="text-sm text-gray-600">
              以下のメンバーは最近の活動が少なく、孤立している可能性があります。
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          {isolatedUsers.map(user => (
            <div key={user.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Avatar className="h-8 w-8">
                {/* ✅ 型安全性を確保したAvatar表示 */}
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : (
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">
                  コミュニケーション頻度が低下しています
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>推奨アクション:</strong> 1on1ミーティングの実施や、チームメンバーとの積極的なコミュニケーションを促進してください。
          </p>
        </div>
      </div>
    </Card>
  );
};