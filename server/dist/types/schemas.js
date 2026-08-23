import { z } from 'zod';
// Schema para validação de dificuldade
const DifficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
const BooleanQuerySchema = z.preprocess((value) => {
    if (value === 'true')
        return true;
    if (value === 'false')
        return false;
    return value;
}, z.boolean());
// Schema para validação de artigos
export const ArticleCreateSchema = z.object({
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(200),
    content: z.string().min(1),
    categoryId: z.string().min(1),
    subcategoryId: z.string().optional(),
    difficulty: DifficultySchema.default('beginner'),
    featured: z.boolean().default(false),
    starred: z.boolean().default(false),
    starCount: z.number().int().nonnegative().default(0),
    description: z.string().optional(),
    coverImage: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
});
// Schema para query de busca de artigos
export const GetArticlesQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    categoryId: z.string().optional(),
    categorySlug: z.string().optional(),
    subcategoryId: z.string().optional(),
    subcategorySlug: z.string().optional(),
    difficulty: DifficultySchema.optional(),
    featured: BooleanQuerySchema.optional(),
    starred: BooleanQuerySchema.optional(),
    search: z.string().optional(),
    tag: z.string().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'readingTime', 'readingTimeMinutes']).default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
// Schema para busca
export const SearchQuerySchema = z.object({
    q: z.string().min(1).max(100),
    type: z.enum(['title', 'content', 'tags', 'category', 'all']).default('all'),
    limit: z.coerce.number().int().positive().max(50).default(10),
});
// Schema para sincronização
export const SyncOptionsSchema = z.object({
    full: z.boolean().default(false),
    maxConcurrent: z.number().int().positive().default(5),
    timeout: z.number().int().positive().default(30000),
});
//# sourceMappingURL=schemas.js.map