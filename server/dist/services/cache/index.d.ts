/**
 * Sistema de cache inteligente para markdown renderizado e GitHub API
 */
export declare class CacheManager {
    private cache;
    private maxSize;
    private enabled;
    constructor();
    /**
     * Define um valor no cache
     */
    set<T>(key: string, value: T, ttlMs?: number): void;
    /**
     * Obtém um valor do cache
     */
    get<T>(key: string): T | null;
    /**
     * Verifica se chave existe
     */
    has(key: string): boolean;
    /**
     * Remove uma chave
     */
    delete(key: string): boolean;
    /**
     * Limpa todo o cache
     */
    clear(): void;
    /**
     * Remove entradas expiradas
     */
    private cleanup;
    /**
     * Retorna estatísticas do cache
     */
    getStats(): {
        size: number;
        entries: number;
        avgHits: number;
        oldestEntry: number;
    };
    /**
     * Cria chave para markdown renderizado
     */
    static markdownKey(articleId: string, version?: string): string;
    /**
     * Cria chave para GitHub API
     */
    static githubKey(resourceType: string, resourceId: string): string;
    /**
     * Cria chave para listagem de categorias
     */
    static categoriesKey(): string;
    /**
     * Cria chave para artigos de categoria
     */
    static categoryArticlesKey(categorySlug: string): string;
    /**
     * Cria chave para metadata
     */
    static metadataKey(resourceId: string): string;
}
export declare const cacheManager: CacheManager;
//# sourceMappingURL=index.d.ts.map