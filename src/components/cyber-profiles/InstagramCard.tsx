// ============================================================
// COMPONENT: InstagramCard
// Cyberpunk-style Instagram profile dashboard
// Neon color: #e1306c (Pink/Purple gradient)
// ============================================================

import React from 'react';
import axios from 'axios';
import { apiUrl } from '../../lib/api';
import { useCyberProfile } from '../../hooks/useCyberProfile';
import { CardSkeleton, ErrorCard, OfflineBadge } from './CacheHelpers';

const NEON_PINK = '#e1306c';
const NEON_PURPLE = '#9b59b6';

async function fetchIG() {
  const res = await axios.get(apiUrl('/api/stats/instagram'));
  if (res.data?.error) throw new Error(res.data.error);
  const d = res.data;
  return {
    username: d.username,
    avatar: d.avatar,
    bio: d.bio,
    location: d.location,
    followers: d.followers,
    following: d.following,
    posts: d.posts,
    totalLikes: d.total_likes,
    highlights: d.highlights || [],
    latestPost: d.latest_post || {},
  };
}

export const InstagramCard: React.FC = () => {
  const { data, loading, fromCache, error } = useCyberProfile(
    'profile-instagram',
    fetchIG,
  );

  const NEON_BLUE = '#3498db';
  const GREEN = '#22c55e';

  if (loading) return <CardSkeleton color={NEON_PINK} label="Carregando Instagram..." />;
  if (error || !data) return <ErrorCard color={NEON_PINK} platform="Instagram" />;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0a0a14',
      borderRadius: 16,
      border: '1px solid',
      borderImage: 'linear-gradient(135deg, #e1306c40, #9b59b640, #3498db40) 1',
      boxShadow: `0 0 30px ${NEON_PINK}20, 0 0 60px ${NEON_PURPLE}10, inset 0 0 30px #00000080`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', fontFamily: "'Inter', sans-serif",
      color: '#e0e0e0',
      position: 'relative',
    }}>
      {/* Gradient border overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: 16,
        border: '1px solid transparent',
        background: 'linear-gradient(#0a0a14, #0a0a14) padding-box, linear-gradient(135deg, #e1306c60, #9b59b640, #3498db40) border-box',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: `1px solid #ffffff15`,
        background: 'linear-gradient(135deg, #12081a 0%, #0a0a14 100%)',
        zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Instagram Logo */}
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: `0 0 12px ${NEON_PINK}60`,
          }}>📷</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Instagram</div>
            <div style={{ fontSize: 11, color: '#888' }}>@{data.username}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {fromCache
            ? <OfflineBadge color={NEON_PINK} />
            : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#aaa' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                Atualizado agora
              </div>
            )
          }
          <div style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid #333',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#888', fontSize: 16, cursor: 'pointer',
          }}>↻</div>
        </div>
      </div>

      {/* Gradient accent line */}
      <div style={{
        height: 2,
        background: 'linear-gradient(90deg, #e1306c, #9b59b6, #3498db)',
        zIndex: 2,
      }} />

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', zIndex: 2 }}>
        {/* Left Panel */}
        <div style={{
          width: '46%', padding: '20px 24px',
          borderRight: `1px solid #ffffff10`,
          display: 'flex', flexDirection: 'column', gap: 16,
          overflowY: 'auto',
        }}>
          {/* Profile */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {/* Avatar with gradient ring */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: 86, height: 86, borderRadius: '50%',
                background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                padding: 3,
                boxShadow: `0 0 20px ${NEON_PINK}50`,
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#0a0a14' }}>
                  <img src={data.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            </div>
            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{data.username}</span>
                <span style={{ color: NEON_BLUE, fontSize: 14 }}>✓</span>
              </div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#aaa' }}>Cybersecurity • </span>
                <span style={{ color: NEON_PURPLE }}>Low-level</span>
                <span style={{ color: '#aaa' }}> • </span>
                <span style={{ color: NEON_PINK }}>Malware Analysis</span>
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>📍 {data.location}</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            {[
              { icon: '👥', value: data.followers.toLocaleString('pt-BR'), label: 'Seguidores', color: NEON_PURPLE },
              { icon: '👤', value: data.following, label: 'Seguindo', color: NEON_BLUE },
              { icon: '🖼️', value: data.posts, label: 'Publicações', color: NEON_PINK },
              { icon: '❤️', value: data.totalLikes.toLocaleString('pt-BR'), label: 'Curtidas', color: '#ef4444' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#0f0a18', borderRadius: 10, padding: '10px 6px',
                border: `1px solid ${stat.color}20`, textAlign: 'center',
              }}>
                <div style={{ fontSize: 14, color: stat.color, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
                <div style={{ fontSize: 9, color: '#666' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 3, height: 14, background: NEON_PINK, borderRadius: 2 }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>Destaques</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {data.highlights.map(h => (
                <div key={h.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: `${h.color}20`, border: `2px solid ${h.color}60`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, cursor: 'pointer',
                    boxShadow: `0 0 8px ${h.color}30`,
                  }}>
                    {h.icon === '>_' ? <span style={{ fontSize: 14, color: h.color, fontFamily: 'monospace' }}>&gt;_</span>
                      : h.icon === '</>' ? <span style={{ fontSize: 11, color: h.color, fontFamily: 'monospace' }}>&lt;/&gt;</span>
                      : h.icon === '...' ? <span style={{ fontSize: 14, color: '#888' }}>···</span>
                      : <span>{h.icon}</span>}
                  </div>
                  <span style={{ fontSize: 9, color: '#666' }}>{h.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{
          width: '54%', padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: 16,
          overflowY: 'auto',
        }}>
          {/* Latest Post */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>Última publicação</div>
                <div style={{ width: 40, height: 2, background: NEON_PINK, marginTop: 3, borderRadius: 1, boxShadow: `0 0 6px ${NEON_PINK}` }} />
              </div>
              <a href={`https://www.instagram.com/${data.username}/`} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: '#aaa', textDecoration: 'none' }}>Ver no Instagram ↗</a>
            </div>

            {/* Post Image */}
            <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 10, position: 'relative' }}>
              <img src={data.latestPost.image} alt="post" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
            </div>

            {/* Post Meta */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 12, color: '#888', alignItems: 'center' }}>
              <span>📅 {data.latestPost.date}</span>
              <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#aaa' }}>
                  <span style={{ color: NEON_PINK }}>❤️</span> {data.latestPost.likes}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#aaa' }}>
                  <span>💬</span> {data.latestPost.comments}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#aaa' }}>
                  <span>↗</span> {data.latestPost.shares}
                </span>
              </div>
            </div>

            {/* Caption */}
            <div style={{
              background: '#0f0a18', borderRadius: 8, padding: '10px 12px',
              border: `1px solid ${NEON_PURPLE}20`, fontFamily: 'monospace',
            }}>
              <div style={{ fontSize: 12, color: '#d0d0d0', marginBottom: 6 }}>{data.latestPost.caption}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {data.latestPost.hashtags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 11,
                    color: tag.includes('malware') ? NEON_PINK
                      : tag.includes('reverse') ? NEON_PURPLE
                      : NEON_BLUE,
                  }}>{tag}</span>
                ))}
                <span style={{ fontSize: 12, color: '#555' }}>...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
