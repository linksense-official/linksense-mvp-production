'use client';

import React from 'react';
import { UsageData } from '@/types/api';

interface UsageChartProps {
  data: UsageData[];
}

const UsageChart: React.FC<UsageChartProps> = ({ data }) => {
  // データが空の場合の処理
  if (!data || data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            使用データなし
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            まだ使用データがありません。
          </p>
        </div>
      </div>
    );
  }

  // 最大値を計算してスケールを決定
  const maxClicks = Math.max(...data.map(d => d.clicks));
  const maxLinks = Math.max(...data.map(d => d.links));
  const maxValue = Math.max(maxClicks, maxLinks);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
          使用状況グラフ
        </h3>
        
        {/* 凡例 */}
        <div className="flex items-center space-x-6 mb-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">クリック数</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">リンク数</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">収益</span>
          </div>
        </div>

        {/* チャート */}
        <div className="relative">
          {/* Y軸ラベル */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 w-8">
            <span>{maxValue}</span>
            <span>{Math.floor(maxValue * 0.75)}</span>
            <span>{Math.floor(maxValue * 0.5)}</span>
            <span>{Math.floor(maxValue * 0.25)}</span>
            <span>0</span>
          </div>

          {/* チャートエリア */}
          <div className="ml-10 h-64 flex items-end space-x-2">
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                {/* バー */}
                <div className="w-full flex flex-col items-center space-y-1">
                  {/* クリック数バー */}
                  <div className="w-full bg-gray-100 rounded-t">
                    <div
                      className="bg-blue-500 rounded-t transition-all duration-300"
                      style={{
                        height: `${maxValue > 0 ? (item.clicks / maxValue) * 200 : 0}px`,
                        minHeight: item.clicks > 0 ? '2px' : '0px',
                      }}
                      title={`クリック数: ${item.clicks}`}
                    ></div>
                  </div>
                  
                  {/* リンク数バー */}
                  <div className="w-full bg-gray-100">
                    <div
                      className="bg-green-500 transition-all duration-300"
                      style={{
                        height: `${maxValue > 0 ? (item.links / maxValue) * 200 : 0}px`,
                        minHeight: item.links > 0 ? '2px' : '0px',
                      }}
                      title={`リンク数: ${item.links}`}
                    ></div>
                  </div>

                  {/* 収益バー */}
                  <div className="w-full bg-gray-100 rounded-b">
                    <div
                      className="bg-purple-500 rounded-b transition-all duration-300"
                      style={{
                        height: `${maxValue > 0 ? (item.revenue / maxValue) * 200 : 0}px`,
                        minHeight: item.revenue > 0 ? '2px' : '0px',
                      }}
                      title={`収益: ¥${item.revenue.toLocaleString()}`}
                    ></div>
                  </div>
                </div>

                {/* X軸ラベル */}
                <div className="text-xs text-gray-500 text-center mt-2">
                  {new Date(item.period).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.reduce((sum, item) => sum + item.clicks, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">総クリック数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.reduce((sum, item) => sum + item.links, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">総リンク数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ¥{data.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">総収益</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageChart;