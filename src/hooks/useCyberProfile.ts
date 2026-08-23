/**
 * useCyberProfile — Hook genérico para os cards do Cybersecurity Profile Hub
 *
 * Usa stale-while-revalidate:
 *  - `data` chega instantaneamente do cache se disponível
 *  - `loading` só é true se não há NENHUM dado (nem cache)
 *  - `fromCache` indica se o dado exibido veio do cache (backend offline)
 */

import { useState, useEffect, useRef } from 'react';
import { staleWhileRevalidate } from '../lib/resilientCache';

const TTL_24H = 24 * 60 * 60 * 1000;
const TTL_6H  =  6 * 60 * 60 * 1000;

export interface CyberProfileState<T> {
  data: T | null;
  loading: boolean;
  fromCache: boolean;
  error: string | null;
}

export function useCyberProfile<T>(
  cacheKey: string,
  fetcher: () => Promise<T | null>,
  ttl: number = TTL_24H,
): CyberProfileState<T> {
  const [state, setState] = useState<CyberProfileState<T>>({
    data: null,
    loading: true,
    fromCache: false,
    error: null,
  });

  // Evita re-runs desnecessários por referência instável de `fetcher`
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await staleWhileRevalidate<T>(
          cacheKey,
          () => fetcherRef.current(),
          ttl,
          (data, fromCache) => {
            if (cancelled) return;
            setState({
              data,
              loading: false,
              fromCache,
              error: null,
            });
          },
        );
      } catch {
        // Só chega aqui se não há cache E o backend falhou
        if (!cancelled) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Serviço temporariamente indisponível.',
          }));
        }
      }
    };

    run();

    return () => { cancelled = true; };
  }, [cacheKey, ttl]);

  return state;
}

// ─── TTLs exportados para reuso ──────────────────────────────────────────────
export { TTL_24H, TTL_6H };
