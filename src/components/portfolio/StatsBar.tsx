import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { GitHubStats } from '../../types';

interface Props {
  stats: GitHubStats;
}

const useCountUp = (target: number, duration = 1500, start = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, start]);

  return count;
};

const StatItem: React.FC<{
  value: number | string;
  label: string;
  suffix?: string;
  isLast?: boolean;
  started: boolean;
}> = ({ value, label, suffix = '', isLast, started }) => {
  const numericValue = typeof value === 'number' ? value : 0;
  const isString = typeof value === 'string';
  const count = useCountUp(numericValue, 1500, started && !isString);

  const displayValue = isString ? value : `${count.toLocaleString()}${suffix}`;

  return (
    <div className={`flex-1 text-center relative ${!isLast ? 'border-r border-white/6' : ''}`}>
      <motion.div
        className="stat-number text-4xl sm:text-5xl lg:text-6xl font-black mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={started ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        {displayValue}
      </motion.div>
      <div
        className="font-mono text-xs tracking-widest uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </div>
    </div>
  );
};

const StatsBar: React.FC<Props> = ({ stats }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const statItems = [
    { value: stats.repositories, label: 'Repositories', suffix: '+' },
    { value: stats.stars, label: 'GitHub Stars', suffix: '+' },
    { value: stats.followers, label: 'Followers', suffix: '+' },
    { value: stats.downloads, label: 'Users', suffix: '' },
  ];

  return (
    <section
      ref={ref}
      className="relative py-16 border-y"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(0,255,136,0.02), transparent, rgba(147,51,234,0.02))' }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-stretch">
          {statItems.map((item, i) => (
            <StatItem
              key={item.label}
              value={item.value}
              label={item.label}
              suffix={item.suffix}
              isLast={i === statItems.length - 1}
              started={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
