import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Skill } from '../../types';

interface Props {
  skills: Skill[];
}

const SkillCard: React.FC<{ skill: Skill; index: number; inView: boolean }> = ({ skill, index, inView }) => {
  return (
    <motion.div
      className="skill-card flex flex-col items-center justify-center p-5 gap-3 aspect-square"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ scale: 1.05 }}
    >
      {skill.iconType === 'url' ? (
        <img
          src={skill.icon}
          alt={skill.name}
          className="w-8 h-8 object-contain"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
      ) : (
        <span className="text-3xl">{skill.icon || '⚙️'}</span>
      )}
      {/* Fallback for failed image loads */}
      {skill.iconType === 'url' && (
        <span
          className="text-2xl hidden"
          style={{ display: 'none' }}
        >
          ⚙️
        </span>
      )}
      <span className="font-mono text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
        {skill.name}
      </span>
    </motion.div>
  );
};

const SkillsSection: React.FC<Props> = ({ skills }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="skills" className="relative py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,255,136,0.03) 0%, transparent 70%)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={ref} className="mb-16">
          <motion.div
            className="section-label mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span>🔧</span>
            <span>TECH STACK</span>
          </motion.div>
          <motion.h2
            className="text-4xl sm:text-5xl font-black text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Skills &amp; Tools
          </motion.h2>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {skills.map((skill, i) => (
            <SkillCard key={skill.name} skill={skill} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
