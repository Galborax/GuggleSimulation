'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HistoricalDataPoint } from '@/types/market';
import { getHistoricalData } from '@/lib/market-data';

interface MarketChartProps {
  symbol: string;
  name: string;
}

export function MarketChart({ symbol, name }: MarketChartProps) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [period, setPeriod] = useState<'1M' | '3M'>('3M');

  useEffect(() => {
    const historicalData = getHistoricalData(symbol);
    const filtered = period === '1M' ? historicalData.slice(-30) : historicalData;
    setData(filtered);
  }, [symbol, period]);

  const isPositive = data.length >= 2 && data[data.length - 1].close >= data[0].close;
  const color = isPositive ? '#22c55e' : '#ef4444';

  const formatTooltip = (value: number | undefined): [string, string] => [
    `$${(value ?? 0).toFixed(2)}`,
    'Close Price',
  ];
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-lg">{symbol}</h3>
          <p className="text-gray-400 text-sm">{name}</p>
        </div>
        <div className="flex space-x-1">
          {(['1M', '3M'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                period === p ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" tickFormatter={formatXAxis} stroke="#6b7280" tick={{ fontSize: 11 }} interval={period === '1M' ? 4 : 14} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#9ca3af' }}
            itemStyle={{ color: '#f9fafb' }}
            formatter={formatTooltip}
            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          />
          <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2} fill={`url(#gradient-${symbol})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
