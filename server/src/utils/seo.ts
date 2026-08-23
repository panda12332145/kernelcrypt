/**
 * Script para gerar sitemap.xml automaticamente
 */

import { exec } from 'child_process';
import { writeFileSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Gera sitemap.xml
 */
export async function generateSitemap(
  baseUrl: string,
  entries: SitemapEntry[]
): Promise<string> {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority !== undefined ? `<priority>${entry.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

/**
 * Gera robots.txt
 */
export function generateRobots(baseUrl: string): string {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml

# Common crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Block bad bots
User-agent: MJ12bot
Disallow: /

User-agent: SemrushBot
Disallow: /
`;
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };

  return str.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

/**
 * CSP (Content Security Policy) Header
 */
export const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data: https:;
  connect-src 'self' https://api.github.com;
  media-src 'self' https:;
  frame-src https://www.youtube.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

/**
 * Headers de segurança
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': CSP_HEADER.replace(/\n\s+/g, ' '),
};
