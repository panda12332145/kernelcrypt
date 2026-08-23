import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, ChevronLeft, ChevronRight, Clock, ExternalLink, Star } from 'lucide-react';
import { apiUrl } from '../../lib/api';
import type { WikiArticle } from '../../types';
import MarkdownRenderer from './MarkdownRenderer';

interface Props {
  article: WikiArticle;
  previous?: WikiArticle | null;
  next?: WikiArticle | null;
  related?: WikiArticle[];
  onNavigate: (slug: string) => void;
}

const difficultyClass: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
};

const ReadingProgress: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = document.getElementById('wiki-content-area');
    if (!element) return undefined;

    const handler = () => {
      const scrollHeight = element.scrollHeight - element.clientHeight;
      setProgress(scrollHeight > 0 ? (element.scrollTop / scrollHeight) * 100 : 0);
    };

    handler();
    element.addEventListener('scroll', handler, { passive: true });
    return () => element.removeEventListener('scroll', handler);
  }, []);

  return <div className="reading-progress" style={{ width: `${progress}%` }} />;
};

const WikiPageViewer: React.FC<Props> = ({ article, previous, next, related = [], onNavigate }) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [starred, setStarred] = useState(Boolean(article.starred || article.featured));
  const [starCount, setStarCount] = useState(article.starCount || 0);
  const [starLoading, setStarLoading] = useState(false);
  const bookmarkKey = `wiki-bookmark-${article.slug}`;

  useEffect(() => {
    setBookmarked(localStorage.getItem(bookmarkKey) === 'true');
    setStarred(Boolean(article.starred || article.featured));
    setStarCount(article.starCount || (article.featured ? 1 : 0));

    const recentRaw = localStorage.getItem('wiki-recently-viewed');
    const recent = recentRaw ? JSON.parse(recentRaw) as string[] : [];
    localStorage.setItem(
      'wiki-recently-viewed',
      JSON.stringify([article.slug, ...recent.filter((slug) => slug !== article.slug)].slice(0, 12))
    );
  }, [article.featured, article.slug, article.starCount, article.starred, bookmarkKey]);

  useEffect(() => {
    document.title = `${article.seoTitle || article.title} | Cyber Wiki`;
    const description = article.description || article.excerpt || '';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [article]);

  const updatedAt = useMemo(() => {
    const sourceDate = article.githubLastCommitDate || article.lastSyncedAt || article.updatedAt;
    const date = sourceDate ? new Date(sourceDate) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : null;
  }, [article.githubLastCommitDate, article.lastSyncedAt, article.updatedAt]);

  const toggleBookmark = () => {
    const nextValue = !bookmarked;
    setBookmarked(nextValue);
    if (nextValue) localStorage.setItem(bookmarkKey, 'true');
    else localStorage.removeItem(bookmarkKey);
  };

  const toggleStar = async () => {
    const nextValue = !starred;
    setStarred(nextValue);
    if (nextValue && starCount === 0) setStarCount(1);
    setStarLoading(true);

    try {
      const response = await fetch(apiUrl(`/api/wiki/articles/${encodeURIComponent(article.slug)}/star`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: nextValue }),
      });

      if (!response.ok) throw new Error(`Star update failed: ${response.status}`);
      const result = await response.json();
      const updated = result.data as WikiArticle;
      setStarred(Boolean(updated.starred || updated.featured));
      setStarCount(updated.starCount || 0);
    } catch {
      setStarred(!nextValue);
      setStarCount(article.starCount || (article.featured ? 1 : 0));
    } finally {
      setStarLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <ReadingProgress />

      <motion.article
        className="flex-1 px-6 sm:px-10 py-8 max-w-5xl mx-auto w-full"
        key={article.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div className="flex items-center gap-2 mb-8 font-mono text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
          <span className="hover:text-emerald-400 cursor-default">{article.category?.name || 'Wiki'}</span>
          {article.subcategory?.name && (
            <>
              <span className="breadcrumb-sep">/</span>
              <span className="hover:text-emerald-400 cursor-default">{article.subcategory.name}</span>
            </>
          )}
          <span className="breadcrumb-sep">/</span>
          <span className="text-white">{article.title}</span>
        </div>

        <header className="mb-8">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`font-mono text-xs px-2.5 py-1 rounded-lg ${difficultyClass[article.difficulty]}`}>
                {article.difficulty}
              </span>
              <span className="font-mono text-xs inline-flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3.5 h-3.5" />
                {article.readingTimeMinutes} min read
              </span>
              {updatedAt && (
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  Updated {updatedAt}
                </span>
              )}
              {(starred || article.featured) && (
                <span className="wiki-star-badge font-mono text-xs inline-flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {starred ? 'Starred' : 'Featured'}
                </span>
              )}
            </div>
            
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start justify-between gap-4 mt-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">{article.title}</h1>
              {article.description && (
                <p className="font-mono text-sm leading-relaxed max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
                  {article.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleStar}
                disabled={starLoading}
                className={`wiki-star-button ${starred ? 'active' : ''}`}
                aria-label={starred ? 'Remove star' : 'Star article'}
              >
                <Star className="w-5 h-5" fill={starred ? 'currentColor' : 'none'} />
                {starCount > 0 && <span>{starCount}</span>}
              </button>

              <button
                type="button"
                onClick={toggleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  bookmarked ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-emerald-300'
                }`}
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark article'}
              >
                <Bookmark className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </header>

        {article.toc && article.toc.length > 2 && (
          <nav className="mb-8 p-4 rounded-lg" style={{ background: 'rgba(10,12,20,0.55)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="font-mono text-xs mb-3" style={{ color: 'var(--neon-green)' }}>
              CONTENT MAP
            </div>
            <div className="grid sm:grid-cols-2 gap-1">
              {article.toc.map((item) => (
                <a
                  key={item.anchor}
                  href={`#${item.anchor}`}
                  className="toc-item"
                  style={{ paddingLeft: `${Math.max(0, item.level - 1) * 10 + 8}px` }}
                >
                  {item.title}
                </a>
              ))}
            </div>
          </nav>
        )}

        <MarkdownRenderer html={article.renderedHtml || ''} />

        {related.length > 0 && (
          <section className="mt-12 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-xl font-bold text-white mb-4">Related Articles</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {related.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.slug)}
                  className="text-left p-4 rounded-lg transition-all hover:bg-white/4 group"
                  style={{ background: 'rgba(10,12,20,0.55)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
                        {item.title}
                      </div>
                      <div className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {item.category?.name} / {item.readingTimeMinutes} min
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-center justify-between gap-4 mt-12 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {previous ? (
            <button
              type="button"
              onClick={() => onNavigate(previous.slug)}
              className="flex items-center gap-2 font-mono text-sm transition-colors hover:text-emerald-400 min-w-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="truncate">{previous.title}</span>
            </button>
          ) : (
            <div />
          )}

          {next ? (
            <button
              type="button"
              onClick={() => onNavigate(next.slug)}
              className="flex items-center gap-2 font-mono text-sm transition-colors hover:text-emerald-400 min-w-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="truncate">{next.title}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </motion.article>
    </div>
  );
};

export default WikiPageViewer;
