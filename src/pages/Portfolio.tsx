import React, { useEffect } from 'react';

import HeroSection from '../components/portfolio/HeroSection';
import StatsBar from '../components/portfolio/StatsBar';
import ProjectsSection from '../components/portfolio/ProjectsSection';
import SkillsSection from '../components/portfolio/SkillsSection';
import ContactSection from '../components/portfolio/ContactSection';
import { Carousel } from '../components/cyber-profiles/Carousel';

import Footer from '../components/layout/Footer';

import { portfolioData, loadPortfolioData } from '../data/portfolioData';
import { useGithubStats } from '../hooks/useGithubStats';

const GradientDivider: React.FC<{
  from?: string;
  to?: string;
}> = ({
  from = 'rgba(0,255,136,0.08)',
  to = 'rgba(147,51,234,0.08)',
}) => (
  <div
    className="relative h-px w-full pointer-events-none"
    style={{
      background: `linear-gradient(
        90deg,
        transparent,
        ${from},
        ${to},
        transparent
      )`,
    }}
  />
);

const Portfolio: React.FC = () => {

  // =========================================
  // STATE
  // =========================================

  // GitHub stats com cache resiliente (stale-while-revalidate)
  const { stats: githubStats } = useGithubStats();

  // Carrega dados do portfólio em background (não bloqueia a renderização)
  useEffect(() => {
    loadPortfolioData().catch(err =>
      console.warn('Falha ao carregar portfolio data:', err)
    );
  }, []);

  // =========================================
  // READ LOADED DATA
  // =========================================

  const {
    hero,
    projects,
    skills,
    contacts,
    sectionDesc,
    stats,
  } = portfolioData;

  // =========================================
  // MAIN UI
  // =========================================

  return (
    <main className="relative z-10">

      {/* HERO */}

      <HeroSection data={hero} />

      {/* STATS */}

      <StatsBar
        stats={{
          repositories:
            githubStats?.repositories ?? stats.repositories,

          stars:
            githubStats?.stars ?? stats.stars,

          followers:
            githubStats?.followers ?? stats.followers,

          contributions:
            githubStats?.contributions ?? stats.contributions,

          downloads:
            githubStats?.downloads ?? stats.downloads,

          forks:
            githubStats?.forks ?? stats.forks,
        }}
      />

      <GradientDivider
        from="rgba(0,255,136,0.12)"
        to="rgba(147,51,234,0.06)"
      />

      {/* PROJECTS */}

      <ProjectsSection
        projects={projects}
        sectionDesc={sectionDesc}
      />

      <GradientDivider
        from="rgba(147,51,234,0.06)"
        to="rgba(0,255,136,0.06)"
      />

      {/* SKILLS */}

      <SkillsSection skills={skills} />

      <GradientDivider />

      {/* CYBERSECURITY PROFILE HUB */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-mono text-green-400" style={{ textShadow: '0 0 10px rgba(0,255,136,0.3)' }}>
            Cybersecurity Profile Hub
          </h2>
          <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto">
            Real-time metrics and statistics from my main study and professional platforms in Cybersecurity.
          </p>
        </div>
        <Carousel />
      </section>

      <GradientDivider />

      {/* CONTACT */}

      <ContactSection contacts={contacts} />

      {/* FOOTER */}

      <Footer
        contacts={contacts}
        alias={
          hero.terminalCard.alias ||
          hero.terminalCard.name
        }
        role={hero.highlight}
      />

    </main>
  );
};

export default Portfolio;
