'use client';

import { useState } from 'react';
import { StockData } from '@/types/market';
import { formatCurrency, formatVolume } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface MarketTableProps {
  data: StockData[];
  onRowClick?: (symbol: string) => void;
  selectedSymbol?: string;
}

type SortField = keyof StockData;
type SortDir = 'asc' | 'desc';

export function MarketTable({ data, onRowClick, selectedSymbol }: MarketTableProps) {
  const [sortField, setSortField] = useState<SortField>('changePercent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const mult = sortDir === 'asc' ? 1 : -1;
    if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * mult;
    return String(aVal).localeCompare(String(bVal)) * mult;
  });

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex flex-col ml-1">
      <ChevronUp className={`h-3 w-3 ${sortField === field && sortDir === 'asc' ? 'text-blue-400' : 'text-gray-600'}`} />
      <ChevronDown className={`h-3 w-3 -mt-1 ${sortField === field && sortDir === 'desc' ? 'text-blue-400' : 'text-gray-600'}`} />
    </span>
  );

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-900/50">
              {[
                { label: 'Symbol', field: 'symbol' as SortField },
                { label: 'Name', field: 'name' as SortField },
                { label: 'Price', field: 'price' as SortField },
                { label: 'Change %', field: 'changePercent' as SortField },
                { label: 'Volume', field: 'volume' as SortField },
                { label: 'Market Cap', field: 'marketCap' as SortField },
                { label: 'Sector', field: 'sector' as SortField },
              ].map(({ label, field }) => (
                <th
                  key={field}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200"
                  onClick={() => handleSort(field)}
                >
                  <span className="flex items-center">{label}<SortIcon field={field} /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {sorted.map((item) => {
              const isPositive = item.change >= 0;
              return (
                <tr
                  key={item.symbol}
                  className={`hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    selectedSymbol === item.symbol ? 'bg-blue-900/20 border-l-2 border-blue-500' : ''
                  }`}
                  onClick={() => onRowClick?.(item.symbol)}
                >
                  <td className="px-4 py-3">
                    <span className="text-blue-400 font-bold text-sm">{item.symbol}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-200 text-sm">{item.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">${item.price.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-sm">{item.volume > 0 ? formatVolume(item.volume) : '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-sm">{item.marketCap > 0 ? formatCurrency(item.marketCap) : '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-xs px-2 py-1 bg-gray-700 rounded">{item.sector}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
