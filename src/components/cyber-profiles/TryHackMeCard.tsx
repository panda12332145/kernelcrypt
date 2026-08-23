// ============================================================
// COMPONENT: TryHackMeCard
// Cyberpunk-style TryHackMe profile dashboard
// Neon color: #39ff14 (Green)
// ============================================================

import React from 'react';
import axios from 'axios';

import { apiUrl } from '../../lib/api';
import { useCyberProfile } from '../../hooks/useCyberProfile';
import { CardSkeleton, ErrorCard, OfflineBadge } from './CacheHelpers';

const NEON = '#39ff14';

// Circular progress ring component
const ProgressRing: React.FC<{ percent: number; size: number; stroke: number }> = ({ percent, size, stroke }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1a2a1a" strokeWidth={stroke} />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={NEON} strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 8px ${NEON})`,
          transition: 'stroke-dashoffset 1.5s ease',
        }}
      />
    </svg>
  );
};

// Animated progress bar
const ProgressBar: React.FC<{ value: number; total: number; color?: string }> = ({ value, total, color = NEON }) => {
  const pct = Math.min((value / total) * 100, 100);
  return (
    <div style={{ width: '100%', height: 6, background: '#1a2a1a', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: color,
        borderRadius: 3, boxShadow: `0 0 8px ${color}`,
        transition: 'width 1.2s ease',
      }} />
    </div>
  );
};

// Heatmap cell
const HeatCell: React.FC<{ level: number }> = ({ level }) => {
  const colors = ['#0d1f0d', '#1a4d1a', '#267326', '#33991a', NEON];
  return (
    <div style={{
      width: 10, height: 10, borderRadius: 2,
      background: colors[Math.min(level, 4)],
      boxShadow: level > 2 ? `0 0 4px ${NEON}` : 'none',
    }} />
  );
};

const months = ['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai'];

async function fetchTHM() {
  const res = await axios.get(apiUrl('/api/stats/tryhackme'));
  if (res.data?.error) throw new Error(res.data.error);
  const d = res.data;
  return {
    username: d.username,
    avatar: d.avatar,
    memberSince: d.member_since,
    location: d.location,
    globalRank: d.global_rank,
    followers: d.followers,
    following: d.following,
    ctfsCompleted: d.ctfs_completed,
    ctfsWon: d.ctfs_won,
    roomsCompleted: d.rooms_completed,
    roomsTotal: d.rooms_total,
    pathsCompleted: d.paths_completed,
    pathsTotal: d.paths_total,
    achievements: d.achievements,
    achievementsTotal: d.achievements_total,
    completionPercent: d.completion_percent,
    tags: d.tags || [],
    badges: d.badges || [],
    recentActivity: d.recent_activity || [],
    activityHeatmap: d.activity_heatmap || [],
  };
}

