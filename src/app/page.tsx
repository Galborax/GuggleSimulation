import Link from 'next/link';
import { getAllMarketData, getMarketSummary } from '@/lib/market-data';
import { getLatestNews } from '@/lib/news-data';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { MarketCard } from '@/components/market/MarketCard';
import { NewsCard } from '@/components/news/NewsCard';
import { ArrowRight, Zap } from 'lucide-react';

export default function DashboardPage() {
  const allData = getAllMarketData();
  const summary = getMarketSummary();
  const news = getLatestNews();

  const topMovers = [...allData]
    .filter(d => d.type === 'stock')
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Zap className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">GuggleSimulation</h1>
        </div>
        <p className="text-gray-400 text-lg">AI-Powered Financial Market Analysis & Investment Decision Support</p>
        <p className="text-gray-500 text-sm mt-1">
          Last updated: {new Date(summary.lastUpdated).toLocaleTimeString()}
        </p>
      </div>

      <div className="mb-8">
        <DashboardStats summary={summary} newsCount={news.length} />
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Top Movers</h2>
          <Link href="/market-data" className="flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium">
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {topMovers.map(item => (
            <MarketCard key={item.symbol} data={item} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Latest News</h2>
            <Link href="/news" className="flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {news.slice(0, 5).map(article => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Quick Access</h2>
          </div>
          <div className="space-y-3">
            <Link href="/market-data" className="block bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-blue-500 transition-all group">
              <h3 className="text-white font-semibold text-lg group-hover:text-blue-400">Market Data →</h3>
              <p className="text-gray-400 text-sm mt-1">Browse stocks, indices, and commodities with historical charts</p>
            </Link>
            <Link href="/news" className="block bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-purple-500 transition-all group">
              <h3 className="text-white font-semibold text-lg group-hover:text-purple-400">News Feed →</h3>
              <p className="text-gray-400 text-sm mt-1">Latest financial news with AI-powered sentiment analysis</p>
            </Link>
            <div className="block bg-gray-800 border border-gray-700 rounded-xl p-5 opacity-60">
              <h3 className="text-white font-semibold text-lg">Analysis (Coming Soon)</h3>
              <p className="text-gray-400 text-sm mt-1">AI-powered investment decision support and portfolio analysis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
