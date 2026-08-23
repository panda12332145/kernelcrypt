import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, FileText, Folder, Library, Star } from 'lucide-react';
import type { WikiApiCategory, WikiApiSubcategory, WikiArticle } from '../../types';

interface Props {
  categories: WikiApiCategory[];
  activeArticle?: string;
  onNavigate: (articleSlug: string) => void;
}

const STORAGE_KEY = 'cyber-wiki-sidebar-open';

const difficultyClass: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
};

const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.16 }}>
    <ChevronRight className="w-3 h-3" />
  </motion.span>
);

const ArticleItem: React.FC<{
  article: WikiArticle;
  active: boolean;
  onNavigate: (slug: string) => void;
}> = ({ article, active, onNavigate }) => (
  <button
    type="button"
    onClick={() => onNavigate(article.slug)}
    className={`wiki-nav-item w-full text-left pl-8 ${active ? 'active' : ''}`}
    title={article.title}
  >
    {article.starred || article.featured ? (
      <Star className="w-3.5 h-3.5 text-emerald-300" fill="currentColor" />
    ) : (
      <FileText className="w-3.5 h-3.5 opacity-60" />
    )}
    <span className="truncate">{article.title}</span>
    <span
      className={`ml-auto text-[9px] px-1.5 py-0.5 rounded font-mono ${
        difficultyClass[article.difficulty] || 'tag'
      }`}
      title={article.difficulty}
    >
      {article.difficulty?.slice(0, 1).toUpperCase()}
    </span>
  </button>
);

const SubcategoryItem: React.FC<{
  subcategory: WikiApiSubcategory;
  activeArticle?: string;
  defaultOpen: boolean;
  onNavigate: (slug: string) => void;
}> = ({ subcategory, activeArticle, defaultOpen, onNavigate }) => {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="wiki-nav-item w-full text-left pl-4"
      >
        <ChevronIcon open={open} />
        <Folder className="w-3.5 h-3.5 opacity-70" />
        <span className="truncate flex-1">{subcategory.name}</span>
        <span className="font-mono opacity-40 text-[10px]">{subcategory.articles.length}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            {subcategory.articles.map((article) => (
              <ArticleItem
                key={article.id}
                article={article}
                active={article.slug === activeArticle}
                onNavigate={onNavigate}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CategoryItem: React.FC<{
  category: WikiApiCategory;
  activeArticle?: string;
  savedOpen: boolean;
  onToggle: (slug: string, open: boolean) => void;
  onNavigate: (slug: string) => void;
}> = ({ category, activeArticle, savedOpen, onToggle, onNavigate }) => {
  const containsActive = category.subcategories.some((subcategory) =>
    subcategory.articles.some((article) => article.slug === activeArticle)
  );
  const [open, setOpen] = useState(savedOpen || containsActive);

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onToggle(category.slug, next);
  };

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={toggle}
        className={`wiki-nav-item w-full text-left font-semibold ${containsActive ? 'text-white' : ''}`}
      >
        <ChevronIcon open={open} />
        <Library className="w-3.5 h-3.5" style={{ color: category.color || 'var(--neon-green)' }} />
        <span className="flex-1 truncate">{category.name}</span>
        <span className="font-mono opacity-40 text-[10px]">{category.articleCount || 0}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-2"
          >
            {category.subcategories.map((subcategory) => (
              <SubcategoryItem
                key={subcategory.id}
                subcategory={subcategory}
                activeArticle={activeArticle}
                defaultOpen={subcategory.articles.some((article) => article.slug === activeArticle)}
                onNavigate={onNavigate}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const WikiSidebar: React.FC<Props> = ({ categories, activeArticle, onNavigate }) => {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const totalArticles = useMemo(
    () => categories.reduce((sum, category) => sum + (category.articleCount || 0), 0),
    [categories]
  );

  const handleToggle = (slug: string, open: boolean) => {
    setOpenMap((current) => {
      const next = { ...current, [slug]: open };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <aside className="wiki-sidebar flex flex-col" style={{ width: '280px', padding: '24px 12px' }}>
      <div className="mb-6 px-2">
        <div className="font-mono text-xs mb-1" style={{ color: 'var(--neon-green)' }}>
          KNOWLEDGE BASE
        </div>
        <div className="font-sans text-base font-bold text-white">Dynamic Navigation</div>
        <div className="font-mono text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
          {categories.length} categories / {totalArticles} articles
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            activeArticle={activeArticle}
            savedOpen={Boolean(openMap[category.slug])}
            onToggle={handleToggle}
            onNavigate={onNavigate}
          />
        ))}

        {categories.length === 0 && (
          <div className="px-3 py-4 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            Waiting for GitHub sync...
          </div>
        )}
      </div>

      <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="font-mono text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          GitHub powered wiki
        </div>
      </div>
    </aside>
  );
};

export default WikiSidebar;