export const TryHackMeCard: React.FC = () => {
  const { data, loading, fromCache, error } = useCyberProfile(
    'profile-tryhackme',
    fetchTHM,
  );

  if (loading) return <CardSkeleton color={NEON} label="Carregando TryHackMe..." />;
  if (error || !data) return <ErrorCard color={NEON} platform="TryHackMe" />;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0d1117',
      borderRadius: 16,
      border: `1px solid ${NEON}40`,
      boxShadow: `0 0 30px ${NEON}20, 0 0 60px ${NEON}10, inset 0 0 30px #00000080`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', fontFamily: "'Inter', sans-serif",
      color: '#e0e0e0',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: `1px solid ${NEON}20`,
        background: 'linear-gradient(135deg, #0d1a0d 0%, #0d1117 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* THM Logo */}
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: '#1a2a1a',
            border: `1px solid ${NEON}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 12px ${NEON}30`,
            overflow: 'hidden',
          }}>
            <svg viewBox="0 0 40 40" width="36" height="36">
              <rect width="40" height="40" rx="6" fill="#1a2a1a"/>
              {/* Cloud */}
              <ellipse cx="20" cy="14" rx="9" ry="5" fill="none" stroke="#39ff14" strokeWidth="2"/>
              <rect x="11" y="14" width="18" height="8" fill="#1a2a1a"/>
              <line x1="11" y1="14" x2="11" y2="22" stroke="#39ff14" strokeWidth="2"/>
              <line x1="29" y1="14" x2="29" y2="22" stroke="#39ff14" strokeWidth="2"/>
              {/* Binary */}
              <text x="14" y="30" fontSize="5" fill="#39ff14" fontFamily="monospace">01-00</text>
              <text x="14" y="36" fontSize="5" fill="#39ff14" fontFamily="monospace">010011</text>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>TryHack<span style={{ color: NEON }}>Me</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {fromCache
            ? <OfflineBadge color={NEON} />
            : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#aaa' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: NEON, boxShadow: `0 0 8px ${NEON}` }} />
                Atualizado agora
              </div>
            )
          }
          <div style={{
            width: 32, height: 32, borderRadius: 8, border: `1px solid #333`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#888', fontSize: 16,
          }}>↻</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel */}
        <div style={{
          width: '50%', padding: '20px 24px',
          borderRight: `1px solid ${NEON}15`,
          display: 'flex', flexDirection: 'column', gap: 16,
          overflowY: 'auto',
        }}>
          {/* Profile */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                border: `3px solid ${NEON}`,
                boxShadow: `0 0 20px ${NEON}60, 0 0 40px ${NEON}20`,
                overflow: 'hidden',
              }}>
                <img src={data.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Badge */}
              <div style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 24, height: 24, borderRadius: '50%',
                background: NEON, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 10px ${NEON}`,
              }}>
                <span style={{ fontSize: 12, color: '#000', fontWeight: 700 }}>🛡</span>
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{data.username}</span>
                <span style={{ fontSize: 14, color: NEON }}>✓</span>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Membro desde {data.memberSince}</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>📍 {data.location}</div>
              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {data.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    border: `1px solid ${NEON}60`, color: NEON,
                    background: `${NEON}10`,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            {[
              { icon: '👥', value: data.followers.toLocaleString('pt-BR'), label: 'Seguidores' },
              { icon: '👤', value: data.following, label: 'Seguindo' },
              { icon: '🚩', value: data.ctfsCompleted, label: 'CTFs Completadas' },
              { icon: '🔥', value: data.ctfsWon, label: 'Streak' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#0a1a0a', borderRadius: 10, padding: '10px 8px',
                border: `1px solid ${NEON}20`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: NEON, marginBottom: 2 }}>{stat.value}</div>
                <div style={{ fontSize: 9, color: '#666', lineHeight: 1.2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Achievements */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>Conquistas Recentes</span>
              <a href="https://tryhackme.com/p/athosfrog" target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: NEON, textDecoration: 'none' }}>Ver todas ↗</a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 52px)', gap: 8 }}>
              {data.badges.map(badge => (
                <div key={badge.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 52 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 8,
                    background: '#0a1a0a', border: `1px solid ${NEON}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 8px ${NEON}15`,
                  }}>
                    <span style={{ fontSize: 20 }}>{badge.icon}</span>
                  </div>
                  <div style={{ width: 52, textAlign: 'center', fontSize: 8, color: '#666', lineHeight: 1.2 }}>
                    {badge.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{
          width: '50%', padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: 16,
          overflowY: 'auto',
        }}>
          {/* Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>Progresso Geral</span>
              <a href="https://tryhackme.com/p/athosfrog" target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: NEON, textDecoration: 'none' }}>Ver perfil no TryHackMe ↗</a>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              {/* Ring */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <ProgressRing percent={data.completionPercent} size={100} stroke={8} />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: NEON }}>{data.completionPercent}%</div>
                  <div style={{ fontSize: 9, color: '#666', lineHeight: 1.2 }}>Ranking<br/>Global</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#aaa' }}>#{data.globalRank.toLocaleString('pt-BR')}</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Salas Completadas', val: data.roomsCompleted, total: data.roomsTotal },
                  { label: 'Caminhos Completados', val: data.pathsCompleted, total: data.pathsTotal },
                  { label: 'Conquistas', val: data.achievements, total: data.achievementsTotal },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{item.label}</span>
                      <span style={{ fontSize: 11, color: '#888' }}>{item.val}/{item.total}</span>
                    </div>
                    <ProgressBar value={item.val} total={item.total} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ccc', marginBottom: 8 }}>Atividade Recente</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.recentActivity.map((act, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#555' }}>
                      {act.type === 'room' ? '🚩' : act.type === 'path' ? '🏅' : '🏆'}
                    </span>
                    <span style={{ color: '#999' }}>{act.description}</span>
                    <span style={{ color: NEON }}>{act.target}</span>
                  </div>
                  <span style={{ color: '#555', fontSize: 11, flexShrink: 0 }}>{act.timeAgo}</span>
                </div>
              ))}
            </div>
            <a href="https://tryhackme.com/p/athosfrog" target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: NEON, textDecoration: 'none', display: 'block', marginTop: 8 }}>
              Ver mais atividades ↗
            </a>
          </div>

          {/* Heatmap */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#ccc', fontWeight: 600 }}>Atividade (últimos 12 meses)</span>
              <a href="https://tryhackme.com/p/athosfrog" target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: NEON, textDecoration: 'none' }}>Ver calendário completo ↗</a>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.activityHeatmap.length}, 1fr)`, gap: 2, marginBottom: 4 }}>
                {data.activityHeatmap.map((month, mi) => (
                  <div key={mi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {month.map((level, wi) => (
                      <HeatCell key={wi} level={level} />
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, gap: 2 }}>
                {months.map(m => (
                  <div key={m} style={{ fontSize: 8, color: '#555', textAlign: 'center' }}>{m}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
