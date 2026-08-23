// ============================================================
// COMPONENT: LeetCodeCard
// Cyberpunk-style LeetCode profile dashboard
// Neon color: #f97316 (Orange)
// ============================================================

import React from 'react';
import axios from 'axios';
import { apiUrl } from '../../lib/api';
import { useCyberProfile } from '../../hooks/useCyberProfile';
import { CardSkeleton, ErrorCard, OfflineBadge } from './CacheHelpers';

const NEON = '#f97316';
const GREEN = '#22c55e';
const YELLOW = '#eab308';
const RED = '#ef4444';

const ProgressRing: React.FC<{ percent: number; size: number; stroke: number; color?: string }> = ({
  percent, size, stroke, color = NEON
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e1a0e" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dashoffset 1.5s ease' }}
      />
    </svg>
  );
};

const ProgressBar: React.FC<{ value: number; total: number; color: string }> = ({ value, total, color }) => {
  const pct = Math.min((value / total) * 100, 100);
  return (
    <div style={{ width: '100%', height: 6, background: '#1e1a0e', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: color,
        borderRadius: 3, boxShadow: `0 0 8px ${color}`,
        transition: 'width 1.2s ease',
      }} />
    </div>
  );
};

async function fetchLC() {
  const res = await axios.get(apiUrl('/api/stats/leetcode'));
  if (res.data?.error) throw new Error(res.data.error);
  const d = res.data;
  return {
    username: d.username,
    avatar: d.avatar,
    location: d.location,
    followers: d.followers,
    joinedDate: d.joined_date,
    problemsSolved: d.problems_solved,
    submissionsAccepted: d.submissions_accepted,
    problemsAttempted: d.problems_attempted,
    rating: d.rating,
    easyTotal: d.easy_total,
    easySolved: d.easy_solved,
    mediumTotal: d.medium_total,
    mediumSolved: d.medium_solved,
    hardTotal: d.hard_total,
    hardSolved: d.hard_solved,
    totalProblems: d.total_problems,
    completionPercent: d.completion_percent,
    globalRank: d.global_rank,
    countryRank: d.country_rank,
    streak: d.streak,
    bestStreak: d.best_streak,
    dailyProblem: d.daily_problem,
    recentActivity: d.recent_activity || [],
    languages: d.languages || [],
  };
}

