/**
 * Serviço de SEO - Meta tags, Open Graph, JSON-LD
 */

import React from 'react';
import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'article' | 'website';
  author?: string;
  publishedDate?: Date;
  updatedDate?: Date;
  tags?: string[];
}

/**
 * Hook para gerenciar tags SEO/OG
 */
export function useSEO({
  title,
  description,
  image,
  url,
  type = 'article',
  author,
  publishedDate,
  updatedDate,
  tags,
}: SEOProps) {
  useEffect(() => {
    // Title
    document.title = `${title} | Wiki Cybersecurity`;

    // Meta description
    setMetaTag('description', description);
    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    setMetaTag('og:type', type);

    // Image
    if (image) {
      setMetaTag('og:image', image);
      setMetaTag('twitter:image', image);
    }

    // URL
    if (url) {
      setMetaTag('og:url', url);
      setMetaTag('canonical', url);
    }

    // Twitter
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);

    // Article-specific
    if (type === 'article') {
      if (author) setMetaTag('article:author', author);
      if (publishedDate) {
        setMetaTag('article:published_time', publishedDate.toISOString());
      }
      if (updatedDate) {
        setMetaTag('article:modified_time', updatedDate.toISOString());
      }
      if (tags) {
        tags.forEach((tag) => {
          setMetaTag('article:tag', tag);
        });
      }
    }

    // JSON-LD
    if (type === 'article') {
      setJsonLD({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        image,
        datePublished: publishedDate?.toISOString(),
        dateModified: updatedDate?.toISOString(),
        author: {
          '@type': 'Person',
          name: author || 'Wiki Cybersecurity',
        },
      });
    }
  }, [title, description, image, url, type, author, publishedDate, updatedDate, tags]);
}

/**
 * Helper para set meta tag
 */
function setMetaTag(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`) ||
    document.querySelector(`meta[property="${name}"]`);

  if (!element) {
    element = document.createElement('meta');
    const isProperty = name.startsWith('og:') || name.startsWith('article:');
    if (isProperty) {
      element.setAttribute('property', name);
    } else if (name === 'canonical') {
      element = document.createElement('link');
      (element as any).rel = 'canonical';
      (element as any).href = content;
      document.head.appendChild(element);
      return;
    } else {
      element.setAttribute('name', name);
    }
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

/**
 * Helper para set JSON-LD
 */
function setJsonLD(data: any) {
  // Remove old script se existir
  const oldScript = document.querySelector('script[type="application/ld+json"]');
  if (oldScript) {
    oldScript.remove();
  }

  // Add new script
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * Componente para head content
 */
export function SEOHead() {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#000000" />
      <meta name="robots" content="index, follow" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />

      {/* Preconnect */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://api.github.com" />

      {/* DNS-prefetch */}
      <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
    </>
  );
}
