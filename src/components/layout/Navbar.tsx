import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isWiki = location.pathname.startsWith('/wiki');

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const username = "Panda12332145";

  const portfolioLinks = [
    { label: 'Projects', href: '#projects', icon: '□' },
    { label: 'Skills', href: '#skills', icon: '<>' },
    { label: 'Contact', href: '#contact', icon: '✉' },
  ];

  const scrollTo = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: 'smooth' });
      setMobileOpen(false);
    }
  };

  return (
    <>
      <nav
        className={`navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-white/5' : 'border-b border-transparent'
        }`}
        style={{ height: '64px' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm text-black transition-all duration-300 group-hover:shadow-lg"
              style={{ background: 'var(--neon-green)', boxShadow: '0 0 15px rgba(0,255,136,0.4)' }}
            >
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="font-mono text-sm font-medium text-white/80 group-hover:text-white transition-colors">
              {username}
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {!isWiki && portfolioLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="nav-link flex items-center gap-2"
              >
                <span className="opacity-50">{link.icon}</span>
                {link.label}
              </button>
            ))}

            <Link
              to={isWiki ? '/' : '/wiki'}
              className="nav-link flex items-center gap-2 transition-colors"
            >
              <span className="opacity-50">📚</span>
              {isWiki ? 'Portfolio' : 'Wiki'}
            </Link>

            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 8 : 0 }}
              className="block w-5 h-0.5 bg-white/70 origin-center"
            />
            <motion.span
              animate={{ opacity: mobileOpen ? 0 : 1 }}
              className="block w-5 h-0.5 bg-white/70"
            />
            <motion.span
              animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -8 : 0 }}
              className="block w-5 h-0.5 bg-white/70 origin-center"
            />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu flex flex-col justify-center items-center gap-8 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {portfolioLinks.map((link, i) => (
              <motion.button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="font-mono text-xl text-white/60 hover:text-green-400 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {link.label}
              </motion.button>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                to={isWiki ? '/' : '/wiki'}
                className="font-mono text-xl text-white/60 hover:text-green-400 transition-colors"
              >
                {isWiki ? 'Portfolio' : 'Wiki'}
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
