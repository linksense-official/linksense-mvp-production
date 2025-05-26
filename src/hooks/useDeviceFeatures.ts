// src/hooks/useDeviceFeatures.ts
import { useState, useEffect } from 'react';

export const useDeviceFeatures = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isOnline: true,
    battery: null as any,
    vibrationSupport: false,
    geolocationSupport: false
  });

  useEffect(() => {
    // オンライン/オフライン状態の監視
    const handleOnline = () => setDeviceInfo(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setDeviceInfo(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // バッテリー情報の取得
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setDeviceInfo(prev => ({ ...prev, battery }));
      });
    }

    // 振動サポートの確認
    setDeviceInfo(prev => ({ 
      ...prev, 
      vibrationSupport: 'vibrate' in navigator,
      geolocationSupport: 'geolocation' in navigator
    }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const vibrate = (pattern: number | number[]) => {
    if (deviceInfo.vibrationSupport) {
      navigator.vibrate(pattern);
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!deviceInfo.geolocationSupport) {
        reject(new Error('位置情報がサポートされていません'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  return {
    deviceInfo,
    vibrate,
    getCurrentLocation
  };
};
