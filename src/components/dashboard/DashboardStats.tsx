import { MarketSummary } from '@/types/market';
import { TrendingUp, TrendingDown, Minus, Database } from 'lucide-react';

interface DashboardStatsProps {
  summary: MarketSummary;
  newsCount: number;
}

export function DashboardStats({ summary, newsCount }: DashboardStatsProps) {
  const stats = [
    {
      label: 'Total Assets Tracked',
      value: summary.totalAssets,
      icon: Database,
      color: 'text-blue-400',
      bg: 'bg-blue-900/20 border-blue-800',
    },
    {
      label: 'Gainers Today',
      value: summary.gainers,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-900/20 border-green-800',
    },
    {
      label: 'Losers Today',
      value: summary.losers,
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-900/20 border-red-800',
    },
    {
      label: 'Latest News',
      value: newsCount,
      icon: Minus,
      color: 'text-purple-400',
      bg: 'bg-purple-900/20 border-purple-800',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className={`border rounded-xl p-4 ${bg}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</p>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
