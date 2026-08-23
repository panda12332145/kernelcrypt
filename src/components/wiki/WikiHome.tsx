import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, FileText, Film, Star } from 'lucide-react';
import { apiUrl } from '../../lib/api';
import type { WikiApiCategory, WikiArticle, WikiBook, WikiVideo } from '../../types';

interface Props {
  categories: WikiApiCategory[];
  featuredArticles: WikiArticle[];
  loading?: boolean;
  stats?: any;
  onNavigate: (articleSlug: string) => void;
  onOpenBooks: () => void;
  onOpenVideos: () => void;
}

const difficultyClass: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
};

const WikiHome: React.FC<Props> = ({
  categories,
  featuredArticles,
  loading = false,
  stats,
  onNavigate,
  onOpenBooks,
  onOpenVideos,
}) => {
  const [dbBooks, setDbBooks] = useState<WikiBook[]>([]);
  const [dbVideos, setDbVideos] = useState<WikiVideo[]>([]);

  useEffect(() => {
    let mounted = true;

    fetch(apiUrl('/api/wiki/videos'))
      .then((response) => (response.ok ? response.json() : []))
      .then((videos: WikiVideo[]) => {
        if (mounted) setDbVideos(Array.isArray(videos) ? videos : []);
      })
      .catch(() => {
        if (mounted) setDbVideos([]);
      });

    fetch(apiUrl('/api/wiki/books'))
      .then((response) => (response.ok ? response.json() : []))
      .then((books: WikiBook[]) => {
        if (mounted) setDbBooks(Array.isArray(books) ? books : []);
      })
      .catch(() => {
        if (mounted) setDbBooks([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const totalPages = useMemo(
    () => categories.reduce((sum, category) => sum + (category.articleCount || 0), 0),
    [categories]
  );

  const recentSlugs = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('wiki-recently-viewed') || '[]') as string[];
    } catch {
      return [];
    }
  }, []);

  const allArticles = useMemo(
    () => categories.flatMap((category) => category.subcategories.flatMap((subcategory) => subcategory.articles)),
    [categories]
  );
  const recentArticles = recentSlugs
    .map((slug) => allArticles.find((article) => article.slug === slug))
    .filter(Boolean) as WikiArticle[];

  const formatUpdatedAt = (article: WikiArticle): string | null => {
    const sourceDate = article.githubLastCommitDate || article.lastSyncedAt || article.updatedAt;
    const date = sourceDate ? new Date(sourceDate) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : null;
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 max-w-6xl mx-auto w-full">
      <motion.header
        className="mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="section-label mb-4">
          <BookOpen className="w-4 h-4" />
          <span>KNOWLEDGE BASE</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
          Cyber <span className="gradient-text-green">Wiki</span>
        </h1>
        <p className="font-mono text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Dynamic cybersecurity, reverse engineering, systems programming, and research notes synced from GitHub.
        </p>

        <div className="flex flex-wrap gap-6 mt-6">
          {[
            { label: 'Categories', value: categories.length },
            { label: 'Articles', value: stats?.totalArticles ?? totalPages },
            { label: 'Stars', value: stats?.starredCount ?? featuredArticles.filter((article) => article.starred || article.featured).length },
            { label: 'Books', value: dbBooks.length },
            { label: 'Videos', value: dbVideos.length },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-2xl font-black" style={{ color: 'var(--neon-green)' }}>
                {item.value}
              </span>
              <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </motion.header>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Categories</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading &&
            [0, 1, 2].map((item) => (
              <div key={item} className="project-card p-5 h-36 animate-pulse" />
            ))}

          {!loading &&
            categories.map((category, index) => {
              const firstArticle = category.subcategories.flatMap((subcategory) => subcategory.articles)[0];

              return (
                <motion.button
                  key={category.id}
                  type="button"
                  className="project-card p-5 text-left"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  onClick={() => firstArticle && onNavigate(firstArticle.slug)}
                  whileHover={{ scale: 1.015 }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{
                      background: `${category.color || '#00ff88'}18`,
                      border: `1px solid ${category.color || '#00ff88'}40`,
                    }}
                  >
                    <BookOpen className="w-5 h-5" style={{ color: category.color || 'var(--neon-green)' }} />
                  </div>
                  <h3 className="font-bold text-white mb-1">{category.name}</h3>
                  <p className="font-mono text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{category.subcategoryCount || category.subcategories.length} sections</span>
                    <span>{category.articleCount || 0} articles</span>
                  </div>
                </motion.button>
              );
            })}
        </div>
      </section>

      {featuredArticles.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-emerald-300" />
            Featured Articles
          </h2>
          <div className="grid lg:grid-cols-2 gap-3">
            {featuredArticles.map((article, index) => (
              <motion.button
                key={article.id}
                type="button"
                className="w-full text-left p-4 rounded-lg transition-all hover:bg-white/4 group"
                style={{ background: 'rgba(10,12,20,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                onClick={() => onNavigate(article.slug)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.18)' }}
                  >
                    {article.starred || article.featured ? (
                      <Star className="w-4 h-4 text-emerald-300" fill="currentColor" />
                    ) : (
                      <FileText className="w-4 h-4 text-emerald-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        {article.title}
                      </span>
                      <span className={`font-mono px-2 py-0.5 rounded text-xs ${difficultyClass[article.difficulty]}`}>
                        {article.difficulty}
                      </span>
                    </div>
                    <p className="font-mono text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {article.description || article.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readingTimeMinutes} min
                      </span>
                      {formatUpdatedAt(article) && <span>updated {formatUpdatedAt(article)}</span>}
                      {(article.starred || article.featured) && (
                        <span className="inline-flex items-center gap-1 text-emerald-300">
                          <Star className="w-3 h-3" fill="currentColor" />
                          {article.starCount || 1}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {recentArticles.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4">Recently Viewed</h2>
          <div className="flex flex-wrap gap-2">
            {recentArticles.slice(0, 8).map((article) => (
              <button
                key={article.id}
                type="button"
                className="tag hover:text-emerald-300"
                onClick={() => onNavigate(article.slug)}
              >
                {article.title}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-300" />
            Books Library
          </h2>
          <div className="space-y-2">
            {(dbBooks.length ? dbBooks.slice(0, 3) : [{ id: 'empty', title: 'Book database', author: 'Local library', sizeLabel: 'open', customBadgeLabel: ['reader'] } as unknown as WikiBook]).map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={onOpenBooks}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/4 group text-left"
                style={{ background: 'rgba(10,12,20,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.18)' }}
                >
                  <FileText className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-sm font-medium text-white group-hover:text-emerald-300 transition-colors truncate">
                    {book.title}
                  </div>
                  <div className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {book.author} / {book.sizeLabel} / {book.customBadgeLabel.join(', ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Film className="w-5 h-5 text-red-400" />
            Video Lessons
          </h2>
          <div className="space-y-2">
            {(dbVideos.length ? dbVideos.slice(0, 3) : [{ id: 'empty', title: 'Video database', difficulty: 'beginner', duration: 'open', customBadgeLabel: ['player'] } as unknown as WikiVideo]).map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={onOpenVideos}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/4 group text-left"
                style={{ background: 'rgba(10,12,20,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <Film className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-sm font-medium text-white group-hover:text-red-400 transition-colors truncate">
                    {video.title}
                  </div>
                  <div className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {video.difficulty} / {video.duration} / {video.customBadgeLabel.join(', ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default WikiHome;
