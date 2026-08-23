import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Maximize2,
  MessageSquare,
  Moon,
  PenLine,
  Search,
  Sun,
  Type,
  Underline,
  User,
  Users,
  X,
} from 'lucide-react';
import { apiUrl } from '../../lib/api';
import type { WikiBook, WikiBookAnnotation, WikiBookChapter, WikiBookContent } from '../../types';

const difficulties = ['all', 'beginner', 'intermediate', 'advanced'] as const;
const scopes = ['mine', 'all'] as const;
const readerFonts = [
  'Georgia',
  'Times New Roman',
  'Arial',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Courier New',
  'JetBrains Mono',
  'Fira Code',
  'Outfit',
  'Palatino Linotype',
  'Garamond',
  'Calibri',
  'Segoe UI',
  'Ubuntu',
];

type DifficultyFilter = (typeof difficulties)[number];
type AnnotationScope = (typeof scopes)[number];
type ReaderTheme = 'dark' | 'light' | 'sepia';

interface ReaderSettings {
  theme: ReaderTheme;
  brightness: number;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  fontFamily: string;
}

interface ReaderIdentity {
  id: string;
  label: string;
}

const defaultSettings: ReaderSettings = {
  theme: 'dark',
  brightness: 100,
  fontSize: 18,
  letterSpacing: 0,
  lineHeight: 1.75,
  fontFamily: 'Georgia',
};

const diffClass: Record<WikiBook['difficulty'], string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
};

