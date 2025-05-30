'use client';

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { User } from '../../types';

const Card: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
}> = ({ children, className = '', title, subtitle, onClick }) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`} onClick={onClick}>
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    )}
    <div className="px-6 py-4">
      {children}
    </div>
  </div>
);


interface OneOnOneNavigatorProps {
  suggestedPairs: Array<{ userId1: string; userId2: string }>;
  users: User[];
}

export const OneOnOneNavigator: React.FC<OneOnOneNavigatorProps> = ({ 
  suggestedPairs, 
  users 
}) => {
  const getUserById = (id: string) => users.find(user => user.id === id);

  if (suggestedPairs.length === 0) {
    return (
      <Card title="1on1ナビゲーター" className="border-l-4 border-l-green-500">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-green-800">良好な状態です</h4>
            <p className="text-sm text-gray-600">
              現在、1on1が推奨されるペアは検出されていません。チーム内のコミュニケーションが活発です。
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="1on1ナビゲーター" className="border-l-4 border-l-blue-500">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800">1on1の実施を検討してください</h4>
            <p className="text-sm text-gray-600">
              以下のペアは最近会話が少ないようです。関係性の向上のため、1on1ミーティングを検討してみてください。
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          {suggestedPairs.slice(0, 5).map((pair) => {
            const user1 = getUserById(pair.userId1);
            const user2 = getUserById(pair.userId2);
            
            if (!user1 || !user2) return null;
            
            return (
              <div key={`${pair.userId1}-${pair.userId2}`} className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user1.avatar} alt={user1.name} />
                    <AvatarFallback>{user1.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900">{user1.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm text-gray-500">1on1推奨</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">{user2.name}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user2.avatar} alt={user2.name} />
                    <AvatarFallback>{user2.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            );
          })}
        </div>
        
        {suggestedPairs.length > 5 && (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">
              他に {suggestedPairs.length - 5} ペアの1on1が推奨されています
            </p>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>推奨アクション:</strong> 定期的な1on1ミーティングを設定し、チームメンバー間の理解とコラボレーションを深めてください。
          </p>
        </div>
      </div>
    </Card>
  );
};