export const LeetCodeCard: React.FC = () => {
  const { data, loading, fromCache, error } = useCyberProfile(
    'profile-leetcode',
    fetchLC,
  );

  if (loading) return <CardSkeleton color={NEON} label="Carregando LeetCode..." />;
  if (error || !data) return <ErrorCard color={NEON} platform="LeetCode" />;

  const easyPct = ((data.easySolved / data.easyTotal) * 100).toFixed(1);
  const mediumPct = ((data.mediumSolved / data.mediumTotal) * 100).toFixed(1);
  const hardPct = ((data.hardSolved / data.hardTotal) * 100).toFixed(1);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0d0f12',
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
        background: 'linear-gradient(135deg, #150e00 0%, #0d0f12 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#1e1a0e', border: `1px solid ${NEON}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: `0 0 12px ${NEON}30`,
          }}>🔷</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Leet<span style={{ color: NEON }}>Code</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {fromCache
            ? <OfflineBadge color={NEON} />
            : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#aaa' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
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
          width: '48%', padding: '20px 24px',
          borderRight: `1px solid ${NEON}15`,
          display: 'flex', flexDirection: 'column', gap: 16,
          overflowY: 'auto',
        }}>
          {/* Profile */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                border: `3px solid ${NEON}`,
                boxShadow: `0 0 20px ${NEON}60, 0 0 40px ${NEON}20`,
                overflow: 'hidden',
              }}>
                <img src={data.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{data.username}</span>
                <span style={{ color: NEON, fontSize: 14 }}>🔷</span>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>LeetCode Member</div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>📍 {data.location}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#f87171' }}>❤️ {(data.followers / 1000).toFixed(1)}K Followers</span>
                <span style={{ fontSize: 12, color: '#888' }}>📅 Joined {data.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: '</>', color: NEON, value: data.problemsSolved.toLocaleString('pt-BR'), label: 'Problemas\nResolvidos' },
              { icon: '✅', color: GREEN, value: data.submissionsAccepted.toLocaleString('pt-BR'), label: 'Submissões\nAceitas' },
              { icon: '📊', color: '#38bdf8', value: data.problemsAttempted, label: 'Problemas\nTentados' },
              { icon: '⭐', color: YELLOW, value: data.rating, label: 'Avaliação' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#0a0c10', borderRadius: 10, padding: '12px',
                border: `1px solid ${stat.color}20`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, marginBottom: 4, color: stat.color }}>{stat.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
                <div style={{ fontSize: 9, color: '#666', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Difficulty Stats */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ccc', marginBottom: 10 }}>Estatísticas por Dificuldade</div>
            {[
              { label: 'Fácil', solved: data.easySolved, total: data.easyTotal, pct: easyPct, color: GREEN },
              { label: 'Médio', solved: data.mediumSolved, total: data.mediumTotal, pct: mediumPct, color: YELLOW },
              { label: 'Difícil', solved: data.hardSolved, total: data.hardTotal, pct: hardPct, color: RED },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}` }} />
                  <span style={{ fontSize: 12, color: '#aaa', width: 48 }}>{item.label}</span>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={item.solved} total={item.total} color={item.color} />
                  </div>
                  <span style={{ fontSize: 11, color: '#666', width: 72, textAlign: 'right' }}>{item.solved}/{item.total}</span>
                  <span style={{ fontSize: 11, color: item.color, width: 36, textAlign: 'right' }}>{item.pct}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Languages */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ccc', marginBottom: 10 }}>Languages</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.languages.map((lang: any) => (
                <div key={lang.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#e0e0e0', fontWeight: 600 }}>{lang.name}</span>
                  <span style={{ fontSize: 12, color: '#aaa' }}>{lang.solved} problem{lang.solved !== 1 ? 's' : ''} solved</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{
          width: '52%', padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: 16,
          overflowY: 'auto',
        }}>
          {/* Progress Ring + Bars */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>Progresso</span>
              <a href="https://leetcode.com/u/panda12332145/" target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: NEON, textDecoration: 'none' }}>Ver perfil no LeetCode ↗</a>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <ProgressRing percent={data.completionPercent} size={100} stroke={8} color={NEON} />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NEON }}>{data.completionPercent}%</div>
                  <div style={{ fontSize: 9, color: '#666', lineHeight: 1.2 }}>Conclusão<br/>Total</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Problemas Resolvidos', val: data.problemsSolved, total: data.totalProblems, color: NEON },
                  { label: 'Fácil', val: data.easySolved, total: data.easyTotal, color: GREEN },
                  { label: 'Médio', val: data.mediumSolved, total: data.mediumTotal, color: YELLOW },
                  { label: 'Difícil', val: data.hardSolved, total: data.hardTotal, color: RED },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{item.label}</span>
                      <span style={{ fontSize: 11, color: '#666' }}>{item.val.toLocaleString('pt-BR')} / {item.total.toLocaleString('pt-BR')}</span>
                    </div>
                    <ProgressBar value={item.val} total={item.total} color={item.color} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ccc', marginBottom: 8 }}>Atividade Recente</div>
            {data.recentActivity.map((act, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                padding: '8px 10px', background: '#0a0c10', borderRadius: 8,
                border: `1px solid ${NEON}15`, marginBottom: 6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <span style={{ color: act.status === 'accepted' ? GREEN : RED, flexShrink: 0 }}>
                      {act.status === 'accepted' ? '✅' : '🔴'}
                    </span>
                    <span style={{ color: '#e0e0e0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {act.problem}
                    </span>
                  </div>
                  <span style={{ color: '#555', fontSize: 11, flexShrink: 0, marginLeft: 8 }}>{act.timeAgo}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#888', paddingLeft: 24 }}>
                  {act.language && <span style={{ color: NEON }}>{act.language}</span>}
                  {act.runtime && <span>⏱️ {act.runtime}</span>}
                  {act.memory && <span>💾 {act.memory}</span>}
                  {act.difficulty && <span style={{ color: act.difficulty === 'Hard' ? RED : act.difficulty === 'Easy' ? GREEN : YELLOW }}>{act.difficulty}</span>}
                </div>
              </div>
            ))}
            <a href="https://leetcode.com/u/panda12332145/" target="_blank" rel="noreferrer"
              style={{ fontSize: 12, color: NEON, textDecoration: 'none' }}>Ver mais atividades ↗</a>
          </div>

          {/* Bottom Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            {[
              { icon: '🔥', value: `${data.streak} dias`, label: 'Sequência Atual', sub: `Melhor: ${data.bestStreak} dias`, color: NEON },
              { icon: '📅', value: data.dailyProblem, label: 'Problema Diário', sub: 'Soluções', color: '#38bdf8' },
              { icon: '🛡️', value: `#${data.globalRank.toLocaleString('pt-BR')}`, label: 'Classificação Global', sub: 'Top 5.08%', color: '#a855f7' },
              { icon: '🌐', value: `#${data.countryRank.toLocaleString('pt-BR')}`, label: 'Ranking do País', sub: 'Top 1.02%', color: GREEN },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#0a0c10', borderRadius: 10, padding: '10px 8px',
                border: `1px solid ${stat.color}20`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 14, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
                <div style={{ fontSize: 9, color: '#666', lineHeight: 1.2, marginBottom: 2 }}>{stat.label}</div>
                <div style={{ fontSize: 9, color: '#555' }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
