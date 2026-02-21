import { getLatestNews } from '@/lib/news-data';
import { NewsFeed } from '@/components/news/NewsFeed';

export default function NewsPage() {
  const articles = getLatestNews();
  const positive = articles.filter(a => a.sentiment === 'positive').length;
  const negative = articles.filter(a => a.sentiment === 'negative').length;
  const neutral = articles.filter(a => a.sentiment === 'neutral').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Financial News</h1>
        <p className="text-gray-400">Latest market news with AI-powered sentiment analysis</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-900/20 border border-green-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Positive</p>
          <p className="text-green-400 text-2xl font-bold">{positive}</p>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Negative</p>
          <p className="text-red-400 text-2xl font-bold">{negative}</p>
        </div>
        <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Neutral</p>
          <p className="text-gray-300 text-2xl font-bold">{neutral}</p>
        </div>
      </div>

      <NewsFeed articles={articles} />
    </div>
  );
}
