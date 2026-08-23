import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Project } from '../../types';

interface Props {
  projects: Project[];
  sectionDesc: string;
}

// =========================================================
// DEFAULT COLORS (matching backend)
// =========================================================

const DEFAULT_COLORS: Record<string, string> = {
  tags: '#fbbf24',
  linguagem: '#04DC77',
  framework: '#d6ff00',
  red_team: '#ff0000',
  blue_team: '#00f1ff',
  purple_team: '#9333ea',
  tipo: '#999999',
  customizado: '#9333ea',
};

// =========================================================
// COLOR TAG COMPONENT
// =========================================================

const ColorTag: React.FC<{
  text: string;
  color: string;
}> = ({ text, color }) => (
  <div
    className="font-mono text-xs px-3 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
    style={{
      borderColor: color,
      color: color,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      backdropFilter: 'blur(10px)',
    }}
  >
    {text}
  </div>
);

// =========================================================
// PROJECT CARD
// =========================================================

const ProjectCard: React.FC<{
  project: Project;
  index: number;
}> = ({ project, index }) => {

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  const colors = project.colors || DEFAULT_COLORS;

  // Determine team color
  const getTeamColor = (team: string): string => {
    const lower = team.toLowerCase();
    if (lower.includes('red')) return colors.red_team || DEFAULT_COLORS.red_team;
    if (lower.includes('blue')) return colors.blue_team || DEFAULT_COLORS.blue_team;
    if (lower.includes('purple')) return colors.purple_team || DEFAULT_COLORS.purple_team;
    return colors.blue_team || DEFAULT_COLORS.blue_team;
  };

  return (
    <motion.div
      ref={ref}
      className="project-card p-6 flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      {/* ============================================= */}
      {/* STATS (top-right) + FEATURED STAR             */}
      {/* ============================================= */}

      <div className="flex items-start justify-between mb-4">

        {/* ICON WRAPPER — SVG ou Emoji */}
        <div
          className="flex-shrink-0"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(180deg, rgba(0,255,170,0.12), rgba(0,255,170,0.04))',
            border: '1px solid rgba(0,255,170,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {project.icone ? (
            <img
              src={project.icone}
              alt={project.name}
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <span className="text-2xl">{project.emoji}</span>
          )}
        </div>

        {/* STATS + FEATURED */}
        <div className="flex items-center gap-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>

          {/* Featured star */}
          {project.featured && (
            <span
              className="flex items-center justify-center"
              style={{
                color: '#fbbf24',
                fontSize: '16px',
                filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))',
              }}
              title="Featured Project"
            >
              ★
            </span>
          )}

          {project.stars > 0 && (
            <span className="flex items-center gap-1">
              <span>☆</span>
              <span>{project.stars}</span>
            </span>
          )}

          {project.commits && project.commits > 0 && (
            <span className="flex items-center gap-1">
              <span>↻</span>
              <span>{project.commits}</span>
            </span>
          )}

          {project.downloads && (
            <span className="flex items-center gap-1">
              <span>↓</span>
              <span>{project.downloads}</span>
            </span>
          )}
        </div>
      </div>

      {/* ============================================= */}
      {/* AVISO BADGE (below icon)                      */}
      {/* ============================================= */}

      {project.aviso && (
        <div className="mb-4">
          <span
            className="inline-flex items-center gap-1 font-mono text-xs font-bold px-3 py-1.5 rounded-full"
            style={{
              background: project.avisoCor || 'rgba(239, 68, 68, 0.15)',
              color: 'white',
              border: `1px solid rgba(255,255,255,0.08)`,
              backdropFilter: 'blur(10px)',
              letterSpacing: '0.4px',
            }}
          >
            {project.aviso}
          </span>
        </div>
      )}

      {/* ============================================= */}
      {/* TITLE                                         */}
      {/* ============================================= */}

      <h3 className="text-lg font-bold text-white mb-2 font-sans">
        {project.name}
      </h3>

      {/* ============================================= */}
      {/* DESCRIPTION                                   */}
      {/* ============================================= */}

      <p
        className="font-mono text-xs leading-relaxed mb-5"
        style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}
      >
        {project.description}
      </p>

      {/* ============================================= */}
      {/* ALL TAGS (color-coded by category)            */}
      {/* ============================================= */}

      <div className="flex flex-wrap gap-2 mb-5">

        {/* LINGUAGENS — green */}
        {project.languages.map((lang) => (
          <ColorTag
            key={`lang-${lang}`}
            text={lang}
            color={colors.linguagem || DEFAULT_COLORS.linguagem}
          />
        ))}

        {/* TAGS — dark */}
        {project.topics.map((tag) => (
          <ColorTag
            key={`tag-${tag}`}
            text={tag}
            color={colors.tags || DEFAULT_COLORS.tags}
          />
        ))}

        {/* FRAMEWORKS — yellow */}
        {project.frameworks && project.frameworks.map((fw) => (
          <ColorTag
            key={`fw-${fw}`}
            text={fw}
            color={colors.framework || DEFAULT_COLORS.framework}
          />
        ))}

        {/* TEAM TYPE — red/blue/purple */}
        {project.teamType && (
          <ColorTag
            text={project.teamType}
            color={getTeamColor(project.teamType)}
          />
        )}

        {/* TIPO — gray */}
        {project.tipo && (
          <ColorTag
            text={project.tipo}
            color={colors.tipo || DEFAULT_COLORS.tipo}
          />
        )}

        {/* CUSTOMIZADO — purple */}
        {project.customTags && project.customTags.map((custom) => (
          <ColorTag
            key={`custom-${custom}`}
            text={custom}
            color={colors.customizado || DEFAULT_COLORS.customizado}
          />
        ))}
      </div>

      {/* ============================================= */}
      {/* LINKS                                         */}
      {/* ============================================= */}

      <div className="space-y-2 mt-auto">

        {/* WEBSITE BUTTON */}
        {project.website && (
          <a
            href={project.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 group hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(90deg, rgba(0,255,170,0.12), rgba(0,255,170,0.04))',
              border: '1px solid rgba(0,255,170,0.18)',
            }}
          >
            <div className="flex items-center gap-2 font-mono text-xs text-white">
              <span>🌐</span>
              <span>Project Website</span>
            </div>
            <span className="text-emerald-400 group-hover:translate-x-1 transition-transform">↗</span>
          </a>
        )}

        {/* GITHUB LINK */}
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-mono text-xs transition-colors hover:text-emerald-400"
            style={{ color: 'var(--text-muted)' }}
          >
            GitHub →
          </a>
        )}
      </div>
    </motion.div>
  );
};

// =========================================================
// PROJECTS SECTION
// =========================================================

const ProjectsSection: React.FC<Props> = ({ projects, sectionDesc }) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });

  return (
    <section id="projects" className="relative py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="mb-16">
          <motion.div
            className="section-label mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={headerInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span>📁</span>
            <span>FEATURED WORK</span>
          </motion.div>
          <motion.h2
            className="text-4xl sm:text-5xl font-black text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Open Source Projects
          </motion.h2>
          <motion.p
            className="font-mono text-sm"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {sectionDesc}
          </motion.p>
        </div>

        {/* Projects Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;

