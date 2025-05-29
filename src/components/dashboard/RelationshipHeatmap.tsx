'use client';

import React, { useMemo } from 'react';
import { Card } from '../ui/card';
import { HeatmapData, HeatmapComponentProps } from '../../types';

interface RelationshipHeatmapProps {
  data: HeatmapData[];
  options?: {
    maxUsers?: number;
    showLegend?: boolean;
    showTooltip?: boolean;
  };
  onCellClick?: (data: HeatmapData) => void;
}

const SimpleHeatmap: React.FC<{ 
  data: HeatmapData[];
  onCellClick?: (data: HeatmapData) => void;
}> = ({ data, onCellClick }) => {
  const users = useMemo(() => {
    const userSet = new Set<string>();
    data.forEach(d => {
      userSet.add(d.x);
      userSet.add(d.y);
    });
    return Array.from(userSet).sort();
  }, [data]);

  const maxValue = useMemo(() => {
    return Math.max(...data.map(d => d.value), 1); // 最小値1を保証
  }, [data]);

  const getIntensity = (value: number) => {
    if (maxValue === 0) return 0;
    return value / maxValue;
  };

  const getColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100 text-gray-400';
    if (intensity < 0.3) return 'bg-blue-200 text-blue-800';
    if (intensity < 0.6) return 'bg-blue-400 text-white';
    if (intensity < 0.8) return 'bg-blue-600 text-white';
    return 'bg-blue-800 text-white';
  };

  const getCellData = (userX: string, userY: string) => {
    return data.find(d => d.x === userX && d.y === userY);
  };

  const handleCellClick = (cellData: HeatmapData | undefined, userX: string, userY: string) => {
    if (onCellClick && cellData) {
      onCellClick(cellData);
    } else if (onCellClick && !cellData) {
      // データがない場合でも基本的な情報を提供
      onCellClick({
        x: userX,
        y: userY,
        value: 0
      });
    }
  };

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>表示するデータがありません</p>
          <p className="text-sm mt-1">チームメンバー間の対話データを確認してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="grid grid-cols-1 gap-2">
          {/* ヘッダー行 */}
          <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${users.length}, 80px)` }}>
            <div className="p-2 text-sm font-semibold text-gray-700">メンバー</div>
            {users.map(user => (
              <div key={`header-${user}`} className="p-2 text-xs font-medium text-center">
                <div className="transform -rotate-45 origin-center whitespace-nowrap">
                  {user.length > 8 ? `${user.slice(0, 6)}...` : user}
                </div>
              </div>
            ))}
          </div>
          
          {/* データ行 */}
          {users.map(userY => (
            <div key={`row-${userY}`} className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${users.length}, 80px)` }}>
              <div className="p-2 text-xs font-medium flex items-center bg-gray-50 rounded">
                <div className="truncate" title={userY}>
                  {userY.length > 12 ? `${userY.slice(0, 10)}...` : userY}
                </div>
              </div>
              {users.map(userX => {
                const cellData = getCellData(userX, userY);
                const intensity = getIntensity(cellData?.value || 0);
                const colorClass = getColor(intensity);
                const isInteraction = cellData && cellData.value > 0;
                
                return (
                  <div
                    key={`cell-${userX}-${userY}`}
                    className={`
                      h-12 ${colorClass} border border-gray-300 
                      flex items-center justify-center text-xs font-semibold 
                      cursor-pointer hover:opacity-80 hover:scale-105 
                      transition-all duration-200 rounded-sm
                      ${userX === userY ? 'bg-gray-200 text-gray-500' : ''}
                    `}
                    title={`${userX} → ${userY}: ${cellData?.value || 0}回の対話${
                      cellData?.metadata?.lastInteraction 
                        ? `\n最終対話: ${new Date(cellData.metadata.lastInteraction).toLocaleDateString()}`
                        : ''
                    }`}
                    onClick={() => handleCellClick(cellData, userX, userY)}
                  >
                    {userX === userY ? '−' : (cellData?.value || 0)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* 凡例 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">対話頻度:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border rounded"></div>
              <span className="text-xs">なし</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 border rounded"></div>
              <span className="text-xs">低頻度</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 border rounded"></div>
              <span className="text-xs">中頻度</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 border rounded"></div>
              <span className="text-xs">高頻度</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-800 border rounded"></div>
              <span className="text-xs">最高頻度</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            💡 セルをクリックすると詳細情報が表示されます
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-xs text-gray-600">総メンバー数</div>
            <div className="text-lg font-bold text-gray-900">{users.length}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-xs text-gray-600">活発な関係性</div>
            <div className="text-lg font-bold text-blue-600">
              {data.filter(d => d.value > 0).length}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-xs text-gray-600">最大対話回数</div>
            <div className="text-lg font-bold text-green-600">{maxValue}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-xs text-gray-600">平均対話回数</div>
            <div className="text-lg font-bold text-orange-600">
              {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length) : 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RelationshipHeatmap: React.FC<RelationshipHeatmapProps> = ({ 
  data, 
  options = {},
  onCellClick 
}) => {
  const { maxUsers = 20, showLegend = true, showTooltip = true } = options;

  // データの前処理（必要に応じてユーザー数制限）
  const processedData = useMemo(() => {
    if (data.length === 0) return [];
    
    // ユーザー数制限がある場合
    if (maxUsers && maxUsers > 0) {
      const userActivity = new Map<string, number>();
      
      // 各ユーザーの活動度を計算
      data.forEach(d => {
        userActivity.set(d.x, (userActivity.get(d.x) || 0) + d.value);
        userActivity.set(d.y, (userActivity.get(d.y) || 0) + d.value);
      });
      
      // 活動度の高いユーザーを選択
      const topUsers = Array.from(userActivity.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxUsers)
        .map(([user]) => user);
      
      // 選択されたユーザー間のデータのみをフィルタリング
      return data.filter(d => topUsers.includes(d.x) && topUsers.includes(d.y));
    }
    
    return data;
  }, [data, maxUsers]);

  return (
    <Card 
      title="関係性ヒートマップ" 
      subtitle={`チームメンバー間の対話頻度（${processedData.length}件のデータ）`}
      className="col-span-2"
    >
      <div className="mb-6">
        <p className="text-sm text-gray-600 leading-relaxed">
          チームメンバー間の対話頻度を可視化しています。色が濃いほど頻繁にコミュニケーションを取っており、
          チーム内の関係性やコミュニケーションパターンを把握できます。
        </p>
      </div>
      
      <SimpleHeatmap data={processedData} onCellClick={onCellClick} />
    </Card>
  );
};