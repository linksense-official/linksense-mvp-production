'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { User } from '../../types';

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
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
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