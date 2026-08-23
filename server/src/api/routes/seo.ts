import { Router } from 'express';
import { prisma } from '@/database/prisma';
import { asyncHandler, AppError } from '@/utils/errors';

const router = Router();

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const slug = typeof req.params.slug === 'string' ? req.params.slug : String(req.params.slug);
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        category: true,
        subcategory: true,
      },
    });

    if (!article) {
      throw AppError.notFound('Artigo');
    }

    res.json({
      success: true,
      data: {
        title: article.seoTitle || article.title,
        description: article.description || article.excerpt,
        canonical: article.canonicalUrl || `/wiki/${article.slug}`,
        openGraph: {
          title: article.seoTitle || article.title,
          description: article.description || article.excerpt,
          type: 'article',
          image: article.coverImage,
        },
        schema: {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: article.title,
          description: article.description || article.excerpt,
          dateModified: article.updatedAt,
          datePublished: article.createdAt,
          articleSection: article.category?.name,
          keywords: (() => { try { return JSON.parse(article.tags || '[]').join(', '); } catch { return ''; } })(),
          proficiencyLevel: article.difficulty,
        },
      },
    });
  })
);

export default router;
