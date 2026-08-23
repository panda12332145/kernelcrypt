import React from 'react';
import { motion } from 'framer-motion';
import type { HeroData } from '../../types';
import TerminalCard from './TerminalCard';

interface Props {
  data: HeroData;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

const HeroSection: React.FC<Props> = ({ data }) => {
  return (
    <section
      id="hero"
      className="hero-bg relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="relative z-10">
            {/* Status badge */}
            <motion.div {...fadeUp(0.1)} className="mb-8">
              <div className="status-badge inline-flex">
                <span className="status-dot" />
                Available for collaboration
              </div>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              {...fadeUp(0.2)}
              className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              <span className="gradient-text-green">{data.highlight.split(' ')[0]}</span>{' '}
              <span className="text-white">
                {data.highlight.split(' ').slice(1).join(' ')}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              {...fadeUp(0.3)}
              className="font-mono text-sm sm:text-base leading-relaxed mb-8 max-w-lg"
              style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}
            >
              {data.subtitle}
            </motion.p>

            {/* Tags */}
            <motion.div {...fadeUp(0.4)} className="flex flex-wrap gap-2 mb-10">
              {data.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div {...fadeUp(0.5)} className="flex flex-wrap gap-4">
              {data.socialLinks.map((link) => {
                const isPrimary = link.platform === 'github';
                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={isPrimary ? 'btn-primary flex items-center gap-2' : 'btn-secondary flex items-center gap-2'}
                  >
                    {link.platform === 'github' && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    )}
                    {link.platform === 'telegram' && (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                    )}
                    <span>&lt;/&gt; {link.label}</span>
                  </a>
                );
              })}
            </motion.div>
          </div>

          {/* Right - Terminal Card */}
          <motion.div
            className="relative z-10 flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Glow behind terminal */}
            <div
              className="absolute inset-0 rounded-2xl blur-3xl opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.3) 0%, rgba(147,51,234,0.2) 100%)' }}
            />
            <TerminalCard data={data.terminalCard} />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            scroll
          </span>
          <motion.div
            className="w-px h-8 rounded-full"
            style={{ background: 'linear-gradient(to bottom, rgba(0,255,136,0.5), transparent)' }}
            animate={{ scaleY: [1, 0.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
