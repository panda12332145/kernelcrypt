/**
 * Hooks for the dynamic Wiki backend.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../lib/api';
import type {
  WikiApiCategory,
  WikiArticle,
  WikiArticleListResponse,
} from '../types';

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  enabled?: boolean;
}

interface UseWikiApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const WIKI_API_BASE = apiUrl('/api/wiki');

export function useWikiApi<T>(endpoint: string, options: FetchOptions = {}): UseWikiApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(options.enabled ?? true));
  const [error, setError] = useState<Error | null>(null);
  const body = useMemo(() => (options.body ? JSON.stringify(options.body) : undefined), [options.body]);
  const enabled = options.enabled ?? true;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${WIKI_API_BASE}${endpoint}`, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [body, enabled, endpoint, options.method]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useWikiNavigation() {
  return useWikiApi<WikiApiCategory[]>('/categories/navigation/tree');
}

export function useWikiStats() {
  return useWikiApi<any>('/categories/stats/summary');
}

export function useArticles(
  filters: {
    page?: number;
    pageSize?: number;
    categoryId?: string;
    categorySlug?: string;
    subcategorySlug?: string;
    difficulty?: string;
    featured?: boolean;
    starred?: boolean;
    search?: string;
    tag?: string;
  } = {}
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const endpoint = params.toString() ? `/articles?${params}` : '/articles';
  return useWikiApi<WikiArticleListResponse>(endpoint);
}

export function useArticle(slug?: string) {
  return useWikiApi<WikiArticle>(slug ? `/articles/${slug}` : '/articles/__missing__', {
    enabled: Boolean(slug),
  });
}

export function useFeaturedArticles(limit = 8) {
  return useWikiApi<WikiArticle[]>(`/articles/featured?limit=${limit}`);
}

export function useRelatedArticles(slug?: string) {
  return useWikiApi<WikiArticle[]>(slug ? `/articles/${slug}/related` : '/articles/__missing__/related', {
    enabled: Boolean(slug),
  });
}

export function usePreviousNext(slug?: string) {
  return useWikiApi<{ previous: WikiArticle | null; next: WikiArticle | null }>(
    slug ? `/articles/${slug}/previous-next` : '/articles/__missing__/previous-next',
    { enabled: Boolean(slug) }
  );
}

export function useSearch(query: string, limit = 8) {
  const endpoint = query.trim()
    ? `/articles/search/query?${new URLSearchParams({ q: query.trim(), limit: String(limit) })}`
    : '/articles/search/query?q=__empty__';

  return useWikiApi<WikiArticle[]>(endpoint, {
    enabled: query.trim().length >= 2,
  });
}

export function useSyncManual() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const trigger = useCallback(async (full = false) => {
    try {
      setLoading(true);
      setError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (import.meta.env.VITE_ADMIN_API_KEY) {
        headers['Authorization'] = `Bearer ${import.meta.env.VITE_ADMIN_API_KEY}`;
      }

      const response = await fetch(`${WIKI_API_BASE}/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ full }),
      });

      if (!response.ok) {
        throw new Error('Erro ao sincronizar');
      }

      return await response.json();
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error(String(err));
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trigger, loading, error };
}
