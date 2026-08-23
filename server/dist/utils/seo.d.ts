/**
 * Script para gerar sitemap.xml automaticamente
 */
interface SitemapEntry {
    url: string;
    lastmod?: string;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
}
/**
 * Gera sitemap.xml
 */
export declare function generateSitemap(baseUrl: string, entries: SitemapEntry[]): Promise<string>;
/**
 * Gera robots.txt
 */
export declare function generateRobots(baseUrl: string): string;
/**
 * CSP (Content Security Policy) Header
 */
export declare const CSP_HEADER = "\n  default-src 'self';\n  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;\n  style-src 'self' 'unsafe-inline';\n  img-src 'self' data: https:;\n  font-src 'self' data: https:;\n  connect-src 'self' https://api.github.com;\n  media-src 'self' https:;\n  frame-src https://www.youtube.com;\n  object-src 'none';\n  base-uri 'self';\n  form-action 'self';\n  frame-ancestors 'none';\n  upgrade-insecure-requests;\n";
/**
 * Headers de segurança
 */
export declare const SECURITY_HEADERS: {
    'X-Content-Type-Options': string;
    'X-Frame-Options': string;
    'X-XSS-Protection': string;
    'Referrer-Policy': string;
    'Permissions-Policy': string;
    'Strict-Transport-Security': string;
    'Content-Security-Policy': string;
};
export {};
//# sourceMappingURL=seo.d.ts.map