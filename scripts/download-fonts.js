import fs from 'node:fs';
import path from 'node:path';

async function downloadFonts() {
  const fontsDir = path.resolve('public', 'fonts');
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }

  // Google fonts CSS with Modern User-Agent that gets woff2
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  const urls = [
    'https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap',
    'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap'
  ];

  for (const url of urls) {
    try {
      console.log(`Fetching CSS from: ${url}`);
      const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
      const css = await res.text();

      // Extract woff2 url
      const match = css.match(/src:\s*url\((https:\/\/[^)]+\.woff2)\)/);
      if (match && match[1]) {
        const fontUrl = match[1];
        const fontName = url.includes('Serif') ? 'dm-serif-display.woff2' : 'dm-sans.woff2';
        const targetPath = path.join(fontsDir, fontName);
        console.log(`Downloading font file from ${fontUrl} to ${targetPath}`);
        const fontRes = await fetch(fontUrl);
        const buffer = Buffer.from(await fontRes.arrayBuffer());
        fs.writeFileSync(targetPath, buffer);
        console.log(`Successfully saved ${fontName} (${buffer.length} bytes)`);
      }
    } catch (err) {
      console.error(`Failed to download font:`, err);
    }
  }
}

downloadFonts();

