import { NewsArticle } from '@/types/news';
import { formatTimeAgo } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface NewsCardProps {
  article: NewsArticle;
}

const sentimentStyles = {
  positive: 'bg-green-900/40 text-green-400 border-green-700',
  negative: 'bg-red-900/40 text-red-400 border-red-700',
  neutral: 'bg-gray-700/40 text-gray-400 border-gray-600',
};

export function NewsCard({ article }: NewsCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-500 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sentimentStyles[article.sentiment]}`}>
              {article.sentiment}
            </span>
            <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-800">
              {article.category}
            </span>
            {article.relevantSymbols.slice(0, 3).map(sym => (
              <span key={sym} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded font-mono">
                {sym}
              </span>
            ))}
          </div>
          <h3 className="text-white font-semibold text-sm leading-snug mb-2">{article.title}</h3>
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{article.summary}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-gray-500 text-xs font-medium">{article.source}</span>
            <span className="text-gray-600 text-xs">•</span>
            <span className="text-gray-500 text-xs">{formatTimeAgo(article.publishedAt)}</span>
          </div>
        </div>
        <a href={article.url} className="text-gray-600 hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5">
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
