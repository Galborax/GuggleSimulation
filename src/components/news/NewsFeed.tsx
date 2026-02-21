'use client';

import { useState } from 'react';
import { NewsArticle } from '@/types/news';
import { NewsCard } from './NewsCard';

interface NewsFeedProps {
  articles: NewsArticle[];
  limit?: number;
}

export function NewsFeed({ articles, limit }: NewsFeedProps) {
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(articles.map(a => a.category)))];
  const sentiments = ['all', 'positive', 'negative', 'neutral'];

  const filtered = articles
    .filter(a => sentimentFilter === 'all' || a.sentiment === sentimentFilter)
    .filter(a => categoryFilter === 'all' || a.category === categoryFilter)
    .slice(0, limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 flex-wrap">
          {sentiments.map(s => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                sentimentFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === c ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No articles match the selected filters.</div>
        ) : (
          filtered.map(article => <NewsCard key={article.id} article={article} />)
        )}
      </div>
    </div>
  );
}
