import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import { seoSitemapIntegration } from './src/integrations/seo-sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://zesti-demo.pages.dev',
  output: 'static',
  integrations: [
    preact({
      include: ['**/components/**/*.tsx', '**/components/**/*.jsx']
    }),
    tailwind({
      applyBaseStyles: false
    }),
    seoSitemapIntegration()
  ],
  vite: {
    ssr: {
      noExternal: ['blurhash']
    }
  }
});
