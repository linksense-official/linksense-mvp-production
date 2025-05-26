'use client';

import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  fallbackIcon?: React.ReactNode;
  onClick?: () => void;
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
  fallbackIcon,
  onClick,
  status,
  showStatus = false
}) => {
  // サイズに応じたクラス
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  // ステータスに応じた色
  const statusColors = {
    online: 'bg-green-400',
    offline: 'bg-gray-400',
    away: 'bg-yellow-400',
    busy: 'bg-red-400'
  };

  // ステータスドットのサイズ
  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4'
  };

  // 名前からイニシャルを生成
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ランダムな背景色を生成（名前ベース）
  const getBackgroundColor = (name: string): string => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-gray-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const avatarClasses = `
    ${sizeClasses[size]} 
    rounded-full 
    flex 
    items-center 
    justify-center 
    overflow-hidden 
    relative
    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `;

  return (
    <div className="relative inline-block">
      <div className={avatarClasses} onClick={onClick}>
        {src ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // 画像読み込みエラー時にフォールバックを表示
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : name ? (
          // 名前からイニシャルを表示
          <div className={`
            w-full h-full flex items-center justify-center text-white font-semibold
            ${getBackgroundColor(name)}
          `}>
            {getInitials(name)}
          </div>
        ) : fallbackIcon ? (
          // カスタムフォールバックアイコン
          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
            {fallbackIcon}
          </div>
        ) : (
          // デフォルトのユーザーアイコン
          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
            <svg
              className="w-3/4 h-3/4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* ステータスインジケーター */}
      {showStatus && status && (
        <div className={`
          absolute -bottom-0 -right-0 
          ${statusSizes[size]} 
          ${statusColors[status]} 
          border-2 border-white 
          rounded-full
        `} />
      )}
    </div>
  );
};

// アバターグループコンポーネント
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    name?: string;
    alt?: string;
  }>;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
  showMore?: boolean;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 5,
  size = 'md',
  className = '',
  showMore = true
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const spacingClasses = {
    xs: '-space-x-1',
    sm: '-space-x-1.5',
    md: '-space-x-2',
    lg: '-space-x-2.5',
    xl: '-space-x-3',
    '2xl': '-space-x-4'
  };

  return (
    <div className={`flex ${spacingClasses[size]} ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <div key={index} className="relative">
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
            className="ring-2 ring-white"
          />
        </div>
      ))}
      
      {showMore && remainingCount > 0 && (
        <div className="relative">
          <div className={`
            ${sizeClasses[size]} 
            rounded-full 
            bg-gray-100 
            border-2 
            border-white 
            flex 
            items-center 
            justify-center 
            text-gray-600 
            font-medium
            text-xs
          `}>
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  );
};

// サイズクラスをエクスポート（他のコンポーネントで使用可能）
const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl'
};

// デフォルトエクスポート
export default Avatar;