/**
 * useGithubStats — Hook resiliente para GitHub Stats da StatsBar
 *
 * TTL: 6 horas
 * Fallback: zeros se não há cache E backend offline
 */

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { apiUrl } from '../lib/api';
import { staleWhileRevalidate, cacheRead } from '../lib/resilientCache';

export interface GithubStats {
  repositories: number;
  stars: number;
  followers: number;
  contributions: number;
  downloads: string;
  forks: number;
  avatar?: string;
  bio?: string;
  profile?: string;
}

const CACHE_KEY = 'github-stats';
const TTL_6H = 6 * 60 * 60 * 1000;

const ZERO_STATS: GithubStats = {
  repositories: 0,
  stars: 0,
  followers: 0,
  contributions: 0,
  downloads: '0',
  forks: 0,
};

async function fetchGithubStats(): Promise<GithubStats> {
  const res = await axios.get(apiUrl('/api/github/stats'));
  return res.data as GithubStats;
}

export interface GithubStatsState {
  stats: GithubStats;
  loading: boolean;
  fromCache: boolean;
}

export function useGithubStats(): GithubStatsState {
  const [state, setState] = useState<GithubStatsState>({
    stats: ZERO_STATS,
    loading: true,
    fromCache: false,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await staleWhileRevalidate<GithubStats>(
          CACHE_KEY,
          fetchGithubStats,
          TTL_6H,
          (data, fromCache) => {
            if (!cancelled) {
              setState({ stats: data, loading: false, fromCache });
            }
          },
        );
      } catch {
        // Sem cache e sem backend → usa zeros sem bloquear a página
        if (!cancelled) {
          setState({ stats: ZERO_STATS, loading: false, fromCache: false });
        }
      }
    };

    // Verifica se já tem cache para mostrar loading=false imediatamente
    cacheRead<GithubStats>(CACHE_KEY).then(cached => {
      if (cached.data && !cancelled) {
        setState({ stats: cached.data, loading: false, fromCache: true });
      }
    });

    run();

    return () => { cancelled = true; };
  }, []);

  return state;
}
