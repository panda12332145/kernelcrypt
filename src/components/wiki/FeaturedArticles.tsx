/**
 * Card de artigo destacado
 */

import React from 'react';
import clsx from 'clsx';

interface FeaturedArticleCardProps {
  title: string;
  slug: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readingTime: number;
  banner?: string;
  tagline?: string;
  onClick?: () => void;
}

export function FeaturedArticleCard({
  title,
  slug,
  description,
  difficulty,
  readingTime,
  banner,
  tagline,
  onClick,
}: FeaturedArticleCardProps) {
  const difficultyColor = {
    beginner: 'from-green-900 to-green-700',
    intermediate: 'from-yellow-900 to-yellow-700',
    advanced: 'from-red-900 to-red-700',
  };

  const difficultyLabel = {
    beginner: 'Iniciante',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
  };

  return (
    <a
      href={`/wiki/${slug}`}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      className={clsx(
        'group relative overflow-hidden rounded-lg border border-cyan-500/50',
        'bg-gradient-to-br from-gray-900 to-gray-950',
        'hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20',
        'transition-all duration-300 cursor-pointer'
      )}
    >
      {/* Banner */}
      {banner && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={banner}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-950" />
        </div>
      )}

      {/* Conteúdo */}
      <div className="p-4">
        {/* Tagline */}
        {tagline && (
          <div className="text-xs text-cyan-400 mb-2 font-semibold uppercase">
            {tagline}
          </div>
        )}

        {/* Título */}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition">
          {title}
        </h3>

        {/* Descrição */}
        {description && (
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">{description}</p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between pt-3 border-t border-cyan-500/20">
          <div
            className={clsx(
              'text-xs font-semibold px-2 py-1 rounded',
              `bg-gradient-to-r ${difficultyColor[difficulty]}`
            )}
          >
            {difficultyLabel[difficulty]}
          </div>
          <div className="text-xs text-gray-500">⏱️ {readingTime} min</div>
        </div>
      </div>
    </a>
  );
}

/**
 * Grid de artigos em destaque
 */
interface FeaturedArticlesGridProps {
  articles: FeaturedArticleCardProps[];
  loading?: boolean;
}

export function FeaturedArticlesGrid({
  articles,
  loading,
}: FeaturedArticlesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 bg-gradient-to-br from-gray-900 to-gray-950 rounded-lg border border-cyan-500/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article) => (
        <FeaturedArticleCard key={article.slug} {...article} />
      ))}
    </div>
  );
}
