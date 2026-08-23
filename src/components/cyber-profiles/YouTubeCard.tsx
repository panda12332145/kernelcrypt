// ============================================================
// COMPONENT: YouTubeCard
// Cyberpunk-style YouTube channel dashboard
// Neon color: #ef4444 (Red)
// ============================================================

import React from 'react';
import axios from 'axios';
import { apiUrl } from '../../lib/api';
import { useCyberProfile } from '../../hooks/useCyberProfile';
import { CardSkeleton, ErrorCard, OfflineBadge } from './CacheHelpers';

const NEON = '#ef4444';
const GREEN = '#22c55e';

// Sparkline chart
const SparkLine: React.FC<{ data: number[] }> = ({ data: points }) => {
  const w = 300, h = 80;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);

  const pathD = points.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 10) - 5;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const areaD = pathD + ` L${(points.length - 1) * step},${h} L0,${h} Z`;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NEON} stopOpacity="0.4" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke={NEON} strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 4px ${NEON})` }} />
    </svg>
  );
};

// Progress bar
const ProgressBar: React.FC<{ value: number; total: number; color?: string }> = ({ value, total, color = NEON }) => {
  const pct = Math.min((value / total) * 100, 100);
  return (
    <div style={{ width: '100%', height: 6, background: '#1e0a0a', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: color,
        borderRadius: 3, boxShadow: `0 0 8px ${color}`,
        transition: 'width 1.2s ease',
      }} />
    </div>
  );
};

const formatNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

async function fetchYT() {
  const res = await axios.get(apiUrl('/api/stats/youtube'));
  if (res.data?.error) throw new Error(res.data.error);
  const d = res.data;
  return {
    channelName: d.channel_name,
    handle: d.handle,
    avatar: d.avatar,
    description: d.description,
    location: d.location,
    linkUrl: d.link_url,
    channelUrl: d.channel_url,
    subscribers: d.subscribers,
    totalVideos: d.total_videos,
    totalViews: d.total_views,
    totalLikes: d.total_likes,
    last28Views: d.last28_views,
    last28Hours: d.last28_hours,
    last28Subscribers: d.last28_subscribers,
    last28Likes: d.last28_likes,
    viewsGrowth: d.views_growth,
    hoursGrowth: d.hours_growth,
    subsGrowth: d.subs_growth,
    likesGrowth: d.likes_growth,
    estimatedRevenue: d.estimated_revenue,
    subscriberGoal: d.subscriber_goal,
    featuredVideo: d.featured_video || {},
    chartData: d.chart_data || [],
  };
}

export const YouTubeCard: React.FC = () => {
  const { data, loading, fromCache, error } = useCyberProfile(
    'profile-youtube',
    fetchYT,
  );

  if (loading) return <CardSkeleton color={NEON} label="Carregando YouTube..." />;
  if (error || !data) return <ErrorCard color={NEON} platform="YouTube" />;

  const goalPct = Math.round((data.subscribers / data.subscriberGoal) * 100);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0d0909',
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
        background: 'linear-gradient(135deg, #1a0a0a 0%, #0d0909 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 24, background: NEON, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 12px ${NEON}60`,
          }}>
            <span style={{ color: '#fff', fontSize: 12 }}>▶</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>YouTube</span>
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
            color: '#888', fontSize: 16, cursor: 'pointer',
          }}>↻</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel */}
        <div style={{
          width: '48%', padding: '20px 24px',
          borderRight: `1px solid ${NEON}15`,
          display: 'flex', flexDirection: 'column', gap: 14,
          overflowY: 'auto',
        }}>
          {/* Channel Info */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                border: `3px solid ${NEON}`,
                boxShadow: `0 0 20px ${NEON}60, 0 0 40px ${NEON}20`,
                overflow: 'hidden',
              }}>
                <img src={data.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{data.channelName}</span>
                <span style={{ color: '#38bdf8', fontSize: 14 }}>✓</span>
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{data.handle}</div>
              <div style={{ fontSize: 11, color: '#999', lineHeight: 1.4, marginBottom: 6 }}>{data.description}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#888' }}>📍 {data.location}</span>
                <a href={`https://${data.linkUrl}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: NEON, textDecoration: 'none' }}>🔗 {data.linkUrl}</a>
              </div>
            </div>
          </div>

          {/* Subscribe Button */}
          <a href={data.channelUrl} target="_blank" rel="noreferrer" style={{
            background: NEON, color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', width: 'fit-content', textDecoration: 'none', display: 'inline-block',
            boxShadow: `0 0 15px ${NEON}60`,
          }}>
            Inscrever-se 🔔
          </a>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            {[
              { icon: '👥', value: formatNum(data.subscribers), label: 'Inscritos' },
              { icon: '▶', value: data.totalVideos, label: 'Vídeos' },
              { icon: '👁', value: formatNum(data.totalViews), label: 'Visualizações' },
              { icon: '👍', value: formatNum(data.totalLikes), label: 'Curtidas' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#100808', borderRadius: 10, padding: '10px 6px',
                border: `1px solid ${NEON}20`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 16, color: NEON, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: NEON, marginBottom: 2 }}>{stat.value}</div>
                <div style={{ fontSize: 9, color: '#666' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Performance Chart */}
          <div style={{ background: '#100808', borderRadius: 10, padding: '12px', border: `1px solid ${NEON}15` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>Desempenho do canal</span>
              <span style={{ fontSize: 11, color: '#666' }}>Últimos 28 dias</span>
            </div>
            <SparkLine data={data.chartData} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginTop: 8 }}>
              {[
                { label: 'Visualizações', value: formatNum(data.last28Views), growth: data.viewsGrowth },
                { label: 'Tempo de exibição (horas)', value: formatNum(data.last28Hours), growth: data.hoursGrowth },
                { label: 'Inscritos', value: `+${data.last28Subscribers}`, growth: data.subsGrowth },
                { label: 'Receita estimada', value: data.estimatedRevenue, growth: 12.7 },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#666', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: GREEN }}>↑ {item.growth}%</div>
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
          {/* Featured Video */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>Vídeo em destaque</span>
              <a href={data.featuredVideo.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: NEON, textDecoration: 'none' }}>Assistir no YouTube ↗</a>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {/* Thumbnail */}
              <div style={{ position: 'relative', flexShrink: 0, borderRadius: 8, overflow: 'hidden', width: 140 }}>
                <img src={data.featuredVideo.thumbnail} alt="video" style={{ width: '100%', height: 90, objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute', bottom: 4, right: 4,
                  background: '#000000CC', borderRadius: 4, padding: '1px 6px',
                  fontSize: 10, color: '#fff',
                }}>{data.featuredVideo.duration}</div>
              </div>
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>
                  {data.featuredVideo.title}
                </div>
                <div style={{ fontSize: 11, color: '#777', marginBottom: 4 }}>📅 {data.featuredVideo.date}</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#999' }}>▶ {data.featuredVideo.views} visualizações</span>
                  <span style={{ fontSize: 11, color: '#999' }}>👍 {data.featuredVideo.likes} curtidas</span>
                </div>
                <div style={{ fontSize: 11, color: '#777', lineHeight: 1.4 }}>{data.featuredVideo.description}</div>
              </div>
            </div>
          </div>

          {/* 28-day Stats */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ccc', marginBottom: 10 }}>Estatísticas dos últimos 28 dias</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              {[
                { icon: '▶', value: formatNum(data.last28Views), label: 'Visualizações', growth: data.viewsGrowth },
                { icon: '⏱', value: formatNum(data.last28Hours), label: 'Horas assistidas', growth: data.hoursGrowth },
                { icon: '👥+', value: `+${data.last28Subscribers}`, label: 'Inscritos', growth: data.subsGrowth },
                { icon: '👍', value: formatNum(data.last28Likes), label: 'Curtidas', growth: data.likesGrowth },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: '#100808', borderRadius: 10, padding: '10px 8px',
                  border: `1px solid ${NEON}15`, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 14, color: NEON, marginBottom: 4 }}>{stat.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{stat.value}</div>
                  <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontSize: 10, color: GREEN }}>↑ {stat.growth}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscriber Growth */}
          <div style={{ background: '#100808', borderRadius: 10, padding: '12px', border: `1px solid ${NEON}15` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>Crescimento de inscritos</span>
              <span style={{ fontSize: 11, color: '#666' }}>Últimos 28 dias</span>
            </div>
            <ProgressBar value={data.subscribers} total={data.subscriberGoal} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#aaa' }}>{formatNum(data.subscribers)}</span>
              <span style={{ fontSize: 12, color: '#777' }}>Meta: {formatNum(data.subscriberGoal)}</span>
              <span style={{ fontSize: 12, color: NEON, fontWeight: 700 }}>{goalPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
