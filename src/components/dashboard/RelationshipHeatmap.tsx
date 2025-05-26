'use client';

import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { HeatmapData } from '../../types';

interface RelationshipHeatmapProps {
  data: HeatmapData[];
}

const SimpleHeatmap: React.FC<{ data: HeatmapData[] }> = ({ data }) => {
  const users = useMemo(() => {
    const userSet = new Set<string>();
    data.forEach(d => {
      userSet.add(d.x);
      userSet.add(d.y);
    });
    return Array.from(userSet);
  }, [data]);

  const maxValue = useMemo(() => {
    return Math.max(...data.map(d => d.value));
  }, [data]);

  const getIntensity = (value: number) => {
    if (maxValue === 0) return 0;
    return value / maxValue;
  };

  const getColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.3) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-blue-400';
    if (intensity < 0.8) return 'bg-blue-600';
    return 'bg-blue-800';
  };

  const getCellData = (userX: string, userY: string) => {
    return data.find(d => d.x === userX && d.y === userY);
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="grid grid-cols-1 gap-2">
          {/* ヘッダー行 */}
          <div className="grid gap-1" style={{ gridTemplateColumns: `100px repeat(${users.length}, 80px)` }}>
            <div className="p-2"></div>
            {users.map(user => (
              <div key={user} className="p-2 text-xs font-medium text-center transform -rotate-45 origin-center">
                {user.length > 8 ? `${user.slice(0, 6)}...` : user}
              </div>
            ))}
          </div>
          
          {/* データ行 */}
          {users.map(userY => (
            <div key={userY} className="grid gap-1" style={{ gridTemplateColumns: `100px repeat(${users.length}, 80px)` }}>
              <div className="p-2 text-xs font-medium flex items-center">
                {userY.length > 10 ? `${userY.slice(0, 8)}...` : userY}
              </div>
              {users.map(userX => {
                const cellData = getCellData(userX, userY);
                const intensity = getIntensity(cellData?.value || 0);
                const colorClass = getColor(intensity);
                
                return (
                  <div
                    key={`${userX}-${userY}`}
                    className={`h-12 ${colorClass} border border-gray-300 flex items-center justify-center text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity`}
                    title={`${userX} → ${userY}: ${cellData?.value || 0}回`}
                  >
                    {cellData?.value || 0}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* 凡例 */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm font-medium">対話頻度:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border"></div>
            <span className="text-xs">0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 border"></div>
            <span className="text-xs">低</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 border"></div>
            <span className="text-xs">中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-800 border"></div>
            <span className="text-xs">高</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RelationshipHeatmap: React.FC<RelationshipHeatmapProps> = ({ data }) => {
  return (
    <Card title="関係性ヒートマップ" className="col-span-2">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          チームメンバー間の対話頻度を可視化しています。色が濃いほど頻繁にコミュニケーションを取っています。
        </p>
      </div>
      <SimpleHeatmap data={data} />
    </Card>
  );
};
