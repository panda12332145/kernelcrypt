import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Star, X } from 'lucide-react';
import { useSearch } from '../../hooks/useWikiApi';
import type { WikiArticle } from '../../types';
import DOMPurify from 'dompurify';

interface Props {
  onSelect: (articleSlug: string) => void;
}

const difficultyClass: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
};

const WikiSearch: React.FC<Props> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: results, loading } = useSearch(debouncedQuery, 8);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  const handleSelect = (article: WikiArticle) => {
    onSelect(article.slug);
    setQuery('');
    setDebouncedQuery('');
    setFocused(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 160)}
          placeholder="Search wiki..."
          className="search-input pl-10 pr-10"
          aria-label="Search wiki articles"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setDebouncedQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {focused && query.length >= 2 && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 rounded-lg z-50 overflow-hidden"
            style={{
              background: 'rgba(10, 12, 20, 0.98)',
              border: '1px solid rgba(0,255,136,0.15)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {loading && (
              <div className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                Searching...
              </div>
            )}

            {!loading && results?.length === 0 && (
              <div className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                No results
              </div>
            )}

            {!loading &&
              results?.map((article, index) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => handleSelect(article)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/4"
                  style={{ borderBottom: index < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-sans text-sm font-medium text-white truncate">{article.title}</span>
                      {(article.starred || article.featured) && (
                        <Star className="w-3 h-3 text-emerald-300" fill="currentColor" />
                      )}
                      <span
                        className={`font-mono px-1.5 py-0.5 rounded text-[9px] ${
                          difficultyClass[article.difficulty] || 'tag'
                        }`}
                      >
                        {article.difficulty.slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {article.category?.name}
                      {article.subcategory?.name ? ` / ${article.subcategory.name}` : ''}
                    </div>
                    {article.highlight && (
                      <div
                        className="wiki-search-highlight font-mono text-[11px] mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.highlight) }}
                      />
                    )}
                  </div>
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WikiSearch;
