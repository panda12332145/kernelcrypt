import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Film, Library, Menu, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import WikiSidebar from '../components/wiki/WikiSidebar';
import WikiPageViewer from '../components/wiki/WikiPageViewer';
import WikiHome from '../components/wiki/WikiHome';
import WikiSearch from '../components/wiki/WikiSearch';
import BooksPage from '../components/wiki/BooksPage';
import VideosPage from '../components/wiki/VideosPage';
import {
  useArticle,
  useFeaturedArticles,
  usePreviousNext,
  useRelatedArticles,
  useSyncManual,
  useWikiNavigation,
  useWikiStats,
} from '../hooks/useWikiApi';

type WikiView = 'home' | 'article' | 'books' | 'videos';

function resolveView(pathname: string): { view: WikiView; slug?: string } {
  const rest = pathname.replace(/^\/wiki\/?/, '').replace(/\/+$/, '');

  if (!rest) return { view: 'home' };
  if (rest === 'books') return { view: 'books' };
  if (rest === 'videos') return { view: 'videos' };
  return { view: 'article', slug: decodeURIComponent(rest) };
}

const Wiki: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { view, slug } = resolveView(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { data: categories, loading: navLoading, refetch: refetchNav } = useWikiNavigation();
  const { data: featuredArticles } = useFeaturedArticles(8);
  const { data: stats } = useWikiStats();
  const { data: article, loading: articleLoading, error: articleError, refetch: refetchArticle } = useArticle(slug);
  const { data: related } = useRelatedArticles(slug);
  const { data: previousNext } = usePreviousNext(slug);
  const syncManual = useSyncManual();

  const navCategories = categories || [];
  const currentCategory = article?.category?.name;
  const currentSubcategory = article?.subcategory?.name;

  const topbarButtons = useMemo(
    () => [
      { label: 'Wiki', icon: Library, action: () => navigate('/wiki'), active: view === 'home' || view === 'article' },
      { label: 'Books', icon: BookOpen, action: () => navigate('/wiki/books'), active: view === 'books' },
      { label: 'Videos', icon: Film, action: () => navigate('/wiki/videos'), active: view === 'videos' },
    ],
    [navigate, view]
  );

  const navigateToArticle = (articleSlug: string) => {
    navigate(`/wiki/${articleSlug}`);
    setMobileSidebarOpen(false);
  };

  const runManualSync = async () => {
    await syncManual.trigger(false);
    await refetchNav();
    if (slug) await refetchArticle();
  };

  return (
    <div className="flex h-screen pt-16 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="hidden lg:block flex-shrink-0"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <WikiSidebar
              categories={navCategories}
              activeArticle={slug}
              onNavigate={navigateToArticle}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.62)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-16 bottom-0 z-50 lg:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <WikiSidebar
                categories={navCategories}
                activeArticle={slug}
                onNavigate={navigateToArticle}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex items-center gap-3 px-4 sm:px-6 py-3 flex-shrink-0 flex-wrap"
          style={{
            background: 'rgba(5,6,10,0.9)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth >= 1024) setSidebarOpen((value) => !value);
              else setMobileSidebarOpen((value) => !value);
            }}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>

          <div className="flex items-center gap-1">
            {topbarButtons.map((button) => {
              const Icon = button.icon;
              return (
                <button
                  key={button.label}
                  type="button"
                  onClick={button.action}
                  className="font-mono text-xs px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1.5"
                  style={{
                    color: button.active ? 'var(--neon-green)' : 'var(--text-muted)',
                    background: button.active ? 'rgba(0,255,136,0.08)' : 'transparent',
                    border: button.active ? '1px solid rgba(0,255,136,0.2)' : '1px solid transparent',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {button.label}
                </button>
              );
            })}
          </div>

          {currentCategory && (
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="breadcrumb-sep">/</span>
              <span>{currentCategory}</span>
              {currentSubcategory && (
                <>
                  <span className="breadcrumb-sep">/</span>
                  <span className="text-white/70">{currentSubcategory}</span>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={runManualSync}
            disabled={syncManual.loading}
            className="p-2 rounded-lg transition-colors hover:bg-white/5 disabled:opacity-50"
            aria-label="Sync GitHub content"
            title="Sync GitHub content"
          >
            <RefreshCw className={`w-4 h-4 ${syncManual.loading ? 'animate-spin' : ''}`} style={{ color: 'var(--text-muted)' }} />
          </button>

          <div className="flex-1 max-w-sm ml-auto">
            <WikiSearch onSelect={navigateToArticle} />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto" id="wiki-content-area">
          {view === 'books' && <BooksPage />}
          {view === 'videos' && <VideosPage />}

          {view === 'home' && (
            <WikiHome
              categories={navCategories}
              featuredArticles={featuredArticles || []}
              loading={navLoading}
              stats={stats}
              onNavigate={navigateToArticle}
              onOpenBooks={() => navigate('/wiki/books')}
              onOpenVideos={() => navigate('/wiki/videos')}
            />
          )}

          {view === 'article' && articleLoading && (
            <div className="px-6 sm:px-10 py-10 max-w-4xl mx-auto animate-pulse">
              <div className="h-10 bg-white/5 rounded-lg w-3/4 mb-4" />
              <div className="h-4 bg-white/5 rounded w-1/2 mb-8" />
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-4 bg-white/5 rounded w-full mb-3" />
              ))}
            </div>
          )}

          {view === 'article' && articleError && (
            <div className="px-6 sm:px-10 py-10 max-w-3xl mx-auto">
              <div className="project-card p-6">
                <h1 className="text-2xl font-bold text-white mb-2">Article not found</h1>
                <p className="font-mono text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                  {articleError.message}
                </p>
                <button type="button" className="btn-primary" onClick={() => navigate('/wiki')}>
                  Back to wiki
                </button>
              </div>
            </div>
          )}

          {view === 'article' && article && (
            <WikiPageViewer
              article={article}
              related={related || []}
              previous={previousNext?.previous}
              next={previousNext?.next}
              onNavigate={navigateToArticle}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Wiki;
