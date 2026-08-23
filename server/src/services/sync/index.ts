/**
 * GitHub -> SQLite synchronization service.
 *
 * Identity is based on githubPath. Article slug/title are derived from the
 * markdown content and may change safely across syncs.
 */

import { Prisma } from '@prisma/client';
import { config } from '@/config';
import { prisma } from '@/database/prisma';
import { gitHubService, GitHubTreeFile } from '@/services/github';
import { markdownParser, ParsedMarkdown } from '@/services/parser';
import { cacheManager } from '@/services/cache';
import { logger } from '@/utils/logger';
import {
  basename,
  createSlug,
  normalizeDifficulty,
  titleCaseFromSlug,
  withoutExtension,
  formatNameFromFolder,
  parseUnicodeEmojis
} from '@/utils';
import { AppError, logError } from '@/utils/errors';
import { MediaType } from '@/types';

export interface SyncResult {
  status: 'success' | 'failed' | 'partial';
  filesProcessed: number;
  filesAdded: number;
  filesModified: number;
  filesDeleted: number;
  duration: number;
  errors: Array<{ file: string; error: string }>;
}

interface ArticleLocation {
  categorySlug: string;
  categoryName: string;
  categoryPath: string;
  subcategorySlug: string;
  subcategoryName: string;
  subcategoryPath: string;
  filename: string;
}

type CategoryMetadata = Record<string, any>;

export class SyncService {
  private categoryMetadata = new Map<string, CategoryMetadata | null>();
  private subcategoryMetadata = new Map<string, CategoryMetadata | null>();

