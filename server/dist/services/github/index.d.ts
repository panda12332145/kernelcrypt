/**
 * GitHub API service.
 *
 * The content repository is treated as the source of truth. This service reads
 * the recursive tree once, fetches blobs by SHA, and keeps a short-lived cache in
 * SQLite plus memory to avoid burning API quota.
 */
export interface GitHubTreeFile {
    path: string;
    type: 'file' | 'dir';
    size: number;
    sha: string;
    url: string;
    downloadUrl: string;
}
export interface CommitInfo {
    sha: string;
    message: string;
    author: string;
    date: Date;
    filesChanged: number;
}
export declare class GitHubService {
    private octokit;
    private owner;
    private repo;
    private branch;
    private contentRoot;
    constructor();
    testConnection(): Promise<boolean>;
    validateRepository(): Promise<{
        exists: boolean;
        isPrivate: boolean;
    }>;
    getRepositoryTree(force?: boolean): Promise<GitHubTreeFile[]>;
    getFileTree(path?: string): Promise<GitHubTreeFile[]>;
    getFileContent(path: string, sha?: string): Promise<string>;
    getBlobContent(sha: string, pathForLog?: string): Promise<string>;
    getFileLastCommit(filePath: string): Promise<CommitInfo | null>;
    getRecentCommits(since?: Date, maxResults?: number): Promise<CommitInfo[]>;
    listCategories(): Promise<string[]>;
    listMarkdownFiles(): Promise<GitHubTreeFile[]>;
    listAssetFiles(): Promise<GitHubTreeFile[]>;
    listArticlesInCategory(categorySlug: string): Promise<GitHubTreeFile[]>;
    getCategoryMetadata(categoryPath: string): Promise<Record<string, any> | null>;
    getSubcategoryMetadata(path: string): Promise<Record<string, any> | null>;
    getRawUrl(path: string): string;
    private findFile;
    private isTextFile;
    private readCached;
    private writeCached;
    private requestWithRetry;
}
export declare const gitHubService: GitHubService;
//# sourceMappingURL=index.d.ts.map