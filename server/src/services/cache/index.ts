/**
 * Sistema de cache inteligente para markdown renderizado e GitHub API
 */

import { config } from '@/config';
import { logger } from '@/utils/logger';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
  createdAt: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private enabled: boolean;

  constructor() {
    this.cache = new Map();
    this.maxSize = config.cache.maxSizeBytes;
    this.enabled = config.cache.enabled;

    // Limpar cache expirado a cada 5 minutos
    if (this.enabled) {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Define um valor no cache
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    if (!this.enabled) return;

    const expiresAt = Date.now() + (ttlMs || config.cache.ttlMs);

    this.cache.set(key, {
      value,
      expiresAt,
      hits: 0,
      createdAt: Date.now(),
    });

    logger.debug(`Cache SET: ${key} (TTL: ${ttlMs || config.cache.ttlMs}ms)`);
  }

  /**
   * Obtém um valor do cache
   */
  get<T>(key: string): T | null {
    if (!this.enabled) return null;

    const entry = this.cache.get(key);

    if (!entry) return null;

    // Verificar se expirou
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    // Atualizar estatísticas
    entry.hits++;
    entry.createdAt = Date.now(); // Atualizar tempo de acesso

    logger.debug(`Cache HIT: ${key} (hits: ${entry.hits})`);
    return entry.value as T;
  }

  /**
   * Verifica se chave existe
   */
  has(key: string): boolean {
    if (!this.enabled) return false;

    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove uma chave
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    logger.info('Cache limpo completamente');
  }

  /**
   * Remove entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug(`Cache cleanup: ${removed} entradas removidas`);
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): {
    size: number;
    entries: number;
    avgHits: number;
    oldestEntry: number;
  } {
    if (this.cache.size === 0) {
      return {
        size: 0,
        entries: 0,
        avgHits: 0,
        oldestEntry: 0,
      };
    }

    let totalHits = 0;
    let oldestTime = Date.now();

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
      }
    }

    return {
      size: this.cache.size,
      entries: this.cache.size,
      avgHits: Math.round(totalHits / this.cache.size),
      oldestEntry: Date.now() - oldestTime,
    };
  }

  /**
   * Cria chave para markdown renderizado
   */
  static markdownKey(articleId: string, version?: string): string {
    return `markdown:${articleId}:${version || 'latest'}`;
  }

  /**
   * Cria chave para GitHub API
   */
  static githubKey(resourceType: string, resourceId: string): string {
    return `github:${resourceType}:${resourceId}`;
  }

  /**
   * Cria chave para listagem de categorias
   */
  static categoriesKey(): string {
    return 'github:categories:list';
  }

  /**
   * Cria chave para artigos de categoria
   */
  static categoryArticlesKey(categorySlug: string): string {
    return `github:articles:${categorySlug}`;
  }

  /**
   * Cria chave para metadata
   */
  static metadataKey(resourceId: string): string {
    return `metadata:${resourceId}`;
  }
}

// Exportar singleton
export const cacheManager = new CacheManager();
