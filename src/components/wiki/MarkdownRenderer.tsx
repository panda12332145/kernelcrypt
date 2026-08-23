import React, { useEffect, useRef, useState } from 'react';
import { Download, Maximize2, Minus, Plus, X } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import ArcPdfEmbed from './ArcPdfEmbed';
import DOMPurify from 'dompurify';

interface Props {
  html: string;
}

interface ImageModalState {
  src: string;
  name: string;
  alt: string;
  width?: number;
  height?: number;
}

// Display-friendly language names
const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JavaScript', javascript: 'JavaScript',
  ts: 'TypeScript', typescript: 'TypeScript',
  py: 'Python', python: 'Python',
  c: 'C', cpp: 'C++', 'c++': 'C++',
  cs: 'C#', csharp: 'C#',
  java: 'Java',
  rs: 'Rust', rust: 'Rust',
  go: 'Go', golang: 'Go',
  rb: 'Ruby', ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  scala: 'Scala',
  lua: 'Lua',
  r: 'R',
  matlab: 'MATLAB',
  perl: 'Perl',
  sh: 'Shell', bash: 'Bash', shell: 'Shell', zsh: 'Zsh',
  ps1: 'PowerShell', powershell: 'PowerShell',
  sql: 'SQL', mysql: 'MySQL', postgresql: 'PostgreSQL', sqlite: 'SQLite',
  html: 'HTML', xml: 'XML',
  css: 'CSS', scss: 'SCSS', sass: 'Sass', less: 'Less',
  json: 'JSON', yaml: 'YAML', yml: 'YAML', toml: 'TOML',
  md: 'Markdown', markdown: 'Markdown',
  dockerfile: 'Dockerfile', docker: 'Docker',
  makefile: 'Makefile', make: 'Makefile',
  asm: 'Assembly', assembly: 'Assembly', nasm: 'Assembly', x86asm: 'x86 ASM', x64: 'x64 ASM',
  zig: 'Zig', nim: 'Nim', haskell: 'Haskell', hs: 'Haskell',
  elixir: 'Elixir', erlang: 'Erlang',
  clojure: 'Clojure', lisp: 'Lisp', scheme: 'Scheme',
  dart: 'Dart', groovy: 'Groovy',
  objc: 'Objective-C', 'objective-c': 'Objective-C',
  vb: 'Visual Basic', vbnet: 'VB.NET',
  cobol: 'COBOL', fortran: 'Fortran',
  prolog: 'Prolog',
  julia: 'Julia',
  graphql: 'GraphQL', gql: 'GraphQL',
  protobuf: 'Protobuf', proto: 'Protobuf',
  nginx: 'Nginx', apache: 'Apache',
  ini: 'INI', env: '.env', dotenv: '.env',
  text: 'Text', plaintext: 'Plain Text', txt: 'Text',
};

function getLanguageLabel(lang: string): string {
  const lower = lang.toLowerCase();
  return LANGUAGE_LABELS[lower] || lang.toUpperCase();
}

