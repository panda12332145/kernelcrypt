/**
 * Category and wiki navigation routes.
 */

import { Router } from 'express';
import { prisma } from '@/database/prisma';
import { asyncHandler, AppError } from '@/utils/errors';
import { safeJsonParse } from '@/utils';

const router = Router();

function serializeArticleLite(article: any) {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    description: article.description,
    excerpt: article.excerpt,
    difficulty: article.difficulty,
    featured: article.featured,
    starred: article.starred,
    starCount: article.starCount,
    starredAt: article.starredAt,
    coverImage: article.coverImage,
    readingTimeMinutes: article.readingTimeMinutes,
    readingTimeSeconds: article.readingTimeSeconds,
    totalWords: article.totalWords,
    mediaCount: article.mediaCount,
    githubLastCommitDate: article.githubLastCommitDate,
    lastSyncedAt: article.lastSyncedAt,
    updatedAt: article.updatedAt,
    tags: (() => { try { return JSON.parse(article.tags || '[]'); } catch { return []; } })(),
  };
}

router.get(
  '/navigation/tree',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          include: {
            articles: {
              orderBy: [{ starred: 'desc' }, { featured: 'desc' }, { title: 'asc' }],
            },
            _count: { select: { articles: true } },
          },
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
        },
        articles: {
          orderBy: [{ starred: 'desc' }, { featured: 'desc' }, { title: 'asc' }],
        },
        _count: { select: { articles: true, subcategories: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    const tree = categories.map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      order: category.order,
      articleCount: category._count.articles,
      subcategoryCount: category._count.subcategories,
      subcategories: category.subcategories.map((subcategory) => ({
        id: subcategory.id,
        slug: subcategory.slug,
        name: subcategory.name,
        description: subcategory.description,
        icon: subcategory.icon,
        color: subcategory.color,
        order: subcategory.order,
        articleCount: subcategory._count.articles,
        articles: subcategory.articles.map(serializeArticleLite),
      })),
    }));

    res.json({ success: true, data: tree });
  })
);

router.get(
  '/stats/summary',
  asyncHandler(async (_req, res) => {
    const stats = await prisma.readingStats.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const fallback = stats
      ? null
      : {
          totalArticles: await prisma.article.count(),
          beginnerCount: await prisma.article.count({ where: { difficulty: 'beginner' } }),
          intermediateCount: await prisma.article.count({ where: { difficulty: 'intermediate' } }),
          advancedCount: await prisma.article.count({ where: { difficulty: 'advanced' } }),
          featuredCount: await prisma.article.count({ where: { featured: true } }),
          starredCount: await prisma.article.count({ where: { starred: true } }),
        };

    res.json({
      success: true,
      data: stats
        ? {
            ...stats,
            totalViews: Number(stats.totalViews),
            categoryStats: safeJsonParse(stats.categoryStats, []),
            tagStats: safeJsonParse(stats.tagStats, {}),
            mediaStats: safeJsonParse(stats.mediaStats, {}),
          }
        : fallback,
    });
  })
);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { articles: true, subcategories: true },
        },
        articles: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            featured: true,
            starred: true,
            starCount: true,
            readingTimeMinutes: true,
          },
          take: 5,
          orderBy: [{ starred: 'desc' }, { featured: 'desc' }, { updatedAt: 'desc' }],
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    res.json({
      success: true,
      data: categories,
    });
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const slug = typeof req.params.slug === 'string' ? req.params.slug : String(req.params.slug);
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        subcategories: {
          include: {
            articles: {
              orderBy: [{ starred: 'desc' }, { featured: 'desc' }, { title: 'asc' }],
            },
          },
          orderBy: [{ order: 'asc' }, { name: 'asc' }],
        },
        articles: {
          where: { subcategoryId: null },
          orderBy: [{ starred: 'desc' }, { featured: 'desc' }, { title: 'asc' }],
        },
        _count: {
          select: { articles: true, subcategories: true },
        },
      },
    });

    if (!category) {
      throw AppError.notFound('Categoria');
    }

    res.json({
      success: true,
      data: {
        ...category,
        articles: category.articles.map(serializeArticleLite),
        subcategories: category.subcategories.map((subcategory: any) => ({
          ...subcategory,
          articles: subcategory.articles ? subcategory.articles.map(serializeArticleLite) : [],
        })),
      },
    });
  })
);

router.get(
  '/:slug/articles',
  asyncHandler(async (req, res) => {
    const slug = typeof req.params.slug === 'string' ? req.params.slug : String(req.params.slug);
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const category = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!category) {
      throw AppError.notFound('Categoria');
    }

    const total = await prisma.article.count({
      where: { categoryId: category.id },
    });

    const articles = await prisma.article.findMany({
      where: { categoryId: category.id },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    res.json({
      success: true,
      data: {
        items: articles.map(serializeArticleLite),
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  })
);

export default router;
