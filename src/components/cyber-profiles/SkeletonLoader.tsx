// ============================================================
// COMPONENT: SkeletonLoader
// Animated loading skeleton for cards
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';

export const SkeletonLoader: React.FC = () => {
  return (
    <div style={{
      width: '100%', height: 520,
      background: '#0d1117',
      borderRadius: 16,
      border: '1px solid #39ff1420',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header skeleton */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 12 }}>
        <SkeletonBlock width={48} height={48} radius={10} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SkeletonBlock width={120} height={18} radius={4} />
          <SkeletonBlock width={80} height={12} radius={4} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <SkeletonBlock width={100} height={12} radius={4} />
          <SkeletonBlock width={32} height={32} radius={8} />
        </div>
      </div>

      {/* Body skeleton */}
      <div style={{ display: 'flex', flex: 1, padding: 24, gap: 24 }}>
        {/* Left */}
        <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <SkeletonBlock width={90} height={90} radius={45} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkeletonBlock width={140} height={20} radius={4} />
              <SkeletonBlock width={100} height={14} radius={4} />
              <SkeletonBlock width={80} height={14} radius={4} />
              <div style={{ display: 'flex', gap: 4 }}>
                {[60, 50, 65, 45, 75].map((w, i) => (
                  <SkeletonBlock key={i} width={w} height={20} radius={4} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            {[0, 1, 2, 3].map(i => (
              <SkeletonBlock key={i} width="100%" height={72} radius={10} />
            ))}
          </div>
          <SkeletonBlock width="100%" height={100} radius={10} />
        </div>

        {/* Right */}
        <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SkeletonBlock width="100%" height={120} radius={10} />
          <SkeletonBlock width="100%" height={100} radius={10} />
          <SkeletonBlock width="100%" height={100} radius={10} />
        </div>
      </div>
    </div>
  );
};

const SkeletonBlock: React.FC<{
  width: number | string;
  height: number;
  radius?: number;
}> = ({ width, height, radius = 4 }) => (
  <motion.div
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, #1a1a2e 0%, #1e2a3a 50%, #1a1a2e 100%)',
      flexShrink: 0,
    }}
  />
);