const MarkdownRenderer: React.FC<Props> = ({ html }) => {
  const [modal, setModal] = useState<ImageModalState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Enrich code blocks: inject language header + copy button
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const blocks = container.querySelectorAll<HTMLPreElement>('pre.hljs');

    blocks.forEach((pre) => {
      // Skip if already enhanced
      if (pre.parentElement?.classList.contains('wiki-code-block')) return;

      const lang = pre.getAttribute('data-language') || 'text';
      const label = getLanguageLabel(lang);
      const code = pre.querySelector('code');
      const rawText = code?.innerText ?? pre.innerText;

      // Outer wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'wiki-code-block';

      // Header bar
      const header = document.createElement('div');
      header.className = 'wiki-code-header';

      const langBadge = document.createElement('span');
      langBadge.className = 'wiki-code-lang';
      langBadge.textContent = label;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'wiki-code-copy';
      copyBtn.type = 'button';
      copyBtn.setAttribute('aria-label', 'Copy code');
      copyBtn.innerHTML = `
        <svg class="wiki-code-copy-icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
        <span class="wiki-code-copy-label">Copy</span>
      `;

      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(rawText);
          copyBtn.innerHTML = `
            <svg class="wiki-code-copy-icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span class="wiki-code-copy-label">Copied!</span>
          `;
          copyBtn.classList.add('wiki-code-copy--success');
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg class="wiki-code-copy-icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span class="wiki-code-copy-label">Copy</span>
            `;
            copyBtn.classList.remove('wiki-code-copy--success');
          }, 2000);
        } catch {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = rawText;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
      });

      header.appendChild(langBadge);
      header.appendChild(copyBtn);

      // Insert wrapper before pre, then move pre inside it
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });
  }, [html]);

  useEffect(() => {
    if (!modal) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal]);

  // Mount ArcPdfEmbed on dynamically generated .wiki-embed-pdf-react divs
  useEffect(() => {
    console.log('[MarkdownRenderer] PDF mount effect triggered', { htmlLength: html.length, hasContainer: !!contentRef.current });
    
    const container = contentRef.current;
    if (!container) {
      console.warn('[MarkdownRenderer] Container ref is null, bailing out');
      return;
    }

    // Immediate first check
    const pdfEmbedsImmediate = container.querySelectorAll<HTMLDivElement>('.wiki-embed-pdf-react');
    console.log(`[MarkdownRenderer] Immediate check found ${pdfEmbedsImmediate.length} PDF divs`);
    if (pdfEmbedsImmediate.length > 0) {
      console.log('[MarkdownRenderer] Mounting immediately (no delay needed)');
      pdfEmbedsImmediate.forEach((el, idx) => {
        console.log(`[MarkdownRenderer] PDF div ${idx}:`, {
          hasDataUrl: !!el.dataset.url,
          hasDataName: !!el.dataset.name,
          innerHTML: el.innerHTML.substring(0, 50),
        });
      });
    }

    // Use a small delay to ensure DOM is fully ready after dangerouslySetInnerHTML
    const timer = setTimeout(() => {
      const pdfEmbeds = container.querySelectorAll<HTMLDivElement>('.wiki-embed-pdf-react');
      
      console.log(`[MarkdownRenderer] After ${50}ms delay: found ${pdfEmbeds.length} PDF embeds`);
      
      if (pdfEmbeds.length === 0) {
        console.debug('[MarkdownRenderer] No PDF embeds found after delay');
        return;
      }

      pdfEmbeds.forEach((el, idx) => {
        if (el.hasAttribute('data-mounted')) {
          console.debug(`[MarkdownRenderer] PDF embed ${idx} already mounted`);
          return;
        }

        el.setAttribute('data-mounted', 'true');
        
        let url = el.dataset.url || '';
        let name = el.dataset.name || 'Document';
        
        if (!url) {
          console.warn('[MarkdownRenderer] PDF embed found but missing data-url');
          return;
        }
        
        // Clean up the name if it's a URL
        if (name.startsWith('http')) {
          name = name.split('/').pop()?.split('?')[0]?.replace(/-/g, ' ') || 'Document';
          try {
            name = decodeURIComponent(name);
          } catch {
            // Keep the original name if decode fails
          }
          name = name.replace(/\.(pdf|PDF)$/, '').trim();
        }
        
        console.log(`[MarkdownRenderer] Mounting PDF ${idx}: name="${name}" url="${url.substring(0, 60)}..."`);
        
        const root = createRoot(el);
        root.render(
          <ArcPdfEmbed 
            url={url} 
            name={name || 'PDF Document'} 
            height="800px"
            showMaximizeButton={true}
          />
        );
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [html]);

  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('a')) return;

    const image = target.closest('img') as HTMLImageElement | null;

    if (!image || !image.closest('.wiki-rendered-html')) return;

    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setModal({
      src: image.dataset.original || image.src,
      name: image.dataset.name || image.title || image.alt || image.src.split('/').pop() || 'image',
      alt: image.alt || '',
      width: image.naturalWidth || undefined,
      height: image.naturalHeight || undefined,
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    setOffset({
      x: dragStart.current.ox + event.clientX - dragStart.current.x,
      y: dragStart.current.oy + event.clientY - dragStart.current.y,
    });
  };

  const openFullscreen = async () => {
    const element = document.getElementById('wiki-image-modal');
    if (element?.requestFullscreen) {
      await element.requestFullscreen();
    }
  };

  return (
    <>
      <div
        ref={contentRef}
        className="markdown-body wiki-rendered-html"
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ 
          __html: DOMPurify.sanitize(html, { 
            ADD_TAGS: ['iframe'], 
            ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'data-url', 'data-name', 'data-mounted'] 
          }) 
        }}
      />

      {modal && (
        <div
          id="wiki-image-modal"
          className="fixed inset-0 z-[1200] flex flex-col"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
          onPointerMove={handlePointerMove}
          onPointerUp={() => {
            dragStart.current = null;
          }}
        >
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(5,6,10,0.85)' }}
          >
            <div className="min-w-0">
              <div className="font-sans text-sm font-semibold text-white truncate">{modal.name}</div>
              <div className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {modal.width && modal.height ? `${modal.width} x ${modal.height}px` : 'resolution pending'}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-white/5"
                onClick={() => setZoom((value) => Math.max(0.5, value - 0.15))}
                aria-label="Zoom out"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-24"
                aria-label="Image zoom"
              />
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-white/5"
                onClick={() => setZoom((value) => Math.min(3, value + 0.15))}
                aria-label="Zoom in"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-white/5"
                onClick={openFullscreen}
                aria-label="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <a
                className="p-2 rounded-lg hover:bg-white/5"
                href={modal.src}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open original"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-white/5"
                onClick={() => setModal(null)}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
            onPointerDown={(event) => {
              dragStart.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
            }}
          >
            <img
              src={modal.src}
              alt={modal.alt}
              className="max-w-[92vw] max-h-[78vh] select-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transition: dragStart.current ? 'none' : 'transform 0.12s ease',
              }}
              draggable={false}
            />
          </div>

          <div
            className="px-4 py-3 font-mono text-[11px] break-all"
            style={{ color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            {modal.src}
          </div>
        </div>
      )}
    </>
  );
};

export default MarkdownRenderer;
