import React from 'react';

const BackgroundEffects: React.FC = () => {
  return (
    <>
      {/* Noise overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      {/* Grid overlay */}
      <div className="grid-overlay" aria-hidden="true" />

      {/* Floating gradient orbs */}
      <div
        className="orb orb-green"
        style={{ width: '600px', height: '600px', top: '-100px', left: '-150px' }}
        aria-hidden="true"
      />
      <div
        className="orb orb-purple"
        style={{ width: '500px', height: '500px', top: '30%', right: '-100px', animationDelay: '-8s', animationDuration: '25s' }}
        aria-hidden="true"
      />
      <div
        className="orb orb-blue"
        style={{ width: '400px', height: '400px', bottom: '20%', left: '30%', animationDelay: '-14s', animationDuration: '18s' }}
        aria-hidden="true"
      />
      <div
        className="orb orb-green"
        style={{ width: '300px', height: '300px', bottom: '10%', right: '20%', opacity: 0.6, animationDelay: '-5s', animationDuration: '22s' }}
        aria-hidden="true"
      />
      <div
        className="orb orb-purple"
        style={{ width: '600px', height: '600px', bottom: '-100px', right: '-200px', opacity: 0.8, animationDelay: '-10s', animationDuration: '28s' }}
        aria-hidden="true"
      />
    </>
  );
};

export default BackgroundEffects;
