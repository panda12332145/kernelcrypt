import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BackgroundEffects from './components/layout/BackgroundEffects';
import MatrixRain from './components/layout/MatrixRain';
import Navbar from './components/layout/Navbar';
import Portfolio from './pages/Portfolio';
import Wiki from './pages/Wiki';

const App: React.FC = () => {


  return (
    <BrowserRouter>
      <div
        className="min-h-screen relative"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        {/* Global background effects */}
        <BackgroundEffects />
        <MatrixRain />

        {/* Navigation */}
        <Navbar />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/wiki/*" element={<Wiki />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
