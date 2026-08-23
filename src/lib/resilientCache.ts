/**
 * resilientCache — Cache multi-camada com Stale-While-Revalidate
 *
 * Estratégia:
 *  1. Verifica IndexedDB → retorna dado cached IMEDIATAMENTE (mesmo vencido)
 *  2. Em background, faz fetch do dado fresco
 *  3. Se o fetch falhar → mantém dado antigo silenciosamente
 *  4. Se IndexedDB indisponível → usa localStorage como fallback
 */

const DB_NAME = 'site-resilient-cache';
const DB_VERSION = 1;
const STORE_NAME = 'data';

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (_db) return _db;

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

interface StoredEntry<T> {
  key: string;
  data: T;
  savedAt: number;
  ttl: number; // ms
}

async function idbGet<T>(key: string): Promise<StoredEntry<T> | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve((req.result as StoredEntry<T>) ?? null);
    });
  } catch {
    return null;
  }
}

async function idbSet<T>(entry: StoredEntry<T>): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(entry);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  } catch {
    // silently ignore
  }
}

// ─── localStorage fallback ───────────────────────────────────────────────────

const LS_PREFIX = 'rc:';

function lsGet<T>(key: string): StoredEntry<T> | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as StoredEntry<T>;
  } catch {
    return null;
  }
}

function lsSet<T>(entry: StoredEntry<T>): void {
  try {
    localStorage.setItem(LS_PREFIX + entry.key, JSON.stringify(entry));
  } catch {
    // silently ignore (quota exceeded, etc)
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface CacheResult<T> {
  data: T | null;
  /** true se veio do cache (pode estar vencido) */
  fromCache: boolean;
  /** true se o cache está dentro do TTL */
  fresh: boolean;
}

/**
 * Lê do cache (IndexedDB ou localStorage).
 * Retorna o dado mesmo que vencido — o chamador decide se revalida.
 */
export async function cacheRead<T>(key: string): Promise<CacheResult<T>> {
  // 1. Tenta IndexedDB
  let entry = await idbGet<T>(key);

  // 2. Fallback para localStorage
  if (!entry) {
    entry = lsGet<T>(key);
  }

  if (!entry) {
    return { data: null, fromCache: false, fresh: false };
  }

  const age = Date.now() - entry.savedAt;
  const fresh = age < entry.ttl;

  return { data: entry.data, fromCache: true, fresh };
}

/**
 * Salva no cache (IndexedDB + localStorage para redundância).
 */
export async function cacheWrite<T>(key: string, data: T, ttl: number): Promise<void> {
  const entry: StoredEntry<T> = { key, data, savedAt: Date.now(), ttl };
  await idbSet(entry);
  lsSet(entry); // redundância
}

/**
 * Principal utilitário — Stale-While-Revalidate.
 *
 * - Retorna dado em cache IMEDIATAMENTE (mesmo vencido)
 * - Chama `onUpdate(newData)` quando dado fresco chegar do backend
 * - Se o backend falhar, chama `onUpdate` com o dado em cache (sem mudança visual)
 *
 * @param key      Chave de cache
 * @param fetcher  Função que busca dado fresco do backend
 * @param ttl      Time-to-live em ms (default 24h)
 * @param onUpdate Callback chamado quando dado novo estiver disponível
 * @returns        Dado em cache (ou null se não há cache)
 */
export async function staleWhileRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  onUpdate: (data: T, fromCache: boolean) => void,
): Promise<T | null> {
  // Passo 1: ler cache
  const cached = await cacheRead<T>(key);

  // Passo 2: se temos dado em cache, retornar imediatamente
  if (cached.data !== null) {
    onUpdate(cached.data, true);
  }

  // Passo 3: se cache está fresco, não precisa revalidar
  if (cached.fresh) {
    return cached.data;
  }

  // Passo 4: revalidar em background
  try {
    const fresh = await fetcher();
    await cacheWrite(key, fresh, ttl);
    onUpdate(fresh, false);
    return fresh;
  } catch (err) {
    // Backend offline — mantém dado em cache (sem erro visível para o usuário)
    if (cached.data === null) {
      // Não há absolutamente nenhum dado → propaga erro para o chamador tratar
      throw err;
    }
    console.warn(`[resilientCache] Backend offline para "${key}", usando cache antigo.`, err);
    return cached.data;
  }
}
