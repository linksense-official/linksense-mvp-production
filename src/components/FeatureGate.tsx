// src/components/FeatureGate.tsx - コンポーネント使用版
'use client';

import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import LoadingSpinner from './LoadingSpinner';
import UpgradePrompt from './UpgradePrompt';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  userId?: string;
  loadingMessage?: string;
  upgradeTitle?: string;
  upgradeMessage?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ 
  feature, 
  children, 
  fallback,
  userId,
  loadingMessage = 'アクセス権限を確認中...',
  upgradeTitle,
  upgradeMessage
}) => {
  const { canAccess, isLoading } = useSubscription(userId);

  if (isLoading) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  if (!canAccess(feature)) {
    return (
      <>
        {fallback || (
          <UpgradePrompt 
            title={upgradeTitle}
            message={upgradeMessage}
          />
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default FeatureGate;