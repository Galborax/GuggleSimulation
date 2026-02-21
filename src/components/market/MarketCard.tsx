import { StockData } from '@/types/market';
import { formatCurrency, formatVolume } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketCardProps {
  data: StockData;
}

export function MarketCard({ data }: MarketCardProps) {
  const isPositive = data.change >= 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-500 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-white font-bold text-lg">{data.symbol}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              data.type === 'stock' ? 'bg-blue-900/50 text-blue-300' :
              data.type === 'index' ? 'bg-purple-900/50 text-purple-300' :
              'bg-amber-900/50 text-amber-300'
            }`}>
              {data.type}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-0.5 truncate max-w-32">{data.name}</p>
        </div>
        <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-white text-2xl font-bold">${data.price.toLocaleString()}</p>
          <div className={`flex items-center space-x-1 mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <span className="text-sm font-medium">
              {isPositive ? '+' : ''}{data.change.toFixed(2)}
            </span>
            <span className="text-sm">
              ({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="text-right">
          {data.volume > 0 && (
            <p className="text-gray-400 text-xs">Vol: {formatVolume(data.volume)}</p>
          )}
          {data.marketCap > 0 && (
            <p className="text-gray-400 text-xs">Cap: {formatCurrency(data.marketCap)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
