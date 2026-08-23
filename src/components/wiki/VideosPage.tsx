import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  Film,
  ListVideo,
  Loader2,
  Play,
  Search,
  X,
} from 'lucide-react';
import { apiUrl } from '../../lib/api';
import type { WikiVideo } from '../../types';

const difficulties = ['all', 'beginner', 'intermediate', 'advanced'] as const;
const contentTypes = ['all', 'Video', 'Playlist'] as const;

type DifficultyFilter = (typeof difficulties)[number];
type ContentTypeFilter = (typeof contentTypes)[number];

const diffClass: Record<WikiVideo['difficulty'], string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
};

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `rgba(0, 255, 136, ${alpha})`;
  }

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const parseYouTubeUrl = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace('www.', '');
    const pathParts = url.pathname.split('/').filter(Boolean);
    const playlistId = url.searchParams.get('list') || undefined;

    if (host === 'youtu.be') {
      return { videoId: pathParts[0], playlistId, isPlaylist: Boolean(playlistId) };
    }

    if (host.includes('youtube.com')) {
      if (pathParts[0] === 'embed' && pathParts[1] === 'videoseries') {
        return { videoId: undefined, playlistId, isPlaylist: Boolean(playlistId) };
      }

      if (pathParts[0] === 'embed' && pathParts[1]) {
        return { videoId: pathParts[1], playlistId, isPlaylist: Boolean(playlistId) };
      }

      if (pathParts[0] === 'shorts' && pathParts[1]) {
        return { videoId: pathParts[1], playlistId, isPlaylist: Boolean(playlistId) };
      }

      return {
        videoId: url.searchParams.get('v') || undefined,
        playlistId,
        isPlaylist: Boolean(playlistId),
      };
    }
  } catch {
    const videoMatch = rawUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    const listMatch = rawUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return {
      videoId: videoMatch?.[1],
      playlistId: listMatch?.[1],
      isPlaylist: Boolean(listMatch?.[1]),
    };
  }

  return { videoId: undefined, playlistId: undefined, isPlaylist: false };
};

