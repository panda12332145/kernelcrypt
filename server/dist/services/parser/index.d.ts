/**
 * Advanced Markdown parser for the GitHub driven wiki.
 *
 * Markdown and embedded HTML are supported. Raw HTML is sanitized with a
 * GitHub-like allowlist plus controlled inline CSS so wiki articles can be
 * customized without exposing script/event-handler injection.
 */
import { Difficulty, MediaType } from '../../types/index.js';
export interface ParsedMediaAsset {
    type: MediaType;
    url: string;
    title?: string;
    altText?: string;
    githubPath?: string;
    githubUrl?: string;
}
export interface TableOfContentsItem {
    level: number;
    title: string;
    anchor: string;
}
export interface ParsedMarkdown {
    frontmatter: Record<string, any>;
    content: string;
    renderedHtml: string;
    title: string;
    seoTitle: string;
    description?: string;
    excerpt: string;
    difficulty: Difficulty;
    featured: boolean;
    starred: boolean;
    starCount: number;
    tags: string[];
    coverImage?: string;
    wordCount: number;
    mediaCount: number;
    extraSeconds: number;
    readingTimeMinutes: number;
    readingTimeSeconds: number;
    toc: TableOfContentsItem[];
    mediaAssets: ParsedMediaAsset[];
}
interface ParseOptions {
    sourcePath?: string;
    categorySlug?: string;
}
export declare class MarkdownParser {
    private markdown;
    constructor();
    parse(content: string, options?: ParseOptions): ParsedMarkdown;
    extractExcerpt(markdown: string, length?: number): string;
    validate(content: string): {
        valid: boolean;
        errors: string[];
    };
    generateTableOfContents(markdown: string): TableOfContentsItem[];
    private installRenderers;
    private highlightCode;
    private normalizeCodeLanguage;
    private sanitizeRenderedHtml;
    private cleanupRenderedHtml;
    private postProcessHtml;
    private processEmbeds;
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
    private processRawPdfIframes;
    /**
     * If the given URL is a PDF.js viewer URL
     * (https://mozilla.github.io/pdf.js/web/viewer.html?file=ACTUAL_PDF_URL),
     * returns the decoded ACTUAL_PDF_URL. Otherwise returns null.
     */
    private extractPdfJsFileUrl;
    private processTaskLists;
    private processSpoilers;
    private processAlerts;
    private processCollapsibleSections;
    private processTabs;
    private extractMedia;
    private countMedia;
    private normalizeTags;
    private firstDefined;
    private booleanFrom;
    private numberFrom;
    private resolveLinkUrl;
    private resolveAssetUrl;
    private githubPathFromUrl;
    private mediaTypeFromUrl;
    private extractYouTubeId;
    private isBadgeImage;
    private createPlaceholderMarkdown;
    private titleFromPath;
    private plainText;
}
export declare const markdownParser: MarkdownParser;
export {};
//# sourceMappingURL=index.d.ts.map