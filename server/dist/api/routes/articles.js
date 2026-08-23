/**
 * Article API routes.
 */
import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { GetArticlesQuerySchema, SearchQuerySchema } from '../../types/schemas.js';
import { asyncHandler, AppError } from '../../utils/errors.js';
import { createExcerpt, safeJsonParse } from '../../utils/index.js';
const router = Router();
const articleInclude = {
    category: true,
    subcategory: true,
    mediaAssets: true,
};
function serializeArticle(article, includeBody = false) {
    return {
        ...article,
        tags: safeJsonParse(article.tags, []),
        toc: safeJsonParse(article.tocJson, []),
        content: includeBody ? article.content : undefined,
        renderedHtml: includeBody ? article.renderedHtml : undefined,
        tocJson: undefined,
    };
}
function makeHighlight(text, query) {
    if (!text)
        return '';
    const lower = text.toLowerCase();
    const index = lower.indexOf(query.toLowerCase());
    if (index === -1)
        return createExcerpt(text, 150);
    const start = Math.max(0, index - 60);
    const end = Math.min(text.length, index + query.length + 90);
    const snippet = text.slice(start, end);
    const escaped = snippet.replace(/[&<>"']/g, (char) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return map[char];
    });
    return `${start > 0 ? '...' : ''}${escaped.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>')}${end < text.length ? '...' : ''}`;
}
function scoreArticle(article, query) {
    const q = query.toLowerCase();
    let score = 0;
    if (article.title?.toLowerCase() === q)
        score += 100;
    if (article.title?.toLowerCase().includes(q))
        score += 60;
    if (article.description?.toLowerCase().includes(q))
        score += 30;
    if (article.category?.name?.toLowerCase().includes(q))
        score += 20;
    if (article.subcategory?.name?.toLowerCase().includes(q))
        score += 18;
    if (article.tags && article.tags.toLowerCase().includes(q))
        score += 35;
    if (article.content?.toLowerCase().includes(q))
        score += 10;
    if (article.starred)
        score += 6;
    if (article.featured)
        score += 4;
    const words = q.split(/\s+/).filter(Boolean);
    for (const word of words) {
        if (article.title?.toLowerCase().includes(word))
            score += 8;
        if (article.content?.toLowerCase().includes(word))
            score += 2;
    }
    return score;
}
router.get('/featured', asyncHandler(async (req, res) => {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
    const featured = await prisma.featuredArticle.findMany({
        include: {
            article: {
                include: articleInclude,
            },
        },
        orderBy: [{ position: 'asc' }, { featuredFrom: 'desc' }],
        take: limit,
    });
    const articles = featured
        .map((item) => item.article)
        .filter(Boolean)
        .map((article) => serializeArticle(article));
    if (articles.length < limit) {
        const fallback = await prisma.article.findMany({
            where: {
                OR: [{ featured: true }, { starred: true }],
                id: { notIn: articles.map((article) => article.id) },
            },
            include: articleInclude,
            orderBy: [{ starred: 'desc' }, { starCount: 'desc' }, { updatedAt: 'desc' }],
            take: limit - articles.length,
        });
        articles.push(...fallback.map((article) => serializeArticle(article)));
    }
    res.json({ success: true, data: articles });
}));
router.get('/search/query', asyncHandler(async (req, res) => {
    const validation = SearchQuerySchema.safeParse(req.query);
    if (!validation.success) {
        throw AppError.badRequest('Parametros de busca invalidos', validation.error);
    }
    const { q, type, limit } = validation.data;
    const where = { OR: [] };
    if (type === 'all' || type === 'title') {
        where.OR.push({ title: { contains: q } }, { description: { contains: q } });
    }
    if (type === 'all' || type === 'content') {
        where.OR.push({ content: { contains: q } });
    }
    if (type === 'all' || type === 'tags') {
        where.OR.push({ tags: { contains: q } });
    }
    if (type === 'all' || type === 'category') {
        where.OR.push({ category: { name: { contains: q } } }, { subcategory: { name: { contains: q } } });
    }
    const articles = await prisma.article.findMany({
        where: where.OR.length ? where : undefined,
        include: articleInclude,
        take: Math.max(limit * 4, limit),
        orderBy: { updatedAt: 'desc' },
    });
    const results = articles
        .map((article) => ({
        ...serializeArticle(article),
        score: scoreArticle(article, q),
        highlight: makeHighlight(article.content || article.description, q),
    }))
        .filter((article) => article.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    res.json({
        success: true,
        data: results,
        meta: {
            query: q,
            suggestions: results.slice(0, 5).map((article) => article.title),
        },
    });
}));
router.get('/', asyncHandler(async (req, res) => {
    const validation = GetArticlesQuerySchema.safeParse(req.query);
    if (!validation.success) {
        throw AppError.badRequest('Query parameters invalidos', validation.error);
    }
    const { page, pageSize, categoryId, categorySlug, subcategoryId, subcategorySlug, difficulty, featured, starred, search, tag, sortBy, sortOrder, } = validation.data;
    const where = {};
    if (categoryId)
        where.categoryId = categoryId;
    if (categorySlug)
        where.category = { slug: categorySlug };
    if (subcategoryId)
        where.subcategoryId = subcategoryId;
    if (subcategorySlug)
        where.subcategory = { slug: subcategorySlug };
    if (difficulty)
        where.difficulty = difficulty;
    if (featured !== undefined)
        where.featured = featured;
    if (starred !== undefined)
        where.starred = starred;
    if (tag)
        where.tags = { contains: createSlugLike(tag) };
    if (search) {
        where.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
            { content: { contains: search } },
            { tags: { contains: search } },
        ];
    }
    const total = await prisma.article.count({ where });
    const orderKey = sortBy === 'readingTime' ? 'readingTimeMinutes' : sortBy;
    const articles = await prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: { [orderKey]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
    });
    res.json({
        success: true,
        data: {
            items: articles.map((article) => serializeArticle(article)),
            pagination: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        },
    });
}));
router.get('/:slug/related', asyncHandler(async (req, res) => {
    const slug = typeof req.params.slug === 'string' ? req.params.slug : String(req.params.slug);
    const article = await prisma.article.findUnique({
        where: { slug },
    });
    if (!article)
        throw AppError.notFound('Artigo');
    const tags = safeJsonParse(article.tags, []);
    const related = await prisma.article.findMany({
        where: {
            id: { not: article.id },
            OR: [
                { categoryId: article.categoryId },
                { subcategoryId: article.subcategoryId },
                tags.length ? { OR: tags.map((t) => ({ tags: { contains: t } })) } : {},
            ],
        },
        include: articleInclude,
        take: 6,
        orderBy: [{ starred: 'desc' }, { featured: 'desc' }, { updatedAt: 'desc' }],
    });
    res.json({
        success: true,
        data: related.map((item) => serializeArticle(item)),
    });
}));
router.get('/:slug/previous-next', asyncHandler(async (req, res) => {
    const articles = await prisma.article.findMany({
        include: {
            category: true,
            subcategory: true,
            mediaAssets: false,
        },
        orderBy: [
            { category: { order: 'asc' } },
            { category: { name: 'asc' } },
            { subcategory: { order: 'asc' } },
            { subcategory: { name: 'asc' } },
            { title: 'asc' },
        ],
    });
    const index = articles.findIndex((article) => article.slug === req.params.slug);
    res.json({
        success: true,
        data: {
            previous: index > 0 ? serializeArticle(articles[index - 1]) : null,
            next: index >= 0 && index < articles.length - 1 ? serializeArticle(articles[index + 1]) : null,
        },
    });
}));
router.post('/:slug/view', asyncHandler(async (req, res) => {
    const slug = typeof req.params.slug === 'string' ? req.params.slug : String(req.params.slug);
    const article = await prisma.article.findUnique({ where: { slug } });
    if (!article)
        throw AppError.notFound('Artigo');
    await prisma.featuredArticle
        .update({
        where: { articleId: article.id },
        data: { views: { increment: 1 } },
    })
        .catch(() => undefined);
    const stats = await prisma.readingStats.findFirst({ select: { id: true } });
    if (stats) {
        await prisma.readingStats.update({
            where: { id: stats.id },
            data: { totalViews: { increment: 1 } },
        });
    }
    res.json({ success: true, data: { ok: true } });
}));
router.post('/:slug/star', asyncHandler(async (req, res) => {
    const slug = typeof req.params.slug === 'string' ? req.params.slug : String(req.params.slug);
    const current = await prisma.article.findUnique({
        where: { slug },
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            excerpt: true,
            coverImage: true,
            starred: true,
            starCount: true,
            starredAt: true,
        },
    });
    if (!current)
        throw AppError.notFound('Artigo');
    const requested = typeof req.body?.starred === 'boolean' ? req.body.starred : undefined;
    const nextStarred = requested ?? !current.starred;
    const nextStarCount = nextStarred && !current.starred ? current.starCount + 1 : current.starCount;
    const article = await prisma.article.update({
        where: { id: current.id },
        data: {
            starred: nextStarred,
            featured: nextStarred,
            starCount: nextStarCount,
            starredAt: nextStarred ? current.starredAt || new Date() : null,
        },
        include: articleInclude,
    });
    if (nextStarred) {
        const currentCount = await prisma.featuredArticle.count();
        await prisma.featuredArticle.upsert({
            where: { articleId: article.id },
            create: {
                articleId: article.id,
                position: currentCount,
                banner: article.coverImage,
                tagline: article.description || article.excerpt,
            },
            update: {
                banner: article.coverImage,
                tagline: article.description || article.excerpt,
            },
        });
    }
    else {
        await prisma.featuredArticle.deleteMany({ where: { articleId: article.id } });
    }
    const stats = await prisma.readingStats.findFirst({ select: { id: true } });
    if (stats) {
        const [featuredCount, starredCount] = await Promise.all([
            prisma.article.count({ where: { featured: true } }),
            prisma.article.count({ where: { starred: true } }),
        ]);
        await prisma.readingStats.update({
            where: { id: stats.id },
            data: {
                featuredCount,
                starredCount,
            },
        });
    }
    res.json({ success: true, data: serializeArticle(article) });
}));
router.get('/:slug', asyncHandler(async (req, res) => {
    const slug = typeof req.params.slug === 'string' ? req.params.slug : String(req.params.slug);
    const article = await prisma.article.findUnique({
        where: { slug },
        include: articleInclude,
    });
    if (!article) {
        throw AppError.notFound('Artigo');
    }
    res.json({
        success: true,
        data: serializeArticle(article, true),
    });
}));
function createSlugLike(value) {
    return value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
export default router;
//# sourceMappingURL=articles.js.map