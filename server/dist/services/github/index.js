/**
 * GitHub API service.
 *
 * The content repository is treated as the source of truth. This service reads
 * the recursive tree once, fetches blobs by SHA, and keeps a short-lived cache in
 * SQLite plus memory to avoid burning API quota.
 */
import { Octokit } from '@octokit/rest';
import { config } from '../../config/index.js';
import { prisma } from '../../database/prisma.js';
import { cacheManager, CacheManager } from '../../services/cache/index.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/errors.js';
const textExtensions = new Set([
    '.md',
    '.markdown',
    '.mdx',
    '.json',
    '.txt',
    '.yaml',
    '.yml',
]);
export class GitHubService {
    constructor() {
        this.owner = config.github.owner;
        this.repo = config.github.repo;
        this.branch = config.github.branch;
        this.contentRoot = config.github.contentRoot;
        this.octokit = new Octokit({
            auth: config.github.token,
            request: {
                timeout: config.github.timeout,
            },
        });
    }
    async testConnection() {
        try {
            await this.requestWithRetry(() => this.octokit.repos.get({
                owner: this.owner,
                repo: this.repo,
            }));
            logger.info(`GitHub conectado: ${this.owner}/${this.repo}@${this.branch}`);
            return true;
        }
        catch (error) {
            logger.error('Falha na conexao com GitHub', error);
            return false;
        }
    }
    async validateRepository() {
        try {
            const response = await this.requestWithRetry(() => this.octokit.repos.get({
                owner: this.owner,
                repo: this.repo,
            }));
            return {
                exists: true,
                isPrivate: response.data.private,
            };
        }
        catch (error) {
            logger.error('Repositorio GitHub nao encontrado ou inacessivel', error);
            return {
                exists: false,
                isPrivate: false,
            };
        }
    }
    async getRepositoryTree(force = false) {
        const cacheKey = CacheManager.githubKey('tree', `${this.branch}:${this.contentRoot}`);
        const memoryHit = !force ? cacheManager.get(cacheKey) : null;
        if (memoryHit)
            return memoryHit;
        if (!force) {
            const dbHit = await this.readCached('tree', `${this.branch}:${this.contentRoot}`);
            if (dbHit) {
                cacheManager.set(cacheKey, dbHit);
                return dbHit;
            }
        }
        const branch = await this.requestWithRetry(() => this.octokit.repos.getBranch({
            owner: this.owner,
            repo: this.repo,
            branch: this.branch,
        }));
        const treeSha = branch.data.commit.commit.tree.sha;
        const tree = await this.requestWithRetry(() => this.octokit.git.getTree({
            owner: this.owner,
            repo: this.repo,
            tree_sha: treeSha,
            recursive: 'true',
        }));
        if (tree.data.truncated) {
            logger.warn('A arvore do GitHub veio truncada; considere dividir o repositorio de conteudo.');
        }
        const files = tree.data.tree
            .filter((item) => item.path?.startsWith(`${this.contentRoot}/`))
            .map((item) => {
            const path = item.path || '';
            return {
                path,
                type: item.type === 'tree' ? 'dir' : 'file',
                size: item.size || 0,
                sha: item.sha || '',
                url: item.url || '',
                downloadUrl: this.getRawUrl(path),
            };
        });
        cacheManager.set(cacheKey, files);
        await this.writeCached('tree', `${this.branch}:${this.contentRoot}`, files, 15 * 60 * 1000);
        return files;
    }
    async getFileTree(path = this.contentRoot) {
        const normalized = path.replace(/^\/+|\/+$/g, '');
        const depth = normalized.split('/').filter(Boolean).length + 1;
        const tree = await this.getRepositoryTree();
        return tree.filter((item) => {
            if (!item.path.startsWith(`${normalized}/`))
                return false;
            return item.path.split('/').length === depth;
        });
    }
    async getFileContent(path, sha) {
        const fileSha = sha || (await this.findFile(path))?.sha;
        if (!fileSha) {
            throw AppError.notFound(`Arquivo ${path}`);
        }
        return this.getBlobContent(fileSha, path);
    }
    async getBlobContent(sha, pathForLog = sha) {
        const cacheKey = CacheManager.githubKey('blob', sha);
        const memoryHit = cacheManager.get(cacheKey);
        if (memoryHit !== null)
            return memoryHit;
        const dbHit = await this.readCached('blob', sha);
        if (dbHit !== null) {
            cacheManager.set(cacheKey, dbHit, 24 * 60 * 60 * 1000);
            return dbHit;
        }
        const response = await this.requestWithRetry(() => this.octokit.git.getBlob({
            owner: this.owner,
            repo: this.repo,
            file_sha: sha,
        }));
        const buffer = Buffer.from(response.data.content, 'base64');
        const content = this.isTextFile(pathForLog) ? buffer.toString('utf-8') : '';
        cacheManager.set(cacheKey, content, 24 * 60 * 60 * 1000);
        await this.writeCached('blob', sha, content, 24 * 60 * 60 * 1000);
        return content;
    }
    async getFileLastCommit(filePath) {
        const cacheId = `${this.branch}:${filePath}`;
        const dbHit = await this.readCached('commit', cacheId);
        if (dbHit) {
            return {
                ...dbHit,
                date: new Date(dbHit.date),
            };
        }
        try {
            const response = await this.requestWithRetry(() => this.octokit.repos.listCommits({
                owner: this.owner,
                repo: this.repo,
                sha: this.branch,
                path: filePath,
                per_page: 1,
            }));
            const commit = response.data[0];
            if (!commit)
                return null;
            const payload = {
                sha: commit.sha,
                message: commit.commit.message,
                author: commit.commit.author?.name || 'Unknown',
                date: new Date(commit.commit.author?.date || Date.now()),
                filesChanged: commit.files?.length || 0,
            };
            await this.writeCached('commit', cacheId, payload, 6 * 60 * 60 * 1000);
            return payload;
        }
        catch (error) {
            logger.warn(`Nao foi possivel buscar commit de ${filePath}`, error);
            return null;
        }
    }
    async getRecentCommits(since, maxResults = 30) {
        const response = await this.requestWithRetry(() => this.octokit.repos.listCommits({
            owner: this.owner,
            repo: this.repo,
            sha: this.branch,
            since: since?.toISOString(),
            per_page: maxResults,
        }));
        return (response.data || []).map((commit) => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author?.name || 'Unknown',
            date: new Date(commit.commit.author?.date || Date.now()),
            filesChanged: commit.files?.length || 0,
        }));
    }
    async listCategories() {
        const tree = await this.getRepositoryTree();
        const categories = new Set();
        for (const item of tree) {
            const match = item.path.match(/^categories\/([^/]+)/);
            if (match && match[1] !== 'assets') {
                categories.add(match[1]);
            }
        }
        return [...categories].sort((a, b) => a.localeCompare(b));
    }
    async listMarkdownFiles() {
        const tree = await this.getRepositoryTree();
        return tree.filter((item) => item.type === 'file' &&
            /^categories\/(?!assets\/)/.test(item.path) &&
            /\.(md|markdown|mdx)$/i.test(item.path));
    }
    async listAssetFiles() {
        const tree = await this.getRepositoryTree();
        return tree.filter((item) => item.type === 'file' &&
            /^categories\/assets\//.test(item.path) &&
            !/\/\.gitkeep$/i.test(item.path));
    }
    async listArticlesInCategory(categorySlug) {
        const files = await this.listMarkdownFiles();
        return files.filter((file) => file.path.startsWith(`${this.contentRoot}/${categorySlug}/`));
    }
    async getCategoryMetadata(categoryPath) {
        const path = `${categoryPath}/metadata.json`;
        const file = await this.findFile(path);
        if (!file || file.size === 0)
            return null;
        try {
            const content = await this.getFileContent(file.path, file.sha);
            if (!content.trim())
                return null;
            return JSON.parse(content);
        }
        catch (error) {
            logger.warn(`metadata.json invalido em ${categoryPath}`, error);
            return null;
        }
    }
    async getSubcategoryMetadata(path) {
        const metadataPath = `${path.replace(/\/+$/, '')}/metadata.json`;
        const file = await this.findFile(metadataPath);
        if (!file || file.size === 0)
            return null;
        try {
            const content = await this.getFileContent(file.path, file.sha);
            return content.trim() ? JSON.parse(content) : null;
        }
        catch (error) {
            logger.warn(`metadata.json invalido em ${metadataPath}`, error);
            return null;
        }
    }
    getRawUrl(path) {
        return `${config.github.rawBaseUrl}/${path.split('/').map(encodeURIComponent).join('/')}`;
    }
    async findFile(path) {
        const normalized = path.replace(/^\/+/, '');
        const tree = await this.getRepositoryTree();
        return tree.find((item) => item.path === normalized && item.type === 'file');
    }
    isTextFile(path) {
        const lower = path.toLowerCase();
        return [...textExtensions].some((ext) => lower.endsWith(ext));
    }
    async readCached(resourceType, resourceId) {
        const cache = await prisma.gitHubCache.findUnique({
            where: {
                resourceType_resourceId: {
                    resourceType,
                    resourceId,
                },
            },
        });
        if (!cache)
            return null;
        if (cache.expiresAt <= new Date()) {
            await prisma.gitHubCache.delete({ where: { id: cache.id } }).catch(() => undefined);
            return null;
        }
        await prisma.gitHubCache
            .update({
            where: { id: cache.id },
            data: {
                hits: { increment: 1 },
                lastAccessedAt: new Date(),
            },
        })
            .catch(() => undefined);
        try {
            return JSON.parse(cache.data).value;
        }
        catch {
            return null;
        }
    }
    async writeCached(resourceType, resourceId, value, ttlMs) {
        await prisma.gitHubCache
            .upsert({
            where: {
                resourceType_resourceId: {
                    resourceType,
                    resourceId,
                },
            },
            create: {
                resourceType,
                resourceId,
                data: JSON.stringify({ value }),
                expiresAt: new Date(Date.now() + ttlMs),
            },
            update: {
                data: JSON.stringify({ value }),
                expiresAt: new Date(Date.now() + ttlMs),
                lastAccessedAt: new Date(),
            },
        })
            .catch((error) => logger.debug('Falha ao gravar cache GitHub', error));
    }
    async requestWithRetry(fn, retries = 3) {
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                const status = error?.status || error?.response?.status;
                const resetHeader = error?.response?.headers?.['x-ratelimit-reset'];
                const resetMs = resetHeader ? Number(resetHeader) * 1000 - Date.now() : 0;
                const rateLimited = status === 403 || status === 429;
                if (attempt === retries)
                    break;
                const backoffMs = rateLimited && resetMs > 0 && resetMs < 60000
                    ? resetMs + 1000
                    : 800 * 2 ** attempt;
                logger.warn(`GitHub retry ${attempt + 1}/${retries} em ${backoffMs}ms`, {
                    status,
                    message: error instanceof Error ? error.message : String(error),
                });
                await new Promise((resolve) => setTimeout(resolve, backoffMs));
            }
        }
        throw lastError instanceof Error ? lastError : AppError.internal('Falha na API do GitHub', lastError);
    }
}
export const gitHubService = new GitHubService();
//# sourceMappingURL=index.js.map