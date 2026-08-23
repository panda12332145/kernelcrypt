import { z } from 'zod';
export declare const ArticleCreateSchema: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodString;
    content: z.ZodString;
    categoryId: z.ZodString;
    subcategoryId: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodDefault<z.ZodEnum<{
        beginner: "beginner";
        intermediate: "intermediate";
        advanced: "advanced";
    }>>;
    featured: z.ZodDefault<z.ZodBoolean>;
    starred: z.ZodDefault<z.ZodBoolean>;
    starCount: z.ZodDefault<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    coverImage: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const GetArticlesQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    categoryId: z.ZodOptional<z.ZodString>;
    categorySlug: z.ZodOptional<z.ZodString>;
    subcategoryId: z.ZodOptional<z.ZodString>;
    subcategorySlug: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodOptional<z.ZodEnum<{
        beginner: "beginner";
        intermediate: "intermediate";
        advanced: "advanced";
    }>>;
    featured: z.ZodOptional<z.ZodPreprocess<z.ZodBoolean>>;
    starred: z.ZodOptional<z.ZodPreprocess<z.ZodBoolean>>;
    search: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<{
        title: "title";
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        readingTime: "readingTime";
        readingTimeMinutes: "readingTimeMinutes";
    }>>;
    sortOrder: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export declare const SearchQuerySchema: z.ZodObject<{
    q: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<{
        category: "category";
        title: "title";
        content: "content";
        tags: "tags";
        all: "all";
    }>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const SyncOptionsSchema: z.ZodObject<{
    full: z.ZodDefault<z.ZodBoolean>;
    maxConcurrent: z.ZodDefault<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type ArticleCreate = z.infer<typeof ArticleCreateSchema>;
export type GetArticlesQuery = z.infer<typeof GetArticlesQuerySchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SyncOptions = z.infer<typeof SyncOptionsSchema>;
//# sourceMappingURL=schemas.d.ts.map