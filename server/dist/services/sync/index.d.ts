/**
 * GitHub -> SQLite synchronization service.
 *
 * Identity is based on githubPath. Article slug/title are derived from the
 * markdown content and may change safely across syncs.
 */
export interface SyncResult {
    status: 'success' | 'failed' | 'partial';
    filesProcessed: number;
    filesAdded: number;
    filesModified: number;
    filesDeleted: number;
    duration: number;
    errors: Array<{
        file: string;
        error: string;
    }>;
}
export declare class SyncService {
    private categoryMetadata;
    private subcategoryMetadata;
    sync(full?: boolean): Promise<SyncResult>;
    incrementalSync(): Promise<SyncResult>;
    wipeDatabase(): Promise<void>;
    private syncArticleFile;
    private resolveArticleLocation;
    private upsertCategory;
    private upsertSubcategory;
    private replaceArticleMedia;
    private syncFeaturedArticle;
    private deleteRemovedArticles;
    private syncAssets;
    private removeEmptyTaxonomy;
    private updateReadingStats;
    private getCategoryMetadata;
    private getSubcategoryMetadata;
    private getArticleMetadata;
    private mergeArticleMetadata;
    private firstDefined;
    private optionalBoolean;
    private optionalNumber;
    private normalizeTags;
    private createUniqueArticleSlug;
    private isSlugAvailable;
    private assetTypeFromPath;
}
export declare const syncService: SyncService;
//# sourceMappingURL=index.d.ts.map