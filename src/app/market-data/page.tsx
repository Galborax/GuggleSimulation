'use client';

import { useState } from 'react';
import { getAllMarketData } from '@/lib/market-data';
import { MarketTable } from '@/components/market/MarketTable';
import { MarketChart } from '@/components/market/MarketChart';
import { StockData } from '@/types/market';

type TabType = 'stock' | 'index' | 'commodity';

export default function MarketDataPage() {
  const allData = getAllMarketData();
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [selectedItem, setSelectedItem] = useState<StockData | null>(null);

  const filtered = allData.filter(d => d.type === activeTab);
  const gainers = filtered.filter(d => d.change > 0).length;
  const losers = filtered.filter(d => d.change < 0).length;

  const tabs: { key: TabType; label: string }[] = [
    { key: 'stock', label: 'Stocks' },
    { key: 'index', label: 'Indices' },
    { key: 'commodity', label: 'Commodities' },
  ];

  const handleRowClick = (symbol: string) => {
    const item = allData.find(d => d.symbol === symbol);
    setSelectedItem(item || null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Market Data</h1>
        <p className="text-gray-400">Real-time market data across stocks, indices, and commodities</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Assets</p>
          <p className="text-white text-2xl font-bold">{filtered.length}</p>
        </div>
        <div className="bg-green-900/20 border border-green-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Gainers</p>
          <p className="text-green-400 text-2xl font-bold">{gainers}</p>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Losers</p>
          <p className="text-red-400 text-2xl font-bold">{losers}</p>
        </div>
      </div>

      <div className="flex space-x-1 mb-6 bg-gray-800 border border-gray-700 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSelectedItem(null); }}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {selectedItem && (
        <div className="mb-6">
          <MarketChart symbol={selectedItem.symbol} name={selectedItem.name} />
        </div>
      )}

      <MarketTable
        data={filtered}
        onRowClick={handleRowClick}
        selectedSymbol={selectedItem?.symbol}
      />
      {!selectedItem && (
        <p className="text-gray-500 text-sm mt-3 text-center">Click on a row to view the price chart</p>
      )}
    </div>
  );
}
