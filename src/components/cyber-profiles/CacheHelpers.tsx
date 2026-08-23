/**
 * OfflineBadge — Badge sutil mostrado quando dado vem do cache com backend offline
 */
import React from 'react';

export const OfflineBadge: React.FC<{ color?: string }> = ({ color = '#888' }) => (
  <div
    title="Dados do cache local — backend temporariamente indisponível"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 4,
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid ${color}40`,
      fontSize: 10,
      color: color,
      letterSpacing: 0.5,
      opacity: 0.7,
      cursor: 'help',
    }}
  >
    <span style={{ fontSize: 9 }}>📦</span>
    cache
  </div>
);

/**
 * CardSkeleton — Skeleton animado para primeira carga sem cache
 */
export const CardSkeleton: React.FC<{ color?: string; label?: string }> = ({
  color = '#39ff14',
  label = 'Conectando...',
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#0d1117',
      borderRadius: 16,
      border: `1px solid ${color}30`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontFamily: "'Inter', sans-serif",
    }}
  >
    {/* Spinner */}
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: `3px solid ${color}20`,
        borderTopColor: color,
        animation: 'spin 0.8s linear infinite',
        boxShadow: `0 0 12px ${color}40`,
      }}
    />
    <div style={{ fontSize: 13, color, letterSpacing: 1, opacity: 0.8 }}>
      {label}
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/**
 * ErrorCard — Mostrado apenas se não há cache E backend offline
 */
export const ErrorCard: React.FC<{ color?: string; platform?: string }> = ({
  color = '#39ff14',
  platform = 'plataforma',
}) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#0d1117',
      borderRadius: 16,
      border: `1px solid ${color}20`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      fontFamily: "'Inter', sans-serif",
      padding: 32,
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: 32 }}>📡</div>
    <div style={{ fontSize: 14, color, fontWeight: 600 }}>Backend Offline</div>
    <div style={{ fontSize: 12, color: '#666', maxWidth: 280, lineHeight: 1.6 }}>
      Os dados de <strong style={{ color: '#aaa' }}>{platform}</strong> não estão disponíveis
      no momento. Tente novamente mais tarde.
    </div>
  </div>
);
