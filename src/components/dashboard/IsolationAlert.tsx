'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, Users, Calendar } from 'lucide-react';
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
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-medium ${className}`}>
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
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''} ${className}`} onClick={onClick}>
    {title && (
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
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
      <Card title="Communication Health Status" className="border-l-4 border-l-green-500">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-800 mb-1">Team Communication: Healthy</h4>
            <p className="text-sm text-gray-600">
              All team members are actively engaged in communication activities.
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{users.length} Active Members</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Isolation Risk Detection" className="border-l-4 border-l-amber-500">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 mb-1">Attention Required</h4>
              <p className="text-sm text-gray-600">
                {isolatedUsers.length} team member{isolatedUsers.length > 1 ? 's' : ''} may need support
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-600">{isolatedUsers.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">At Risk</div>
          </div>
        </div>
        
        <div className="space-y-3">
          {isolatedUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  ) : (
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">
                    Low communication activity detected
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200">
                <Calendar className="w-4 h-4" />
                Schedule 1:1
              </button>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="font-medium text-blue-900 mb-1">Recommended Actions</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Schedule one-on-one meetings to understand individual needs</li>
                <li>• Encourage participation in team activities and discussions</li>
                <li>• Review workload distribution and provide necessary support</li>
                <li>• Consider team-building activities to strengthen connections</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};