const getEmbedUrl = (video: WikiVideo) => {
  const { videoId, playlistId, isPlaylist } = parseYouTubeUrl(video.videoUrl);
  const autoplay = 'autoplay=1&rel=0&modestbranding=1';

  if (isPlaylist && videoId && playlistId) {
    return `https://www.youtube.com/embed/${videoId}?list=${playlistId}&${autoplay}`;
  }

  if (isPlaylist && playlistId) {
    return `https://www.youtube.com/embed/videoseries?list=${playlistId}&${autoplay}`;
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?${autoplay}`;
  }

  return video.videoUrl;
};

const VideosPage: React.FC = () => {
  const [videos, setVideos] = useState<WikiVideo[]>([]);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [typeFilter, setTypeFilter] = useState<ContentTypeFilter>('all');
  const [selectedVideo, setSelectedVideo] = useState<WikiVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/wiki/videos'));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as WikiVideo[];
      setVideos(data);
    } catch {
      setError('Could not load videos from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (!selectedVideo) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedVideo(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedVideo]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return videos.filter((video) => {
      const matchesSearch =
        !term ||
        video.title.toLowerCase().includes(term) ||
        video.customBadgeLabel.some((l) => l.toLowerCase().includes(term));
      const matchesDifficulty = difficultyFilter === 'all' || video.difficulty === difficultyFilter;
      const matchesType = typeFilter === 'all' || video.contentType === typeFilter;

      return matchesSearch && matchesDifficulty && matchesType;
    });
  }, [difficultyFilter, search, typeFilter, videos]);

  const selectedEmbedUrl = selectedVideo ? getEmbedUrl(selectedVideo) : '';

  return (
    <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 max-w-6xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="section-label mb-4">
          <Film className="w-4 h-4" />
          <span>VIDEO LESSONS</span>
        </div>
        <h1 className="text-4xl font-black text-white mb-2">Course Library</h1>
        <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
          Videos loaded from the portfolio database, with a built-in player for lessons and playlists.
        </p>
      </motion.div>

      <div className="flex flex-col gap-3 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or topic..."
            className="search-input pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {difficulties.map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => setDifficultyFilter(difficulty)}
              className={`font-mono text-xs px-3 py-2 rounded-lg border transition-all capitalize ${
                difficultyFilter === difficulty
                  ? 'border-emerald-400/30 bg-emerald-400/6 text-emerald-400'
                  : 'border-white/8 text-white/40 hover:text-white/70'
              }`}
            >
              {difficulty}
            </button>
          ))}

          <div className="hidden sm:block w-px bg-white/10 mx-1" />

          {contentTypes.map((contentType) => (
            <button
              key={contentType}
              onClick={() => setTypeFilter(contentType)}
              className={`font-mono text-xs px-3 py-2 rounded-lg border transition-all ${
                typeFilter === contentType
                  ? 'border-sky-400/30 bg-sky-400/6 text-sky-300'
                  : 'border-white/8 text-white/40 hover:text-white/70'
              }`}
            >
              {contentType}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          Loading videos
        </div>
      )}

      {!loading && error && (
        <div
          className="p-5 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div className="flex-1">
            <p className="text-white font-semibold">{error}</p>
            <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Start the FastAPI backend on port 8000 and try again.
            </p>
          </div>
          <button onClick={fetchVideos} className="btn-secondary px-4 py-2 text-xs">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((video, index) => (
            <motion.button
              key={video.id}
              type="button"
              onClick={() => setSelectedVideo(video)}
              className="project-card overflow-hidden text-left group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative aspect-video bg-black overflow-hidden">
                <img
                  src={video.coverUrl}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div
                  className="absolute left-1/2 top-1/2 w-14 h-14 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: 'rgba(239,68,68,0.9)', boxShadow: '0 0 30px rgba(239,68,68,0.45)' }}
                >
                  <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                </div>
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <span className={`font-mono text-[10px] px-2 py-1 rounded border ${diffClass[video.difficulty]}`}>
                    {video.difficulty}
                  </span>
                  <span
                    className="font-mono text-[10px] px-2 py-1 rounded border inline-flex items-center gap-1"
                    style={{
                      color: video.contentType === 'Playlist' ? '#38bdf8' : '#f87171',
                      background: video.contentType === 'Playlist' ? 'rgba(56,189,248,0.1)' : 'rgba(239,68,68,0.1)',
                      borderColor: video.contentType === 'Playlist' ? 'rgba(56,189,248,0.25)' : 'rgba(239,68,68,0.25)',
                    }}
                  >
                    {video.contentType === 'Playlist' ? <ListVideo className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                    {video.contentType}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-white text-sm leading-snug min-h-10 group-hover:text-emerald-300 transition-colors">
                  {video.title}
                </h3>

                <div className="flex items-center justify-between gap-3 mt-4">
                  <div className="flex flex-wrap gap-2">
                    {video.customBadgeLabel.map((label, i) => (
                      <span
                        key={i}
                        className="font-mono text-[11px] px-2.5 py-1 rounded border"
                        style={{
                          color: video.customBadgeColor,
                          background: hexToRgba(video.customBadgeColor, 0.1),
                          borderColor: hexToRgba(video.customBadgeColor, 0.28),
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono text-xs inline-flex items-center gap-1 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="w-3.5 h-3.5" />
                    {video.duration}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>No videos found</p>
        </div>
      )}

      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6"
            style={{ background: 'rgba(0,0,0,0.82)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              className="w-full max-w-6xl overflow-hidden"
              style={{ background: '#080a10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${diffClass[selectedVideo.difficulty]}`}>
                      {selectedVideo.difficulty}
                    </span>
                    {selectedVideo.customBadgeLabel.map((label, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] px-2 py-0.5 rounded border"
                        style={{
                          color: selectedVideo.customBadgeColor,
                          background: hexToRgba(selectedVideo.customBadgeColor, 0.1),
                          borderColor: hexToRgba(selectedVideo.customBadgeColor, 0.28),
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-bold text-white text-sm sm:text-base truncate">{selectedVideo.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={selectedVideo.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Open original video"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedVideo(null)}
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Close player"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-[1fr_280px]">
                <div className="aspect-video bg-black">
                  <iframe
                    title={selectedVideo.title}
                    src={selectedEmbedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                <aside className="p-4 lg:border-l border-white/8">
                  <div className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--neon-green)' }}>
                    Now playing
                  </div>
                  <div className="space-y-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <span>Type</span>
                      <span className="text-white">{selectedVideo.contentType}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Duration</span>
                      <span className="text-white">{selectedVideo.duration}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Level</span>
                      <span className="text-white capitalize">{selectedVideo.difficulty}</span>
                    </div>
                    <div className="pt-3 border-t border-white/8 flex flex-wrap gap-2">
                      {selectedVideo.customBadgeLabel.map((label, i) => (
                        <span
                          key={i}
                          className="inline-flex px-2.5 py-1 rounded border"
                          style={{
                            color: selectedVideo.customBadgeColor,
                            background: hexToRgba(selectedVideo.customBadgeColor, 0.1),
                            borderColor: hexToRgba(selectedVideo.customBadgeColor, 0.28),
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideosPage;
