import fs from 'node:fs';
import path from 'node:path';

/**
 * Validates that every internal link and image referenced in HTML/Astro files
 * points to a valid file or route, failing on any 404.
 */
function checkLinksAndImages() {
  console.log('Running static link and image integrity verification...');

  const validRoutes = [
    '/',
    '/menu',
    '/reserve',
    '/about',
    '/gallery',
    '/contact',
    '/faq',
    '/for-owners',
    '/admin',
    '/admin/qr',
    '/404'
  ];

  const publicDir = path.resolve('public');
  const srcDir = path.resolve('src');

  let brokenLinks = 0;
  let brokenImages = 0;

  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name.endsWith('.astro') || entry.name.endsWith('.tsx') || entry.name.endsWith('.html')) {
        const content = fs.readFileSync(fullPath, 'utf-8');

        // Check internal href links: href="/..."
        const hrefMatches = content.matchAll(/href=["'](\/[^"'#?]*)["']/g);
        for (const match of hrefMatches) {
          const route = match[1];
          // Skip assets in /images or /fonts
          if (route.startsWith('/images/') || route.startsWith('/fonts/') || route.startsWith('/favicon') || route.startsWith('/sw.js')) {
            const assetPath = path.join(publicDir, route);
            if (!fs.existsSync(assetPath)) {
              console.error(`404 Asset: "${route}" in ${fullPath}`);
              brokenImages++;
            }
          } else {
            // Must be one of the known routes
            if (!validRoutes.includes(route)) {
              console.error(`404 Route: "${route}" in ${fullPath}`);
              brokenLinks++;
            }
          }
        }

        // Check img src: src="/..."
        const srcMatches = content.matchAll(/src=["'](\/images\/[^"']+)["']/g);
        for (const match of srcMatches) {
          const imgSrc = match[1];
          const assetPath = path.join(publicDir, imgSrc);
          if (!fs.existsSync(assetPath)) {
            console.error(`404 Image src: "${imgSrc}" in ${fullPath}`);
            brokenImages++;
          }
        }
      }
    }
  }

  scanDirectory(srcDir);

  if (brokenLinks > 0 || brokenImages > 0) {
    console.error(`\nLink & Image Checker FAILED: ${brokenLinks} broken link(s), ${brokenImages} broken image(s) detected.`);
    process.exit(1);
  }

  console.log('✓ All internal links and images resolved successfully. Zero 404s.');
}

checkLinksAndImages();

