// ============================================================
// COMPONENT: Carousel
// Main carousel wrapper with navigation, dots, and animations
// ============================================================

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCarousel } from '../../hooks/useCarousel';
import { TryHackMeCard } from './TryHackMeCard';
import { LeetCodeCard } from './LeetCodeCard';
import { YouTubeCard } from './YouTubeCard';
import { InstagramCard } from './InstagramCard';
import type { Platform } from '../../types/cyber-profiles';

// Platform config
const PLATFORM_CONFIG: Record<Platform, {
  label: string;
  color: string;
  glowColor: string;
  icon: string;
}> = {
  tryhackme: { label: 'TryHackMe', color: '#39ff14', glowColor: '#39ff1440', icon: '🔐' },
  leetcode: { label: 'LeetCode', color: '#f97316', glowColor: '#f9731640', icon: '💻' },
  youtube: { label: 'YouTube', color: '#ef4444', glowColor: '#ef444440', icon: '▶' },
  instagram: { label: 'Instagram', color: '#e1306c', glowColor: '#e1306c40', icon: '📷' },
};

const ALL_PLATFORMS: Platform[] = ['tryhackme', 'leetcode', 'youtube', 'instagram'];

const CardComponents: Record<Platform, React.FC> = {
  tryhackme: TryHackMeCard,
  leetcode: LeetCodeCard,
  youtube: YouTubeCard,
  instagram: InstagramCard,
};

// Arrow button component
const ArrowButton: React.FC<{
  direction: 'left' | 'right';
  onClick: () => void;
  color: string;
}> = ({ direction, onClick, color }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.92 }}
    style={{
      width: 52, height: 52,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.03)',
      border: `1.5px solid ${color}60`,
      color: color,
      fontSize: 20,
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(10px)',
      boxShadow: `0 0 15px ${color}30, inset 0 0 15px ${color}05`,
      outline: 'none',
      flexShrink: 0,
    }}
  >
    {direction === 'left' ? '←' : '→'}
  </motion.button>
);

// Dot indicator
const DotIndicator: React.FC<{
  platform: Platform;
  isActive: boolean;
  onClick: () => void;
}> = ({ platform, isActive, onClick }) => {
  const config = PLATFORM_CONFIG[platform];
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.3 }}
      whileTap={{ scale: 0.85 }}
      animate={{ width: isActive ? 28 : 10 }}
      transition={{ duration: 0.3 }}
      style={{
        height: 10,
        borderRadius: 5,
        background: isActive ? config.color : '#333',
        border: `1px solid ${isActive ? config.color : '#444'}`,
        cursor: 'pointer',
        outline: 'none',
        boxShadow: isActive ? `0 0 12px ${config.color}, 0 0 24px ${config.color}60` : 'none',
        padding: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isActive && (
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          }}
        />
      )}
    </motion.button>
  );
};

export const Carousel: React.FC = () => {
  const { current, platform, platforms, goNext, goPrev, goTo, direction } = useCarousel(false);
  const config = PLATFORM_CONFIG[platform];
  const CardComponent = CardComponents[platform];

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  }, [goNext, goPrev]);

  const enterAnim = {
    x: direction === 'right' ? 80 : -80,
    opacity: 0,
    scale: 0.97,
  };
  const exitAnim = {
    x: direction === 'right' ? -80 : 80,
    opacity: 0,
    scale: 0.97,
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKey}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        width: '100%', maxWidth: 1100, margin: '0 auto', outline: 'none',
      }}
    >
      {/* Platform Label */}
      <motion.div
        key={platform + '-label'}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: config.color,
          letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600,
          textShadow: `0 0 10px ${config.color}`,
        }}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
        <span style={{ color: '#444', fontSize: 11 }}>// {current + 1}/{platforms.length}</span>
      </motion.div>

      {/* Main Card */}
      <div style={{
        width: '100%', height: 520,
        position: 'relative', borderRadius: 18, overflow: 'hidden',
      }}>
        {/* Outer glow */}
        <motion.div
          animate={{ boxShadow: `0 0 50px ${config.glowColor}, 0 0 100px ${config.glowColor}` }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute', inset: -2, borderRadius: 20, pointerEvents: 'none', zIndex: 0,
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={platform}
            initial={enterAnim}
            animate={{ x: 0, opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }}
            exit={{ ...exitAnim, transition: { duration: 0.3, ease: 'easeIn' } }}
            style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden' }}
          >
            <CardComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <ArrowButton direction="left" onClick={goPrev} color={config.color} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {platforms.map((p, i) => (
            <DotIndicator key={p} platform={p} isActive={i === current} onClick={() => goTo(i)} />
          ))}
        </div>
        <ArrowButton direction="right" onClick={goNext} color={config.color} />
      </div>

      {/* Platform quick-nav pills */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {ALL_PLATFORMS.map((p, i) => {
          const cfg = PLATFORM_CONFIG[p];
          return (
            <motion.button
              key={p}
              onClick={() => goTo(i)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20,
                background: i === current ? `${cfg.color}20` : 'transparent',
                border: `1px solid ${i === current ? cfg.color : '#333'}`,
                color: i === current ? cfg.color : '#555',
                fontSize: 12, cursor: 'pointer', outline: 'none',
                fontWeight: i === current ? 600 : 400,
                boxShadow: i === current ? `0 0 12px ${cfg.color}30` : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