const themeStyles: Record<ReaderTheme, { background: string; color: string; panel: string }> = {
  dark: { background: '#07090f', color: '#f0f4ff', panel: 'rgba(5,6,10,0.94)' },
  light: { background: '#f8fafc', color: '#111827', panel: 'rgba(248,250,252,0.96)' },
  sepia: { background: '#efe3c5', color: '#312617', panel: 'rgba(242,231,205,0.96)' },
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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getReaderIdentity = (): ReaderIdentity => {
  const idKey = 'athos.reader.id';
  const labelKey = 'athos.reader.label';
  let id = localStorage.getItem(idKey);
  let label = localStorage.getItem(labelKey);

  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `reader-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(idKey, id);
  }

  if (!label) {
    label = `Reader ${id.slice(0, 4).toUpperCase()}`;
    localStorage.setItem(labelKey, label);
  }

  return { id, label };
};

const loadSettings = (): ReaderSettings => {
  try {
    const stored = localStorage.getItem('athos.reader.settings');
    if (!stored) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(stored) };
  } catch {
    return defaultSettings;
  }
};

const splitIntoPages = (text: string, targetSize = 2600) => {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return ['No preview content available for this book.'];

  const paragraphs = normalized.split(/\n{2,}/);
  const pages: string[] = [];
  let current = '';

  paragraphs.forEach((paragraph) => {
    const block = paragraph.trim();
    if (!block) return;

    if (current.length + block.length > targetSize && current) {
      pages.push(current.trim());
      current = '';
    }

    if (block.length > targetSize) {
      const chunks = block.match(new RegExp(`[\\s\\S]{1,${targetSize}}`, 'g')) || [];
      chunks.forEach((chunk) => {
        if (current) {
          pages.push(current.trim());
          current = '';
        }
        pages.push(chunk.trim());
      });
      return;
    }

    current += current ? `\n\n${block}` : block;
  });

  if (current.trim()) {
    pages.push(current.trim());
  }

  return pages.length ? pages : [normalized];
};

const resolveChapterPages = (
  chapters: WikiBookChapter[],
  plainText: string,
  totalPages: number,
) => {
  const safeTotal = Math.max(totalPages, 1);
  const charsPerPage = Math.max(Math.ceil((plainText.length || 1) / safeTotal), 1);

  return chapters.map((chapter) => ({
    ...chapter,
    pageNumber: chapter.pageNumber || Math.min(safeTotal, Math.max(1, Math.floor((chapter.offset || 0) / charsPerPage) + 1)),
  }));
};

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<WikiBook[]>([]);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [selectedBook, setSelectedBook] = useState<WikiBook | null>(null);
  const [bookContent, setBookContent] = useState<WikiBookContent | null>(null);
  const [annotations, setAnnotations] = useState<WikiBookAnnotation[]>([]);
  const [scope, setScope] = useState<AnnotationScope>('mine');
  const [commentDraft, setCommentDraft] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [readerLoading, setReaderLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionWarning, setSelectionWarning] = useState('');
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);
  const [readerIdentity] = useState<ReaderIdentity>(getReaderIdentity);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/wiki/books'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as WikiBook[];
      setBooks(data);
    } catch {
      setError('Could not load books from the database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnotations = async (bookId: WikiBook['id'], nextScope = scope) => {
    const response = await fetch(
      apiUrl(`/api/wiki/books/${bookId}/annotations?scope=${nextScope}&user_id=${encodeURIComponent(readerIdentity.id)}`),
    );

    if (response.ok) {
      setAnnotations((await response.json()) as WikiBookAnnotation[]);
    }
  };

  const openBook = async (book: WikiBook) => {
    setSelectedBook(book);
    setBookContent(null);
    setCurrentPage(1);
    setReaderLoading(true);
    setSelectionWarning('');
    setCommentDraft('');

    try {
      const response = await fetch(apiUrl(`/api/wiki/books/${book.id}/content`));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setBookContent((await response.json()) as WikiBookContent);
      await fetchAnnotations(book.id);
    } finally {
      setReaderLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    localStorage.setItem('athos.reader.settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!selectedBook) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedBook(null);
      }
      if (event.key === 'ArrowRight') {
        setCurrentPage((page) => Math.min(page + 1, maxPages));
      }
      if (event.key === 'ArrowLeft') {
        setCurrentPage((page) => Math.max(page - 1, 1));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return books.filter((book) => {
      const matchesSearch =
        !term ||
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.customBadgeLabel.some((l) => l.toLowerCase().includes(term)) ||
        book.fileFormat.toLowerCase().includes(term);
      const matchesDifficulty = difficultyFilter === 'all' || book.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [books, difficultyFilter, search]);

  const pages = useMemo(() => {
    if (!bookContent || bookContent.renderType === 'pdf') return [];
    return splitIntoPages(bookContent.plainText || bookContent.content);
  }, [bookContent]);

  const maxPages = bookContent?.renderType === 'pdf' ? 30 : Math.max(pages.length, 1);

  const chapters = useMemo(() => {
    if (!bookContent) return [];
    return resolveChapterPages(bookContent.chapters || [], bookContent.plainText || bookContent.content || '', maxPages);
  }, [bookContent, maxPages]);

  const currentPageText = pages[currentPage - 1] || '';
  const currentPageAnnotations = annotations.filter((annotation) => annotation.pageNumber === currentPage);
  const activeTheme = themeStyles[settings.theme];

  const updateSettings = (partial: Partial<ReaderSettings>) => {
    setSettings((current) => ({ ...current, ...partial }));
  };

  const getSelectedText = () => {
    const selectedText = window.getSelection()?.toString().trim() || '';
    return selectedText.length > 1200 ? selectedText.slice(0, 1200) : selectedText;
  };

  const addAnnotation = async (annotationType: WikiBookAnnotation['annotationType'], note = '') => {
    if (!selectedBook) return;

    const selectedText = getSelectedText();
    if ((annotationType === 'highlight' || annotationType === 'underline') && !selectedText) {
      setSelectionWarning('Select a word or phrase in the page before marking it.');
      return;
    }

    setSelectionWarning('');

    const response = await fetch(apiUrl(`/api/wiki/books/${selectedBook.id}/annotations`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: readerIdentity.id,
        userLabel: readerIdentity.label,
        annotationType,
        pageNumber: currentPage,
        selectedText,
        note,
        color: annotationType === 'underline' ? '#38bdf8' : '#fbbf24',
      }),
    });

    if (response.ok) {
      await fetchAnnotations(selectedBook.id, scope);
      setCommentDraft('');
      window.getSelection()?.removeAllRanges();
    }
  };

  const deleteAnnotation = async (annotation: WikiBookAnnotation) => {
    if (!selectedBook || !annotation.mine) return;

    const response = await fetch(
      apiUrl(`/api/wiki/books/annotations/${annotation.id}?user_id=${encodeURIComponent(readerIdentity.id)}`),
      { method: 'DELETE' },
    );

    if (response.ok) {
      await fetchAnnotations(selectedBook.id, scope);
    }
  };

  const changeScope = async (nextScope: AnnotationScope) => {
    setScope(nextScope);
    if (selectedBook) {
      await fetchAnnotations(selectedBook.id, nextScope);
    }
  };

  const renderAnnotatedText = (text: string) => {
    const markable = currentPageAnnotations
      .filter((annotation) => ['highlight', 'underline'].includes(annotation.annotationType) && annotation.selectedText)
      .sort((a, b) => b.selectedText.length - a.selectedText.length);

    if (!markable.length) {
      return <span>{text}</span>;
    }

    const ranges: Array<{ start: number; end: number; annotation: WikiBookAnnotation }> = [];
    const lowerText = text.toLowerCase();

    markable.forEach((annotation) => {
      const needle = annotation.selectedText.toLowerCase();
      const start = lowerText.indexOf(needle);
      if (start < 0) return;
      const end = start + needle.length;
      const overlaps = ranges.some((range) => start < range.end && end > range.start);
      if (!overlaps) {
        ranges.push({ start, end, annotation });
      }
    });

    ranges.sort((a, b) => a.start - b.start);

    const nodes: React.ReactNode[] = [];
    let cursor = 0;

    ranges.forEach((range) => {
      if (cursor < range.start) {
        nodes.push(text.slice(cursor, range.start));
      }

      nodes.push(
        <span
          key={`${range.annotation.id}-${range.start}`}
          style={{
            background: range.annotation.annotationType === 'highlight' ? hexToRgba(range.annotation.color, 0.35) : 'transparent',
            borderBottom: range.annotation.annotationType === 'underline' ? `2px solid ${range.annotation.color}` : 'none',
          }}
        >
          {text.slice(range.start, range.end)}
        </span>,
      );
      cursor = range.end;
    });

    if (cursor < text.length) {
      nodes.push(text.slice(cursor));
    }

    return <>{nodes}</>;
  };

  const openPopup = () => {
    if (!selectedBook || !bookContent) return;

    const popup = window.open('', 'athos-ereading-popup', 'width=1180,height=820');
    if (!popup) return;

    const body =
      bookContent.renderType === 'pdf'
        ? `<iframe src="${apiUrl(selectedBook.fileUrl)}#page=${currentPage}" style="width:100%;height:100%;border:0"></iframe>`
        : `<main>${escapeHtml(currentPageText).replace(/\n/g, '<br />')}</main>`;

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(selectedBook.title)}</title>
          <style>
            body {
              margin: 0;
              background: ${activeTheme.background};
              color: ${activeTheme.color};
              font-family: ${settings.fontFamily}, sans-serif;
              font-size: ${settings.fontSize}px;
              letter-spacing: ${settings.letterSpacing}px;
              line-height: ${settings.lineHeight};
              filter: brightness(${settings.brightness}%);
            }
            header {
              padding: 14px 20px;
              border-bottom: 1px solid rgba(127,127,127,.25);
              font: 600 14px sans-serif;
            }
            main {
              max-width: 900px;
              margin: 0 auto;
              padding: 38px;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <header>${escapeHtml(selectedBook.title)} · page ${currentPage}</header>
          ${body}
        </body>
      </html>
    `);
    popup.document.close();
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 max-w-6xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="section-label mb-4">
          <BookOpen className="w-4 h-4" />
          <span>LIBRARY</span>
        </div>
        <h1 className="text-4xl font-black text-white mb-2">Books &amp; E-Reading</h1>
        <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
          Books loaded from the database with local files, automatic size sync, comments, bookmarks, highlights, and reading controls.
        </p>
      </motion.div>

      <div className="flex flex-col gap-3 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by book, author, format, or topic..."
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
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          Loading books
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
          <button onClick={fetchBooks} className="btn-secondary px-4 py-2 text-xs">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((book, index) => (
            <motion.button
              key={book.id}
              type="button"
              onClick={() => openBook(book)}
              className="project-card p-5 text-left group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: hexToRgba(book.customBadgeColor, 0.1),
                    border: `1px solid ${hexToRgba(book.customBadgeColor, 0.28)}`,
                  }}
                >
                  <FileText className="w-7 h-7" style={{ color: book.customBadgeColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm leading-tight mb-2 group-hover:text-emerald-300 transition-colors">
                    {book.title}
                  </h3>
                  <p className="font-mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    {book.author} · {book.sizeLabel} · {book.fileFormat.toUpperCase()}
                  </p>

                    <div className="flex flex-wrap gap-2">
                      <span className={`font-mono text-[10px] px-2 py-1 rounded border ${diffClass[book.difficulty]}`}>
                        {book.difficulty}
                      </span>
                      {book.customBadgeLabel.map((label, i) => (
                        <span
                          key={i}
                          className="font-mono text-[10px] px-2 py-1 rounded border"
                          style={{
                            color: book.customBadgeColor,
                            background: hexToRgba(book.customBadgeColor, 0.1),
                            borderColor: hexToRgba(book.customBadgeColor, 0.28),
                          }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>

                  <div className="mt-4 font-mono text-xs text-emerald-300 inline-flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    Open E-Reading
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>No books found</p>
        </div>
      )}

      <AnimatePresence>
        {selectedBook && (
          <motion.div
            className="fixed inset-0 z-[1000] p-2 sm:p-4"
            style={{ background: 'rgba(0,0,0,0.82)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-full w-full overflow-hidden grid grid-rows-[auto_1fr]"
              style={{ background: '#05060a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16 }}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
            >
              <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/8">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${diffClass[selectedBook.difficulty]}`}>
                      {selectedBook.difficulty}
                    </span>
                    {selectedBook.customBadgeLabel.map((label, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] px-2 py-0.5 rounded border"
                        style={{
                          color: selectedBook.customBadgeColor,
                          background: hexToRgba(selectedBook.customBadgeColor, 0.1),
                          borderColor: hexToRgba(selectedBook.customBadgeColor, 0.28),
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-bold text-white text-sm sm:text-base truncate">{selectedBook.title}</h2>
                  <p className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {selectedBook.author} · {selectedBook.sizeLabel} · page {currentPage}/{maxPages}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={apiUrl(selectedBook.downloadUrl)}
                    download
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Download book"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={openPopup}
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Open reader popup"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Close reader"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </header>

              <div className="grid lg:grid-cols-[260px_1fr_320px] min-h-0">
                <aside className="hidden lg:flex flex-col min-h-0 border-r border-white/8" style={{ background: 'rgba(5,6,10,0.88)' }}>
                  <div className="p-4 border-b border-white/8">
                    <div className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--neon-green)' }}>
                      Navigation
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    <section>
                      <h3 className="font-mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Chapters</h3>
                      <div className="space-y-1">
                        {chapters.map((chapter, index) => (
                          <button
                            key={`${chapter.title}-${index}`}
                            type="button"
                            onClick={() => setCurrentPage(chapter.pageNumber || 1)}
                            className="w-full text-left font-mono text-xs px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {chapter.title}
                          </button>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Pages</h3>
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: maxPages }).map((_, index) => {
                          const page = index + 1;
                          return (
                            <button
                              key={page}
                              type="button"
                              onClick={() => setCurrentPage(page)}
                              className="font-mono text-xs h-9 rounded-lg border transition-all"
                              style={{
                                color: currentPage === page ? '#00ff88' : 'var(--text-muted)',
                                borderColor: currentPage === page ? 'rgba(0,255,136,0.35)' : 'rgba(255,255,255,0.08)',
                                background: currentPage === page ? 'rgba(0,255,136,0.08)' : 'transparent',
                              }}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section>
                      <h3 className="font-mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Bookmarks</h3>
                      <div className="space-y-2">
                        {annotations.filter((annotation) => annotation.annotationType === 'bookmark').map((annotation) => (
                          <button
                            key={annotation.id}
                            type="button"
                            onClick={() => setCurrentPage(annotation.pageNumber)}
                            className="w-full text-left px-3 py-2 rounded-lg border border-white/8 hover:bg-white/5"
                          >
                            <div className="font-mono text-xs text-white">Page {annotation.pageNumber}</div>
                            <div className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {annotation.mine ? 'you' : annotation.userLabel}
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                </aside>

                <main className="min-h-0 flex flex-col" style={{ background: activeTheme.background }}>
                  <div
                    className="flex-1 overflow-y-auto"
                    style={{
                      color: activeTheme.color,
                      filter: `brightness(${settings.brightness}%)`,
                    }}
                  >
                    {readerLoading && (
                      <div className="h-full flex items-center justify-center font-mono text-sm">
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                        Loading E-Reading
                      </div>
                    )}

                    {!readerLoading && bookContent?.renderType === 'pdf' && (
                      <iframe
                        title={selectedBook.title}
                        src={`${apiUrl(selectedBook.fileUrl)}#page=${currentPage}`}
                        className="w-full h-full min-h-[70vh] border-0"
                      />
                    )}

                    {!readerLoading && bookContent?.renderType !== 'pdf' && (
                      <article
                        className="max-w-3xl mx-auto px-6 sm:px-10 py-10 min-h-full"
                        style={{
                          fontFamily: `${settings.fontFamily}, sans-serif`,
                          fontSize: settings.fontSize,
                          letterSpacing: settings.letterSpacing,
                          lineHeight: settings.lineHeight,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {renderAnnotatedText(currentPageText)}
                      </article>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/8" style={{ background: 'rgba(5,6,10,0.92)' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      className="btn-secondary px-3 py-2 text-xs inline-flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Prev
                    </button>
                    <div className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      Page {currentPage} of {maxPages}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((page) => Math.min(maxPages, page + 1))}
                      className="btn-secondary px-3 py-2 text-xs inline-flex items-center gap-2"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </main>

                <aside className="hidden xl:flex flex-col min-h-0 border-l border-white/8" style={{ background: activeTheme.panel }}>
                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    <section>
                      <h3 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--neon-green)' }}>
                        Reading
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {(['dark', 'light', 'sepia'] as ReaderTheme[]).map((theme) => (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => updateSettings({ theme })}
                            className="font-mono text-[10px] px-2 py-2 rounded-lg border capitalize inline-flex items-center justify-center gap-1"
                            style={{
                              color: settings.theme === theme ? '#00ff88' : 'var(--text-muted)',
                              borderColor: settings.theme === theme ? 'rgba(0,255,136,0.35)' : 'rgba(127,127,127,0.22)',
                            }}
                          >
                            {theme === 'dark' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                            {theme}
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <label className="font-mono text-xs flex items-center justify-between gap-3" style={{ color: 'var(--text-muted)' }}>
                        Brightness
                        <span>{settings.brightness}%</span>
                      </label>
                      <input
                        type="range"
                        min={55}
                        max={130}
                        value={settings.brightness}
                        onChange={(event) => updateSettings({ brightness: Number(event.target.value) })}
                        className="w-full"
                      />

                      <label className="font-mono text-xs flex items-center justify-between gap-3" style={{ color: 'var(--text-muted)' }}>
                        Font size
                        <span>{settings.fontSize}px</span>
                      </label>
                      <input
                        type="range"
                        min={14}
                        max={28}
                        value={settings.fontSize}
                        onChange={(event) => updateSettings({ fontSize: Number(event.target.value) })}
                        className="w-full"
                      />

                      <label className="font-mono text-xs flex items-center justify-between gap-3" style={{ color: 'var(--text-muted)' }}>
                        Letter spacing
                        <span>{settings.letterSpacing}px</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={4}
                        step={0.2}
                        value={settings.letterSpacing}
                        onChange={(event) => updateSettings({ letterSpacing: Number(event.target.value) })}
                        className="w-full"
                      />

                      <label className="font-mono text-xs flex items-center justify-between gap-3" style={{ color: 'var(--text-muted)' }}>
                        Line height
                        <span>{settings.lineHeight.toFixed(2)}</span>
                      </label>
                      <input
                        type="range"
                        min={1.2}
                        max={2.4}
                        step={0.05}
                        value={settings.lineHeight}
                        onChange={(event) => updateSettings({ lineHeight: Number(event.target.value) })}
                        className="w-full"
                      />

                      <label className="font-mono text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        <Type className="w-3.5 h-3.5" />
                        Font family
                      </label>
                      <select
                        value={settings.fontFamily}
                        onChange={(event) => updateSettings({ fontFamily: event.target.value })}
                        className="search-input text-xs"
                      >
                        {readerFonts.map((font) => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </section>

                    <section>
                      <h3 className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--neon-green)' }}>
                        Marking
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => addAnnotation('highlight')} className="btn-secondary px-3 py-2 text-xs inline-flex items-center gap-2">
                          <PenLine className="w-4 h-4" />
                          Highlight
                        </button>
                        <button type="button" onClick={() => addAnnotation('underline')} className="btn-secondary px-3 py-2 text-xs inline-flex items-center gap-2">
                          <Underline className="w-4 h-4" />
                          Underline
                        </button>
                        <button type="button" onClick={() => addAnnotation('bookmark')} className="btn-secondary px-3 py-2 text-xs inline-flex items-center gap-2">
                          <Bookmark className="w-4 h-4" />
                          Page
                        </button>
                      </div>

                      {selectionWarning && (
                        <p className="font-mono text-[11px] mt-2 text-yellow-300">{selectionWarning}</p>
                      )}

                      <textarea
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        placeholder="Write a comment for this page or selected text..."
                        className="search-input mt-3 min-h-24 resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => addAnnotation('comment', commentDraft)}
                        className="btn-primary w-full mt-2 px-3 py-2 text-xs inline-flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Save comment
                      </button>
                    </section>

                    <section>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--neon-green)' }}>
                          Notes
                        </h3>
                        <div className="flex gap-1">
                          {scopes.map((nextScope) => (
                            <button
                              key={nextScope}
                              type="button"
                              onClick={() => changeScope(nextScope)}
                              className="font-mono text-[10px] px-2 py-1 rounded border inline-flex items-center gap-1"
                              style={{
                                color: scope === nextScope ? '#00ff88' : 'var(--text-muted)',
                                borderColor: scope === nextScope ? 'rgba(0,255,136,0.35)' : 'rgba(127,127,127,0.22)',
                              }}
                            >
                              {nextScope === 'mine' ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                              {nextScope}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {annotations.map((annotation) => (
                          <div key={annotation.id} className="p-3 rounded-lg border border-white/8" style={{ background: 'rgba(255,255,255,0.035)' }}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <button
                                type="button"
                                onClick={() => setCurrentPage(annotation.pageNumber)}
                                className="font-mono text-[11px] text-emerald-300"
                              >
                                Page {annotation.pageNumber} · {annotation.annotationType}
                              </button>
                              {annotation.mine && (
                                <button
                                  type="button"
                                  onClick={() => deleteAnnotation(annotation)}
                                  className="font-mono text-[10px] text-white/40 hover:text-red-300"
                                >
                                  delete
                                </button>
                              )}
                            </div>
                            <div className="font-mono text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>
                              {annotation.mine ? 'you' : annotation.userLabel}
                            </div>
                            {annotation.selectedText && (
                              <p className="font-mono text-[11px] mb-2" style={{ color: activeTheme.color }}>
                                "{annotation.selectedText}"
                              </p>
                            )}
                            {annotation.note && (
                              <p className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                {annotation.note}
                              </p>
                            )}
                          </div>
                        ))}

                        {annotations.length === 0 && (
                          <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                            No notes in this view yet.
                          </p>
                        )}
                      </div>
                    </section>
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

export default BooksPage;
