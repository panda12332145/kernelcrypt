// ============================================================
// HOOK: useCarousel
// Manages carousel state, navigation, and auto-scroll
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Platform } from '../types/cyber-profiles';

const PLATFORMS: Platform[] = ['tryhackme', 'leetcode', 'youtube', 'instagram'];
const AUTO_SCROLL_INTERVAL = 8000; // 8 seconds

interface UseCarouselReturn {
  current: number;
  platform: Platform;
  platforms: Platform[];
  goNext: () => void;
  goPrev: () => void;
  goTo: (index: number) => void;
  isAnimating: boolean;
  direction: 'left' | 'right';
}

export function useCarousel(autoScroll = false): UseCarouselReturn {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const navigate = useCallback((newIndex: number, dir: 'left' | 'right') => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setCurrent(newIndex);
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    const next = (current + 1) % PLATFORMS.length;
    navigate(next, 'right');
  }, [current, navigate]);

  const goPrev = useCallback(() => {
    const prev = (current - 1 + PLATFORMS.length) % PLATFORMS.length;
    navigate(prev, 'left');
  }, [current, navigate]);

  const goTo = useCallback((index: number) => {
    if (index === current) return;
    const dir = index > current ? 'right' : 'left';
    navigate(index, dir);
  }, [current, navigate]);

  // Auto scroll feature
  useEffect(() => {
    if (!autoScroll) return;
    timerRef.current = setInterval(goNext, AUTO_SCROLL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoScroll, goNext]);

  // Reset timer on manual navigation
  const resetTimer = useCallback(() => {
    if (!autoScroll || !timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(goNext, AUTO_SCROLL_INTERVAL);
  }, [autoScroll, goNext]);

  useEffect(() => {
    resetTimer();
  }, [current]);

  return {
    current,
    platform: PLATFORMS[current],
    platforms: PLATFORMS,
    goNext,
    goPrev,
    goTo,
    isAnimating,
    direction,
  };
}
