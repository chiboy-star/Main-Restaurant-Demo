import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

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
    sitemap({
      filter: (page) => !page.includes('/admin')
    })
  ],
  vite: {
    ssr: {
      noExternal: ['blurhash']
    }
  }
});
