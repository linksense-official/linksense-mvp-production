'use client';

import { useEffect } from 'react';

const ZoomVerification = () => {
  useEffect(() => {
    // Zoom Domain Verification meta tagを動的に追加
    const metaTag = document.createElement('meta');
    metaTag.name = 'zoom-domain-verification';
    metaTag.content = 'ZOOM_verify_af34206311a84c71a59fb3f82f504d98';
    
    // 既存のmeta tagがない場合のみ追加
    if (!document.querySelector('meta[name="zoom-domain-verification"]')) {
      document.head.appendChild(metaTag);
    }
    
    return () => {
      // クリーンアップ
      const existingTag = document.querySelector('meta[name="zoom-domain-verification"]');
      if (existingTag) {
        existingTag.remove();
      }
    };
  }, []);

  return null; // UIは表示しない
};

export default ZoomVerification;