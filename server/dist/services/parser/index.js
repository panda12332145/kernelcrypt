/**
 * Advanced Markdown parser for the GitHub driven wiki.
 *
 * Markdown and embedded HTML are supported. Raw HTML is sanitized with a
 * GitHub-like allowlist plus controlled inline CSS so wiki articles can be
 * customized without exposing script/event-handler injection.
 */
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import emoji from 'markdown-it-emoji';
import sanitizeHtml from 'sanitize-html';
import { config } from '../../config/index.js';
import { basename, calculateMediaExtraSeconds, calculateReadingTime, countWords, createExcerpt, createSlug, dirname, escapeHtml, extractTitleFromMarkdown, joinRepoPath, normalizeDifficulty, withoutExtension, } from '../../utils/index.js';
import { logger } from '../../utils/logger.js';
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg']);
const videoExtensions = new Set(['.mp4', '.webm', '.mov']);
const pdfExtensions = new Set(['.pdf']);
const languageAliases = {
    asm: 'x86asm',
    assembly: 'x86asm',
    nasm: 'x86asm',
    x64: 'x86asm',
    x86_64: 'x86asm',
    shell: 'bash',
    sh: 'bash',
    py: 'python',
    ts: 'typescript',
    js: 'javascript',
};
export class MarkdownParser {
    constructor() {
        this.markdown = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true,
            breaks: false,
        })
            .use(emoji);
        this.installRenderers();
    }
    parse(content, options = {}) {
        try {
            const { data: frontmatter, content: markdown } = matter(content || '');
            const normalizedMarkdown = markdown.trim()
                ? markdown
                : this.createPlaceholderMarkdown(options.sourcePath);
            const autoTitle = extractTitleFromMarkdown(normalizedMarkdown);
            const title = String(frontmatter.title || autoTitle || this.titleFromPath(options.sourcePath));
            const difficulty = normalizeDifficulty(frontmatter.difficulty);
            const starred = this.booleanFrom(this.firstDefined(frontmatter.starred, frontmatter.star, frontmatter.favorite));
            const featured = this.booleanFrom(frontmatter.featured) || starred;
            const starCount = this.numberFrom(this.firstDefined(frontmatter.starCount, frontmatter.stars), starred ? 1 : 0);
            const tags = this.normalizeTags(frontmatter.tags);
            const coverImage = frontmatter.coverImage
                ? this.resolveAssetUrl(String(frontmatter.coverImage), options.sourcePath)
                : undefined;
            const env = {
                sourcePath: options.sourcePath,
                anchors: new Map(),
            };
            let renderedHtml = this.markdown.render(normalizedMarkdown, env);
            renderedHtml = this.postProcessHtml(renderedHtml, options);
            renderedHtml = this.sanitizeRenderedHtml(renderedHtml, options);
            renderedHtml = this.cleanupRenderedHtml(renderedHtml);
            const mediaAssets = this.extractMedia(normalizedMarkdown, options);
            const mediaCount = this.countMedia(mediaAssets);
            const extraSeconds = calculateMediaExtraSeconds(mediaCount);
            const wordCount = countWords(normalizedMarkdown);
            const { minutes, seconds } = calculateReadingTime(wordCount, difficulty, extraSeconds);
            return {
                frontmatter,
                content: normalizedMarkdown,
                renderedHtml,
                title,
                seoTitle: String(frontmatter.seoTitle || title),
                description: frontmatter.description,
                excerpt: frontmatter.excerpt || createExcerpt(normalizedMarkdown),
                difficulty,
                featured,
                starred,
                starCount,
                tags,
                coverImage,
                wordCount,
                mediaCount: mediaAssets.length,
                extraSeconds,
                readingTimeMinutes: minutes,
                readingTimeSeconds: seconds,
                toc: this.generateTableOfContents(normalizedMarkdown),
                mediaAssets,
            };
        }
        catch (error) {
            logger.error('Erro ao fazer parse do markdown', error);
            throw error;
        }
    }
    extractExcerpt(markdown, length = 160) {
        return createExcerpt(markdown, length);
    }
    validate(content) {
        const errors = [];
        if (!content || content.trim().length === 0) {
            errors.push('Conteudo vazio');
        }
        if (!extractTitleFromMarkdown(content || '')) {
            errors.push('Sem titulo H1 (# Titulo)');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    generateTableOfContents(markdown) {
        const headings = markdown.match(/^#{1,4}\s+(.+)$/gm) || [];
        const seen = new Map();
        return headings
            .map((heading) => {
            const match = heading.match(/^(#{1,4})\s+(.+)$/);
            if (!match)
                return null;
            const title = match[2].replace(/[#*`_~]/g, '').trim();
            const baseAnchor = createSlug(title);
            const count = seen.get(baseAnchor) || 0;
            seen.set(baseAnchor, count + 1);
            return {
                level: match[1].length,
                title,
                anchor: count ? `${baseAnchor}-${count + 1}` : baseAnchor,
            };
        })
            .filter(Boolean);
    }
    installRenderers() {
        const defaultHeadingOpen = this.markdown.renderer.rules.heading_open ||
            ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
        this.markdown.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
            const next = tokens[idx + 1];
            const text = next?.type === 'inline' ? next.content : '';
            const anchors = env.anchors;
            const baseAnchor = createSlug(text);
            const count = anchors.get(baseAnchor) || 0;
            anchors.set(baseAnchor, count + 1);
            tokens[idx].attrSet('id', count ? `${baseAnchor}-${count + 1}` : baseAnchor);
            return defaultHeadingOpen(tokens, idx, options, env, self);
        };
        this.markdown.renderer.rules.image = (tokens, idx, _options, env) => {
            const token = tokens[idx];
            const src = this.resolveAssetUrl(token.attrGet('src') || '', env.sourcePath);
            const alt = token.content || token.attrGet('alt') || '';
            const title = token.attrGet('title') || alt || basename(src);
            const type = this.mediaTypeFromUrl(src);
            const className = type === 'gif' ? 'wiki-media-image wiki-media-gif' : 'wiki-media-image';
            const safeSrc = escapeHtml(src);
            const safeAlt = escapeHtml(alt);
            const safeTitle = escapeHtml(title);
            const kind = type || 'image';
            if (this.isBadgeImage(src, alt)) {
                return `<img src="${safeSrc}" alt="${safeAlt}" title="${safeTitle}" class="${className} wiki-badge-image" loading="lazy" decoding="async" data-name="${safeTitle}" data-original="${safeSrc}">`;
            }
            return [
                `<figure class="wiki-image-embed" data-kind="${kind}">`,
                '<button type="button" class="wiki-image-frame" data-wiki-image-trigger="true" aria-label="Visualizar imagem">',
                `<img src="${safeSrc}" alt="${safeAlt}" title="${safeTitle}" class="${className}" loading="lazy" decoding="async" data-name="${safeTitle}" data-original="${safeSrc}">`,
                '</button>',
                '<figcaption class="wiki-image-caption">',
                `<span>${safeTitle}</span>`,
                `<a href="${safeSrc}" target="_blank" rel="noopener noreferrer">original</a>`,
                '</figcaption>',
                '</figure>',
            ].join('');
        };
        const defaultLinkOpen = this.markdown.renderer.rules.link_open ||
            ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
        this.markdown.renderer.rules.link_open = (tokens, idx, options, env, self) => {
            const href = tokens[idx].attrGet('href');
            if (!href)
                return defaultLinkOpen(tokens, idx, options, env, self);
            const resolved = this.resolveLinkUrl(href, env.sourcePath);
            tokens[idx].attrSet('href', resolved);
            tokens[idx].attrSet('rel', 'noopener noreferrer');
            if (resolved.startsWith('http')) {
                tokens[idx].attrSet('target', '_blank');
            }
            return defaultLinkOpen(tokens, idx, options, env, self);
        };
        const defaultFence = this.markdown.renderer.rules.fence ||
            ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
        this.markdown.renderer.rules.fence = (tokens, idx, _options, _env, _self) => {
            const token = tokens[idx];
            const rawLang = (token.info || '').trim().split(/\s+/)[0].toLowerCase();
            if (rawLang === 'mermaid') {
                const code = escapeHtml(token.content);
                return `<div class="wiki-mermaid"><pre class="mermaid">${code}</pre></div>`;
            }
            const displayLang = rawLang || 'text';
            const highlighted = this.highlightCode(token.content, rawLang);
            // Inject data-language so the frontend can display the language label
            return highlighted.replace(/^<pre class="hljs">/, `<pre class="hljs" data-language="${escapeHtml(displayLang)}">`);
        };
    }
    highlightCode(code, rawLanguage) {
        const language = this.normalizeCodeLanguage(rawLanguage);
        if (language && hljs.getLanguage(language)) {
            try {
                return `<pre class="hljs"><code>${hljs.highlight(code, { language, ignoreIllegals: true }).value}</code></pre>`;
            }
            catch {
                return `<pre class="hljs"><code>${escapeHtml(code)}</code></pre>`;
            }
        }
        try {
            return `<pre class="hljs"><code>${hljs.highlightAuto(code).value}</code></pre>`;
        }
        catch {
            return `<pre class="hljs"><code>${escapeHtml(code)}</code></pre>`;
        }
    }
    normalizeCodeLanguage(rawLanguage) {
        const language = rawLanguage.trim().split(/\s+/)[0].toLowerCase();
        return languageAliases[language] || language;
    }
    sanitizeRenderedHtml(html, options) {
        return sanitizeHtml(html, {
            allowedTags: [
                ...sanitizeHtml.defaults.allowedTags,
                'article',
                'aside',
                'button',
                'canvas',
                'center',
                'details',
                'figcaption',
                'figure',
                'footer',
                'header',
                'iframe',
                'img',
                'input',
                'kbd',
                'main',
                'mark',
                'nav',
                'section',
                'source',
                'span',
                'summary',
                'sup',
                'sub',
                'video',
            ],
            allowedAttributes: {
                '*': [
                    'align',
                    'aria-label',
                    'aria-hidden',
                    'class',
                    'dir',
                    'height',
                    'id',
                    'lang',
                    'style',
                    'title',
                    'width',
                    'data-kind',
                    'data-language',
                    'data-name',
                    'data-original',
                    'data-url',
                ],
                a: ['href', 'name', 'target', 'rel', 'title', 'class', 'style'],
                button: ['type', 'class', 'style', 'title', 'aria-label', 'data-wiki-image-trigger'],
                img: [
                    'src',
                    'srcset',
                    'sizes',
                    'alt',
                    'title',
                    'class',
                    'style',
                    'width',
                    'height',
                    'loading',
                    'decoding',
                    'data-name',
                    'data-original',
                ],
                iframe: [
                    'src',
                    'title',
                    'class',
                    'style',
                    'width',
                    'height',
                    'loading',
                    'allow',
                    'allowfullscreen',
                    'frameborder',
                ],
                input: ['type', 'checked', 'disabled', 'class', 'style', 'aria-label'],
                video: ['src', 'controls', 'preload', 'poster', 'class', 'style', 'width', 'height'],
                source: ['src', 'type'],
            },
            allowedSchemes: ['http', 'https', 'mailto'],
            allowedSchemesByTag: {
                img: ['http', 'https', 'data'],
                iframe: ['http', 'https'],
                video: ['http', 'https'],
                source: ['http', 'https'],
            },
            allowedIframeHostnames: [
                'www.youtube.com',
                'youtube.com',
                'www.youtube-nocookie.com',
                'youtube-nocookie.com',
                'raw.githubusercontent.com',
                'github.com',
                // PDF.js viewer — kept as fallback if a raw iframe bypasses processRawPdfIframes
                'mozilla.github.io',
            ],
            allowedStyles: {
                '*': {
                    color: [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(/, /^rgba\(/, /^hsl\(/, /^hsla\(/, /^[a-zA-Z]+$/],
                    'background-color': [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(/, /^rgba\(/, /^hsl\(/, /^hsla\(/, /^[a-zA-Z]+$/],
                    background: [
                        /^#(?:[0-9a-fA-F]{3}){1,2}$/,
                        /^rgb\(/,
                        /^rgba\(/,
                        /^hsl\(/,
                        /^hsla\(/,
                        /^linear-gradient\(/,
                        /^[a-zA-Z]+$/,
                    ],
                    'border-color': [/^#(?:[0-9a-fA-F]{3}){1,2}$/, /^rgb\(/, /^rgba\(/, /^hsl\(/, /^hsla\(/, /^[a-zA-Z]+$/],
                    border: [/^[^;{}()]+$/],
                    'border-left': [/^[^;{}()]+$/],
                    'border-radius': [/^\d+(?:\.\d+)?(?:px|rem|em|%)$/],
                    display: [/^(block|inline|inline-block|flex|inline-flex|grid|none)$/],
                    'font-size': [/^\d+(?:\.\d+)?(?:px|rem|em|%)$/],
                    'font-weight': [/^(normal|bold|bolder|lighter|[1-9]00)$/],
                    'font-family': [/^[a-zA-Z0-9\s"',.-]+$/],
                    'letter-spacing': [/^-?\d+(?:\.\d+)?(?:px|rem|em)$/],
                    'line-height': [/^\d+(?:\.\d+)?(?:px|rem|em|%)?$/],
                    margin: [/^[0-9.\s-]+(?:px|rem|em|%)?(?:\s+[0-9.\s-]+(?:px|rem|em|%)?)*$/],
                    'margin-top': [/^-?\d+(?:\.\d+)?(?:px|rem|em|%)$/],
                    'margin-right': [/^-?\d+(?:\.\d+)?(?:px|rem|em|%)$/],
                    'margin-bottom': [/^-?\d+(?:\.\d+)?(?:px|rem|em|%)$/],
                    'margin-left': [/^-?\d+(?:\.\d+)?(?:px|rem|em|%)$/],
                    padding: [/^[0-9.\s]+(?:px|rem|em|%)?(?:\s+[0-9.\s]+(?:px|rem|em|%)?)*$/],
                    'padding-top': [/^\d+(?:\.\d+)?(?:px|rem|em|%)$/],
                    'padding-right': [/^\d+(?:\.\d+)?(?:px|rem|em|%)$/],
                    'padding-bottom': [/^\d+(?:\.\d+)?(?:px|rem|em|%)$/],
                    'padding-left': [/^\d+(?:\.\d+)?(?:px|rem|em|%)$/],
                    'text-align': [/^(left|right|center|justify)$/],
                    'text-decoration': [/^[a-zA-Z\s-]+$/],
                    'text-shadow': [/^[0-9a-zA-Z#(),.\s-]+$/],
                    'box-shadow': [/^[0-9a-zA-Z#(),.\s-]+$/],
                    opacity: [/^(0|1|0?\.\d+)$/],
                    width: [/^(auto|\d+(?:\.\d+)?(?:px|rem|em|%|vw))$/],
                    'max-width': [/^(none|\d+(?:\.\d+)?(?:px|rem|em|%|vw))$/],
                    height: [/^(auto|\d+(?:\.\d+)?(?:px|rem|em|%|vh))$/],
                    'max-height': [/^(none|\d+(?:\.\d+)?(?:px|rem|em|%|vh))$/],
                },
            },
            transformTags: {
                a: (tagName, attribs) => {
                    const href = attribs.href ? this.resolveLinkUrl(attribs.href, options.sourcePath) : undefined;
                    return {
                        tagName,
                        attribs: {
                            ...attribs,
                            ...(href ? { href } : {}),
                            rel: 'noopener noreferrer',
                            ...(href?.startsWith('http') ? { target: attribs.target || '_blank' } : {}),
                        },
                    };
                },
                img: (tagName, attribs) => {
                    const src = attribs.src ? this.resolveAssetUrl(attribs.src, options.sourcePath) : '';
                    const { srcset: _srcset, sizes: _sizes, ...rest } = attribs;
                    return {
                        tagName,
                        attribs: {
                            ...rest,
                            src,
                            loading: attribs.loading || 'lazy',
                            decoding: attribs.decoding || 'async',
                            class: attribs.class || 'wiki-html-image',
                            'data-original': attribs['data-original'] || src,
                            'data-name': attribs['data-name'] || attribs.title || attribs.alt || basename(src),
                        },
                    };
                },
                source: (tagName, attribs) => ({
                    tagName,
                    attribs: {
                        ...attribs,
                        src: attribs.src ? this.resolveAssetUrl(attribs.src, options.sourcePath) : '',
                    },
                }),
            },
        });
    }
    cleanupRenderedHtml(html) {
        return html
            .replace(/<p>\s*<\/p>\s*(?=<figure\b)/g, '')
            .replace(/(?<=<\/figure>)\s*<p>\s*<\/p>/g, '')
            .replace(/<p>\s*<\/p>/g, '');
    }
    postProcessHtml(html, options) {
        let processed = html;
        processed = this.processTaskLists(processed);
        processed = this.processSpoilers(processed);
        processed = this.processAlerts(processed);
        processed = this.processCollapsibleSections(processed);
        processed = this.processTabs(processed);
        // Must run BEFORE processEmbeds and BEFORE sanitizeHtml so raw <iframe> PDF.js
        // tags are converted into wiki-embed-pdf-react divs before sanitize-html
        // strips their src (mozilla.github.io is not an allowed iframe host).
        processed = this.processRawPdfIframes(processed);
        processed = this.processEmbeds(processed, options);
        return processed;
    }
    processEmbeds(html, options) {
        return html.replace(/<a\s+([^>]*?)href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/gi, (full, before, href, after, label) => {
            const url = this.resolveLinkUrl(href, options.sourcePath);
            const youtubeId = this.extractYouTubeId(url);
            const type = this.mediaTypeFromUrl(url);
            const safeUrl = escapeHtml(url);
            const safeLabel = this.plainText(label) || basename(url);
            if (youtubeId) {
                return `<div class="wiki-embed wiki-embed-youtube" data-kind="youtube" data-url="${safeUrl}"><iframe src="https://www.youtube-nocookie.com/embed/${youtubeId}" title="${escapeHtml(safeLabel)}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
            }
            if (type === 'video') {
                return `<div class="wiki-embed wiki-embed-video" data-kind="video" data-url="${safeUrl}"><video class="wiki-video-player" controls preload="metadata"><source src="${safeUrl}"></video><div class="wiki-embed-caption">${escapeHtml(safeLabel)}</div></div>`;
            }
            if (type === 'pdf') {
                return `<div class="wiki-embed-pdf-react" data-url="${safeUrl}" data-name="${escapeHtml(safeLabel)}"></div>`;
            }
            // Handle links that point to the PDF.js viewer
            // e.g. [Guide](https://mozilla.github.io/pdf.js/web/viewer.html?file=URL.pdf)
            const pdfJsFileUrl = this.extractPdfJsFileUrl(url);
            if (pdfJsFileUrl) {
                const safePdfUrl = escapeHtml(pdfJsFileUrl);
                return `<div class="wiki-embed-pdf-react" data-url="${safePdfUrl}" data-name="${escapeHtml(safeLabel)}"></div>`;
            }
            return `<a ${before}href="${safeUrl}"${after}>${label}</a>`;
        });
    }
    /**
     * Converts raw <iframe> PDF.js viewer tags embedded in markdown HTML into
     * wiki-embed-pdf-react divs. This MUST run before sanitizeHtml, which would
     * otherwise strip the src attribute because mozilla.github.io is not in the
     * default allowedIframeHostnames list.
     *
     * Handles all of these patterns:
     *   <iframe src="https://mozilla.github.io/pdf.js/web/viewer.html?file=URL" ...></iframe>
     *   <iframe src="https://mozilla.github.io/pdf.js/web/viewer.html?file=URL" ... />
     */
    processRawPdfIframes(html) {
        return html.replace(/<iframe\b[^>]*?\bsrc=["']([^"']*mozilla\.github\.io\/pdf\.js[^"']*)["'][^>]*>(?:\s*<\/iframe>)?/gi, (_full, src) => {
            const pdfUrl = this.extractPdfJsFileUrl(src);
            if (!pdfUrl)
                return _full; // not a valid PDF.js URL — leave untouched
            const name = decodeURIComponent(basename(pdfUrl.split('?')[0])) || 'Document';
            return `<div class="wiki-embed-pdf-react" data-url="${escapeHtml(pdfUrl)}" data-name="${escapeHtml(name)}"></div>`;
        });
    }
    /**
     * If the given URL is a PDF.js viewer URL
     * (https://mozilla.github.io/pdf.js/web/viewer.html?file=ACTUAL_PDF_URL),
     * returns the decoded ACTUAL_PDF_URL. Otherwise returns null.
     */
    extractPdfJsFileUrl(url) {
        try {
            const u = new URL(url);
            if (!u.hostname.includes('mozilla.github.io') && !u.pathname.includes('/pdf.js/')) {
                return null;
            }
            const fileParam = u.searchParams.get('file');
            if (fileParam && fileParam.trim().length > 0) {
                return fileParam.trim();
            }
        }
        catch {
            // not a valid URL
        }
        return null;
    }
    processTaskLists(html) {
        return html
            .replace(/<li>\s*\[ \]\s+/g, '<li class="task-list-item"><input type="checkbox" disabled> ')
            .replace(/<li>\s*\[[xX]\]\s+/g, '<li class="task-list-item"><input type="checkbox" checked disabled> ');
    }
    processSpoilers(html) {
        return html.replace(/\|\|(.+?)\|\|/g, '<span class="wiki-spoiler" tabindex="0">$1</span>');
    }
    processAlerts(html) {
        return html
            .replace(/<blockquote>\s*<p>\[!(NOTE|TIP|WARNING|DANGER|INFO)\]\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi, (_m, type, body) => {
            const normalized = String(type).toLowerCase();
            return `<div class="wiki-alert wiki-alert-${normalized}"><span class="wiki-alert-label">${escapeHtml(normalized)}</span><div>${body}</div></div>`;
        })
            .replace(/<blockquote>\s*<p>&gt;!\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi, (_m, body) => {
            return `<div class="wiki-alert wiki-alert-warning"><span class="wiki-alert-label">warning</span><div>${body}</div></div>`;
        });
    }
    processCollapsibleSections(html) {
        return html.replace(/<p>:::details\s+(.+?)<\/p>([\s\S]*?)<p>:::<\/p>/gi, (_m, summary, body) => `<details class="wiki-collapsible"><summary>${escapeHtml(this.plainText(summary))}</summary><div>${body}</div></details>`);
    }
    processTabs(html) {
        return html.replace(/<p>:::tabs\s+(.+?)<\/p>([\s\S]*?)<p>:::<\/p>/gi, (_m, labels, body) => {
            const tabs = String(labels)
                .split('|')
                .map((label) => escapeHtml(label.trim()))
                .filter(Boolean);
            const buttons = tabs
                .map((label, index) => `<button class="wiki-tab ${index === 0 ? 'active' : ''}" type="button">${label}</button>`)
                .join('');
            return `<div class="wiki-tabs"><div class="wiki-tab-list">${buttons}</div><div class="wiki-tab-panel">${body}</div></div>`;
        });
    }
    extractMedia(markdown, options) {
        const assets = new Map();
        const add = (rawUrl, title, altText) => {
            const url = this.resolveAssetUrl(rawUrl, options.sourcePath);
            const type = this.mediaTypeFromUrl(url);
            const youtube = this.extractYouTubeId(url);
            if (!type && !youtube)
                return;
            const mediaType = (youtube ? 'video' : type);
            if (!mediaType)
                return;
            const githubPath = this.githubPathFromUrl(url);
            assets.set(`${mediaType}:${url}`, {
                type: youtube ? 'video' : mediaType,
                url,
                title: title || basename(url),
                altText,
                githubPath,
                githubUrl: githubPath ? `https://github.com/${config.github.owner}/${config.github.repo}/blob/${config.github.branch}/${githubPath}` : undefined,
            });
        };
        for (const match of markdown.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g)) {
            add(match[2], match[3], match[1]);
        }
        for (const match of markdown.matchAll(/(?<!!)\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g)) {
            add(match[2], match[3] || match[1]);
        }
        for (const match of markdown.matchAll(/\bhttps?:\/\/[^\s)<>"]+/g)) {
            add(match[0]);
        }
        for (const match of markdown.matchAll(/<(?:img|source|video)\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
            add(match[1]);
        }
        for (const match of markdown.matchAll(/<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
            add(match[1]);
        }
        return [...assets.values()];
    }
    countMedia(mediaAssets) {
        return mediaAssets.reduce((acc, asset) => {
            const youtube = this.extractYouTubeId(asset.url);
            if (asset.type === 'image')
                acc.images += 1;
            if (asset.type === 'gif') {
                acc.images += 1;
                acc.gifs += 1;
            }
            if (asset.type === 'video') {
                if (youtube)
                    acc.youtubeEmbeds += 1;
                else
                    acc.videoEmbeds += 1;
            }
            if (asset.type === 'pdf')
                acc.pdfEmbeds += 1;
            return acc;
        }, {
            images: 0,
            largeImages: 0,
            gifs: 0,
            videoEmbeds: 0,
            pdfEmbeds: 0,
            youtubeEmbeds: 0,
        });
    }
    normalizeTags(value) {
        if (Array.isArray(value)) {
            return value.map((item) => String(item).trim()).filter(Boolean);
        }
        if (typeof value === 'string') {
            return value.split(',').map((item) => item.trim()).filter(Boolean);
        }
        return [];
    }
    firstDefined(...values) {
        return values.find((value) => value !== undefined && value !== null);
    }
    booleanFrom(value, defaultValue = false) {
        if (value === undefined || value === null)
            return defaultValue;
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'number')
            return value > 0;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (['true', '1', 'yes', 'y', 'on', 'starred', 'featured'].includes(normalized))
                return true;
            if (['false', '0', 'no', 'n', 'off', 'none'].includes(normalized))
                return false;
        }
        return Boolean(value);
    }
    numberFrom(value, defaultValue = 0) {
        if (typeof value === 'number' && Number.isFinite(value))
            return Math.max(0, Math.floor(value));
        if (typeof value === 'string') {
            const parsed = Number(value.trim());
            if (Number.isFinite(parsed))
                return Math.max(0, Math.floor(parsed));
        }
        return defaultValue;
    }
    resolveLinkUrl(rawUrl, sourcePath) {
        const resolved = this.resolveAssetUrl(rawUrl, sourcePath);
        if (/\.(md|markdown|mdx)$/i.test(resolved)) {
            return `/wiki/${createSlug(withoutExtension(basename(resolved)))}`;
        }
        return resolved;
    }
    resolveAssetUrl(rawUrl, sourcePath) {
        const clean = rawUrl.trim().replace(/^<|>$/g, '');
        if (!clean || clean.startsWith('#') || clean.startsWith('mailto:')) {
            return clean;
        }
        if (/^https?:\/\//i.test(clean)) {
            return clean.replace(/"/g, '%22');
        }
        if (clean.startsWith('//')) {
            return `https:${clean}`;
        }
        let repoPath;
        if (clean.startsWith('/')) {
            const rootRelative = clean.replace(/^\/+/, '');
            repoPath = rootRelative.startsWith(config.github.contentRoot)
                ? rootRelative
                : joinRepoPath(config.github.contentRoot, rootRelative);
        }
        else {
            const baseDir = sourcePath ? dirname(sourcePath) : config.github.contentRoot;
            repoPath = joinRepoPath(baseDir, clean);
        }
        if (repoPath.startsWith('assets/')) {
            repoPath = joinRepoPath(config.github.contentRoot, repoPath);
        }
        return `${config.github.rawBaseUrl}/${repoPath.split('/').map(encodeURIComponent).join('/')}`;
    }
    githubPathFromUrl(url) {
        const prefix = `${config.github.rawBaseUrl}/`;
        if (!url.startsWith(prefix))
            return undefined;
        return decodeURIComponent(url.slice(prefix.length));
    }
    mediaTypeFromUrl(url) {
        if (this.extractYouTubeId(url))
            return 'video';
        const clean = url.split('?')[0].split('#')[0].toLowerCase();
        const extension = clean.match(/\.[a-z0-9]+$/)?.[0];
        if (!extension)
            return undefined;
        if (extension === '.gif')
            return 'gif';
        if (imageExtensions.has(extension))
            return 'image';
        if (videoExtensions.has(extension))
            return 'video';
        if (pdfExtensions.has(extension))
            return 'pdf';
        return undefined;
    }
    extractYouTubeId(url) {
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return match?.[1] || null;
    }
    isBadgeImage(url, alt) {
        return /img\.shields\.io|badgen\.net|badge/i.test(url) || /\bbadge\b/i.test(alt);
    }
    createPlaceholderMarkdown(sourcePath) {
        const title = this.titleFromPath(sourcePath);
        return `# ${title}\n\nEste artigo ja existe no repositorio de conteudo, mas ainda esta vazio.`;
    }
    titleFromPath(sourcePath) {
        if (!sourcePath)
            return 'Untitled';
        return withoutExtension(basename(sourcePath))
            .split(/[-_]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }
    plainText(html) {
        return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    }
}
export const markdownParser = new MarkdownParser();
//# sourceMappingURL=index.js.map