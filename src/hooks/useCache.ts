/**
 * Sistema de cache frontend com IndexedDB + localStorage
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // em millisegundos
}

class IndexedDBCache {
  private dbName = 'wiki-cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('articles')) {
          db.createObjectStore('articles', { keyPath: 'slug' });
        }
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'slug' });
        }
        if (!db.objectStoreNames.contains('search')) {
          db.createObjectStore('search', { keyPath: 'query' });
        }
      };
    });
  }

  async set<T>(
    store: 'articles' | 'categories' | 'search',
    key: string,
    value: T,
    ttl: number = 60 * 60 * 1000 // 1 hora
  ): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);

      const item: CacheItem<T> = {
        data: value,
        timestamp: Date.now(),
        ttl,
      };

      const request = objectStore.put({
        [store === 'search' ? 'query' : 'slug']: key,
        ...item,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get<T>(
    store: 'articles' | 'categories' | 'search',
    key: string
  ): Promise<T | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readonly');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;

        if (!result) {
          resolve(null);
          return;
        }

        // Verificar se expirou
        const { data, timestamp, ttl } = result;
        if (Date.now() - timestamp > ttl) {
          // Deletar item expirado
          objectStore.delete(key);
          resolve(null);
        } else {
          resolve(data);
        }
      };
    });
  }

  async delete(
    store: 'articles' | 'categories' | 'search',
    key: string
  ): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(store: 'articles' | 'categories' | 'search'): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], 'readwrite');
      const objectStore = transaction.objectStore(store);
      const request = objectStore.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

/**
 * Hook para cache frontend
 */
import { useEffect, useState } from 'react';

const idbCache = new IndexedDBCache();

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  store: 'articles' | 'categories' | 'search' = 'articles',
  ttl: number = 60 * 60 * 1000
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Tentar obter do cache
        const cached = await idbCache.get<T>(store, key);

        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        // Se não estiver no cache, buscar
        const freshData = await fetcher();
        await idbCache.set(store, key, freshData, ttl);

        setData(freshData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, fetcher, store, ttl]);

  return { data, loading, error };
}

/**
 * Inicializar cache
 */
export async function initializeCache(): Promise<void> {
  await idbCache.init();
}

export { idbCache };