  async sync(full = false): Promise<SyncResult> {
    const startedAt = new Date();
    const errors: Array<{ file: string; error: string }> = [];
    let filesAdded = 0;
    let filesModified = 0;
    let filesDeleted = 0;
    let filesProcessed = 0;

    const syncLog = await prisma.syncLog.create({
      data: {
        syncType: full ? 'full' : 'incremental',
        status: 'pending',
        message: 'Sincronizacao iniciada',
        startedAt,
      },
    });

    try {
      logger.info(`Iniciando sincronizacao ${full ? 'completa' : 'incremental'}`);

      const validation = await gitHubService.validateRepository();
      if (!validation.exists) {
        throw AppError.notFound(`Repositorio ${config.github.owner}/${config.github.repo}`);
      }

      const tree = await gitHubService.getRepositoryTree(full);
      const markdownFiles = tree.filter(
        (file) =>
          file.type === 'file' &&
          /^categories\/(?!assets\/)/.test(file.path) &&
          /\.(md|markdown|mdx)$/i.test(file.path)
      );

      const articlePaths = new Set(markdownFiles.map((file) => file.path));
      filesDeleted += await this.deleteRemovedArticles(articlePaths);

      for (const file of markdownFiles) {
        filesProcessed++;

        try {
          const result = await this.syncArticleFile(file, full);
          if (result === 'added') filesAdded++;
          if (result === 'modified') filesModified++;
        } catch (error) {
          logError(error, `SYNC:ARTICLE:${file.path}`);
          errors.push({
            file: file.path,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const assetResult = await this.syncAssets();
      filesProcessed += assetResult.processed;
      filesAdded += assetResult.added;
      filesModified += assetResult.modified;
      filesDeleted += assetResult.deleted;

      await this.removeEmptyTaxonomy(articlePaths);
      await this.updateReadingStats();

      cacheManager.clear();

      const duration = Date.now() - startedAt.getTime();
      const status = errors.length === 0 ? 'success' : errors.length < filesProcessed ? 'partial' : 'failed';

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status,
          message: `Sincronizacao ${status}`,
          filesProcessed,
          filesAdded,
          filesModified,
          filesDeleted,
          errorDetails: errors.length ? JSON.stringify(errors) : null,
          repositorySha: tree[0]?.sha,
          completedAt: new Date(),
          durationMs: duration,
        },
      });

      logger.info(`Sincronizacao ${status}: ${filesProcessed} arquivos em ${duration}ms`, {
        added: filesAdded,
        modified: filesModified,
        deleted: filesDeleted,
        errors: errors.length,
      });

      return {
        status,
        filesProcessed,
        filesAdded,
        filesModified,
        filesDeleted,
        duration,
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startedAt.getTime();

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          message: error instanceof Error ? error.message : 'Falha na sincronizacao',
          errorDetails: JSON.stringify({ error: error instanceof Error ? error.stack : String(error) }),
          completedAt: new Date(),
          durationMs: duration,
        },
      });

      logError(error, 'SYNC:MAIN');
      throw error;
    }
  }

  async incrementalSync(): Promise<SyncResult> {
    return this.sync(false);
  }

  async wipeDatabase(): Promise<void> {
    logger.warn('Limpando banco de dados da wiki');

    await prisma.syncLog.deleteMany({});
    await prisma.gitHubCache.deleteMany({});
    await prisma.featuredArticle.deleteMany({});
    await prisma.readingStats.deleteMany({});
    await prisma.mediaAsset.deleteMany({});
    await prisma.article.deleteMany({});
    await prisma.subcategory.deleteMany({});
    await prisma.category.deleteMany({});
  }

  private async syncArticleFile(file: GitHubTreeFile, full: boolean): Promise<'added' | 'modified' | 'skipped'> {
    const location = this.resolveArticleLocation(file.path);
    const categoryMetadata = await this.getCategoryMetadata(location.categoryPath);
    const category = await this.upsertCategory(location, categoryMetadata);
    const subcategoryMetadata = await this.getSubcategoryMetadata(location.subcategoryPath);
    const subcategory = await this.upsertSubcategory(category.id, location, subcategoryMetadata, categoryMetadata);

    const existing = await prisma.article.findUnique({
      where: { githubPath: file.path },
      select: {
        id: true,
        githubLastCommit: true,
        slug: true,
        featured: true,
        starred: true,
        starCount: true,
        starredAt: true,
      },
    });

    if (existing && existing.githubLastCommit === file.sha && !full) {
      await prisma.article.update({
        where: { id: existing.id },
        data: { lastSyncedAt: new Date() },
      });
      return 'skipped';
    }

    const content = await gitHubService.getFileContent(file.path, file.sha);
    const parsed = markdownParser.parse(content, {
      sourcePath: file.path,
      categorySlug: location.categorySlug,
    });
    const articleMetadata = this.getArticleMetadata(categoryMetadata, file.path, location.filename);
    const merged = this.mergeArticleMetadata(parsed, articleMetadata);
    const explicitStarred = this.optionalBoolean(
      this.firstDefined(
        articleMetadata.starred,
        articleMetadata.star,
        articleMetadata.favorite,
        parsed.frontmatter.starred,
        parsed.frontmatter.star,
        parsed.frontmatter.favorite
      )
    );
    const explicitStarCount = this.optionalNumber(
      this.firstDefined(
        articleMetadata.starCount,
        articleMetadata.stars,
        parsed.frontmatter.starCount,
        parsed.frontmatter.stars
      )
    );
    const starred = explicitStarred ?? existing?.starred ?? merged.starred;
    const starCount = explicitStarCount ?? existing?.starCount ?? merged.starCount ?? (starred ? 1 : 0);
    const featured = Boolean(merged.featured || starred);
    const starredAt = starred ? existing?.starredAt || new Date() : null;
    const commit = await gitHubService.getFileLastCommit(file.path);
    const slug = await this.createUniqueArticleSlug(
      merged.title,
      location.categorySlug,
      location.filename,
      existing?.id
    );

    const articleData = {
      slug,
      title: merged.title,
      seoTitle: merged.seoTitle,
      description: merged.description,
      excerpt: merged.excerpt,
      content: merged.content,
      renderedHtml: merged.renderedHtml,
      tocJson: JSON.stringify(merged.toc),
      categoryId: category.id,
      subcategoryId: subcategory.id,
      difficulty: merged.difficulty,
      featured,
      starred,
      starCount,
      starredAt,
      tags: JSON.stringify(merged.tags),
      coverImage: merged.coverImage,
      canonicalUrl: `/wiki/${slug}`,
      totalWords: merged.wordCount,
      estimatedWords: merged.wordCount,
      mediaCount: merged.mediaCount,
      readingTimeSeconds: merged.readingTimeSeconds,
      readingTimeMinutes: merged.readingTimeMinutes,
      extraSeconds: merged.extraSeconds,
      readingCalculatedAt: new Date(),
      githubPath: file.path,
      githubLastCommit: file.sha,
      githubLastCommitDate: commit?.date,
      lastSyncedAt: new Date(),
    } satisfies Prisma.ArticleUncheckedCreateInput;

    const article = existing
      ? await prisma.article.update({
          where: { id: existing.id },
          data: articleData,
        })
      : await prisma.article.create({
          data: articleData,
        });

    await this.replaceArticleMedia(article.id, merged.mediaAssets);
    await this.syncFeaturedArticle(article.id, {
      ...merged,
      featured,
      starred,
      starCount,
    });

    return existing ? 'modified' : 'added';
  }

  private resolveArticleLocation(path: string): ArticleLocation {
    const parts = path.split('/');
    const rawCategory = parts[1] || 'uncategorized';
    const categoryName = formatNameFromFolder(rawCategory);
    const categorySlug = createSlug(rawCategory);
    const categoryPath = `${config.github.contentRoot}/${rawCategory}`;
    const relativeParts = parts.slice(2);
    const filename = relativeParts[relativeParts.length - 1] || 'intro.md';
    const folderParts = relativeParts.slice(0, -1).filter(Boolean);

    if (folderParts.length === 0) {
      return {
        categorySlug,
        categoryName,
        categoryPath,
        subcategorySlug: 'overview',
        subcategoryName: 'Overview',
        subcategoryPath: categoryPath,
        filename,
      };
    }

    const rawSubcategory = folderParts.join('-');
    const subcategorySlug = createSlug(rawSubcategory);

    return {
      categorySlug,
      categoryName,
      categoryPath,
      subcategorySlug,
      subcategoryName: formatNameFromFolder(folderParts[folderParts.length - 1]),
      subcategoryPath: `${categoryPath}/${folderParts.join('/')}`,
      filename,
    };
  }

  private async upsertCategory(location: ArticleLocation, metadata: CategoryMetadata | null) {
    const data = {
      slug: location.categorySlug,
      name: String(metadata?.name || location.categoryName),
      description: metadata?.description ? String(metadata.description) : `Conteudo sobre ${location.categoryName}`,
      icon: metadata?.icon ? String(metadata.icon) : 'Terminal',
      color: metadata?.color ? String(metadata.color) : '#00ff88',
      order: Number(metadata?.order || 0),
      githubPath: location.categoryPath,
    };

    return prisma.category.upsert({
      where: { slug: location.categorySlug },
      create: data,
      update: data,
    });
  }

  private async upsertSubcategory(
    categoryId: string,
    location: ArticleLocation,
    metadata: CategoryMetadata | null,
    categoryMetadata: CategoryMetadata | null
  ) {
    const defaultSubcategory =
      categoryMetadata?.defaultSubcategory && typeof categoryMetadata.defaultSubcategory === 'object'
        ? categoryMetadata.defaultSubcategory
        : {};
    const directOverview = location.subcategorySlug === 'overview';

    const data = {
      slug: directOverview ? createSlug(defaultSubcategory?.slug || 'overview') : location.subcategorySlug,
      name: String(metadata?.name || defaultSubcategory?.name || location.subcategoryName),
      description: metadata?.description ? String(metadata.description) : defaultSubcategory?.description,
      icon: metadata?.icon ? String(metadata.icon) : defaultSubcategory?.icon,
      color: metadata?.color ? String(metadata.color) : defaultSubcategory?.color,
      order: Number(metadata?.order || defaultSubcategory?.order || 0),
      githubPath: location.subcategoryPath,
      categoryId,
    };

    return prisma.subcategory.upsert({
      where: {
        categoryId_slug: {
          categoryId,
          slug: data.slug,
        },
      },
      create: data,
      update: data,
    });
  }

  private async replaceArticleMedia(articleId: string, mediaAssets: ParsedMarkdown['mediaAssets']): Promise<void> {
    await prisma.mediaAsset.deleteMany({ where: { articleId } });

    if (mediaAssets.length === 0) return;

    await prisma.mediaAsset.createMany({
      data: mediaAssets.map((asset) => ({
        articleId,
        type: asset.type,
        url: asset.url,
        title: asset.title,
        altText: asset.altText,
        githubPath: asset.githubPath,
        githubUrl: asset.githubUrl,
      })),
    });
  }

  private async syncFeaturedArticle(articleId: string, article: ParsedMarkdown): Promise<void> {
    if (!article.featured && !article.starred) {
      await prisma.featuredArticle.deleteMany({ where: { articleId } });
      return;
    }

    const currentCount = await prisma.featuredArticle.count();

    await prisma.featuredArticle.upsert({
      where: { articleId },
      create: {
        articleId,
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

  private async deleteRemovedArticles(currentPaths: Set<string>): Promise<number> {
    const existing = await prisma.article.findMany({
      where: { githubPath: { not: null } },
      select: { id: true, githubPath: true },
    });

    const removed = existing.filter((article) => article.githubPath && !currentPaths.has(article.githubPath));

    if (removed.length === 0) return 0;

    await prisma.article.deleteMany({
      where: {
        id: {
          in: removed.map((article) => article.id),
        },
      },
    });

    logger.info(`${removed.length} artigos removidos do banco por ausencia no GitHub`);
    return removed.length;
  }

  private async syncAssets(): Promise<{ processed: number; added: number; modified: number; deleted: number }> {
    const files = await gitHubService.listAssetFiles();
    const currentPaths = new Set(files.map((file) => file.path));
    let added = 0;
    let modified = 0;
    let deleted = 0;

    const existing = await prisma.mediaAsset.findMany({
      where: {
        articleId: null,
        githubPath: { startsWith: `${config.github.contentRoot}/assets/` },
      },
    });

    const removed = existing.filter((asset) => asset.githubPath && !currentPaths.has(asset.githubPath));
    if (removed.length > 0) {
      await prisma.mediaAsset.deleteMany({
        where: { id: { in: removed.map((asset) => asset.id) } },
      });
      deleted += removed.length;
    }

    for (const file of files) {
      const type = this.assetTypeFromPath(file.path);
      if (!type) continue;

      const existingAsset = existing.find((asset) => asset.githubPath === file.path);
      const data = {
        articleId: null,
        type,
        url: gitHubService.getRawUrl(file.path),
        title: basename(file.path),
        githubPath: file.path,
        githubUrl: `https://github.com/${config.github.owner}/${config.github.repo}/blob/${config.github.branch}/${file.path}`,
        sha: file.sha,
        sizeBytes: file.size,
      };

      if (!existingAsset) {
        await prisma.mediaAsset.create({ data });
        added++;
      } else if (existingAsset.sha !== file.sha) {
        await prisma.mediaAsset.update({
          where: { id: existingAsset.id },
          data,
        });
        modified++;
      }
    }

    return {
      processed: files.length,
      added,
      modified,
      deleted,
    };
  }

  private async removeEmptyTaxonomy(articlePaths: Set<string>): Promise<void> {
    const activeCategories = new Set(
      [...articlePaths].map((path) => createSlug(path.split('/')[1] || 'uncategorized'))
    );

    await prisma.subcategory.deleteMany({
      where: {
        articles: { none: {} },
      },
    });

    await prisma.category.deleteMany({
      where: {
        slug: { notIn: [...activeCategories] },
        articles: { none: {} },
      },
    });
  }

  private async updateReadingStats(): Promise<void> {
    const [totalArticles, beginnerCount, intermediateCount, advancedCount, featuredCount, starredCount, readingAvg, categories, media] =
      await Promise.all([
        prisma.article.count(),
        prisma.article.count({ where: { difficulty: 'beginner' } }),
        prisma.article.count({ where: { difficulty: 'intermediate' } }),
        prisma.article.count({ where: { difficulty: 'advanced' } }),
        prisma.article.count({ where: { featured: true } }),
        prisma.article.count({ where: { starred: true } }),
        prisma.article.aggregate({ _avg: { readingTimeMinutes: true } }),
        prisma.category.findMany({
          include: {
            _count: { select: { articles: true, subcategories: true } },
          },
        }),
        prisma.mediaAsset.groupBy({
          by: ['type'],
          _count: { type: true },
        }),
      ]);

    const categoryStats = categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      articles: category._count.articles,
      subcategories: category._count.subcategories,
    }));

    const mediaStats = media.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {});

    const existing = await prisma.readingStats.findFirst({ select: { id: true } });

    const data = {
      totalArticles,
      beginnerCount,
      intermediateCount,
      advancedCount,
      featuredCount,
      starredCount,
      averageReadingTimeMinutes: Number(readingAvg._avg.readingTimeMinutes || 0),
      categoryStats: JSON.stringify(categoryStats),
      mediaStats: JSON.stringify(mediaStats),
      calculatedAt: new Date(),
    };

    if (existing) {
      await prisma.readingStats.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.readingStats.create({ data });
    }
  }

  private async getCategoryMetadata(categoryPath: string): Promise<CategoryMetadata | null> {
    if (this.categoryMetadata.has(categoryPath)) {
      return this.categoryMetadata.get(categoryPath) || null;
    }

    const metadata = await gitHubService.getCategoryMetadata(categoryPath);
    this.categoryMetadata.set(categoryPath, metadata);
    return metadata;
  }

  private async getSubcategoryMetadata(path: string): Promise<CategoryMetadata | null> {
    if (this.subcategoryMetadata.has(path)) {
      return this.subcategoryMetadata.get(path) || null;
    }

    const metadata = await gitHubService.getSubcategoryMetadata(path);
    this.subcategoryMetadata.set(path, metadata);
    return metadata;
  }

  private getArticleMetadata(
    metadata: CategoryMetadata | null,
    githubPath: string,
    filename: string
  ): Record<string, any> {
    const articles = metadata?.articles;
    if (!articles || typeof articles !== 'object') return {};

    const keys = [
      githubPath,
      filename,
      withoutExtension(filename),
      createSlug(withoutExtension(filename)),
    ];

    for (const key of keys) {
      if (articles[key]) return articles[key];
    }

    return {};
  }

  private mergeArticleMetadata(parsed: ParsedMarkdown, metadata: Record<string, any>): ParsedMarkdown {
    return {
      ...parsed,
      title: parseUnicodeEmojis(metadata.title || parsed.title),
      seoTitle: parseUnicodeEmojis(metadata.seoTitle || metadata.title || parsed.seoTitle),
      description: metadata.description || parsed.description,
      excerpt: metadata.excerpt || parsed.excerpt,
      difficulty: normalizeDifficulty(metadata.difficulty || parsed.difficulty),
      featured: (this.optionalBoolean(metadata.featured) ?? parsed.featured) || (this.optionalBoolean(this.firstDefined(metadata.starred, metadata.star, metadata.favorite)) ?? parsed.starred),
      starred: this.optionalBoolean(this.firstDefined(metadata.starred, metadata.star, metadata.favorite)) ?? parsed.starred,
      starCount: this.optionalNumber(this.firstDefined(metadata.starCount, metadata.stars)) ?? parsed.starCount,
      tags: metadata.tags ? this.normalizeTags(metadata.tags) : parsed.tags,
      coverImage: metadata.coverImage || parsed.coverImage,
    };
  }

  private firstDefined(...values: unknown[]): unknown {
    return values.find((value) => value !== undefined && value !== null);
  }

  private optionalBoolean(value: unknown): boolean | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'y', 'on', 'starred', 'featured'].includes(normalized)) return true;
      if (['false', '0', 'no', 'n', 'off', 'none'].includes(normalized)) return false;
    }

    return Boolean(value);
  }

  private optionalNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
    }

    return undefined;
  }

  private normalizeTags(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [];
  }

  private async createUniqueArticleSlug(
    title: string,
    categorySlug: string,
    filename: string,
    currentArticleId?: string
  ): Promise<string> {
    const bases = [
      createSlug(title),
      createSlug(`${categorySlug}-${title}`),
      createSlug(`${categorySlug}-${withoutExtension(filename)}`),
    ];

    for (const base of bases) {
      const available = await this.isSlugAvailable(base, currentArticleId);
      if (available) return base;
    }

    const base = bases[0];
    let counter = 2;
    let candidate = `${base}-${counter}`;

    while (!(await this.isSlugAvailable(candidate, currentArticleId))) {
      counter++;
      candidate = `${base}-${counter}`;
    }

    return candidate;
  }

  private async isSlugAvailable(slug: string, currentArticleId?: string): Promise<boolean> {
    const existing = await prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    return !existing || existing.id === currentArticleId;
  }

  private assetTypeFromPath(path: string): MediaType | null {
    const lower = path.toLowerCase();

    if (lower.endsWith('.gif')) return 'gif';
    if (/\.(png|jpe?g|webp|avif|svg)$/.test(lower)) return 'image';
    if (/\.(mp4|webm|mov)$/.test(lower)) return 'video';
    if (lower.endsWith('.pdf')) return 'pdf';
    if (/\.(mp3|wav|ogg)$/.test(lower)) return 'audio';

    return null;
  }
}

export const syncService = new SyncService();
