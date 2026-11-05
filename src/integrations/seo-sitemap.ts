import type { AstroIntegration } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function seoSitemapIntegration(): AstroIntegration {
  return {
    name: 'zesti-seo-sitemap',
    hooks: {
      'astro:build:done': async ({ dir, pages }) => {
        const outDir = fileURLToPath(dir);
        const rootDir = process.cwd();

        // 1. Read brand.json
        const brandPath = path.join(rootDir, 'brand.json');
        let brandData: any = { noindex: true, name: 'Zesti Kitchen (Demo)' };
        try {
          brandData = JSON.parse(fs.readFileSync(brandPath, 'utf8'));
        } catch (e) {
          console.warn('Could not read brand.json, defaulting to noindex: true');
        }

        const isNoIndex = Boolean(brandData.noindex);
        const siteBase = 'https://zesti-demo.pages.dev';

        // 2. Generate robots.txt
        let robotsContent = '';
        if (isNoIndex) {
          robotsContent = `User-agent: *\nDisallow: /\n`;
        } else {
          robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${siteBase}/sitemap-index.xml\n`;
        }
        fs.writeFileSync(path.join(outDir, 'robots.txt'), robotsContent, 'utf8');

        // Also update public/robots.txt so dev and static inspect match
        const publicRobots = path.join(rootDir, 'public', 'robots.txt');
        fs.writeFileSync(publicRobots, robotsContent, 'utf8');

        // 3. Generate _headers with dynamic X-Robots-Tag
        const xRobotsTagValue = isNoIndex ? 'noindex, nofollow' : 'index, follow';
        const headersContent = `/*
  X-Robots-Tag: ${xRobotsTagValue}
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=31536000, immutable
`;
        fs.writeFileSync(path.join(outDir, '_headers'), headersContent, 'utf8');
        const publicHeaders = path.join(rootDir, 'public', '_headers');
        fs.writeFileSync(publicHeaders, headersContent, 'utf8');

        // 4. Generate sitemap XML
        const filteredPages = pages.filter((p) => {
          const pathname = p.pathname || '';
          return !pathname.includes('admin') && !pathname.includes('404');
        });

        const urls = filteredPages.map((p) => {
          let pathname = p.pathname || '';
          if (pathname && !pathname.endsWith('/')) {
            pathname += '/';
          }
          return `${siteBase}/${pathname}`.replace(/([^:]\/)\/+/g, '$1');
        });

        const date = new Date().toISOString().split('T')[0];
        const sitemapEntries = urls
          .map(
            (u) => `  <url>
    <loc>${u}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${u.endsWith('/') && u.split('/').length <= 4 ? 'daily' : 'weekly'}</changefreq>
    <priority>${u === `${siteBase}/` ? '1.0' : '0.8'}</priority>
  </url>`
          )
          .join('\n');

        const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`;

        const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteBase}/sitemap-0.xml</loc>
    <lastmod>${date}</lastmod>
  </sitemap>
</sitemapindex>`;

        fs.writeFileSync(path.join(outDir, 'sitemap-0.xml'), sitemapXml, 'utf8');
        fs.writeFileSync(path.join(outDir, 'sitemap-index.xml'), sitemapIndexXml, 'utf8');
        fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml, 'utf8');

        console.log(
          `[zesti-seo-sitemap] Successfully generated robots.txt, _headers (X-Robots-Tag: ${xRobotsTagValue}), and sitemaps (${urls.length} URLs, noindex: ${isNoIndex})`
        );
      }
    }
  };
}

