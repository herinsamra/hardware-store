import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import { fileURLToPath } from 'url';
import { SITE_URL } from './src/lib/seo.js';

const astroPrerenderEntrypoint = fileURLToPath(
  new URL('./node_modules/astro/dist/entrypoints/prerender.js', import.meta.url)
);
const astroLegacyEntrypoint = fileURLToPath(
  new URL('./node_modules/astro/dist/entrypoints/legacy.js', import.meta.url)
);

export default defineConfig({
  site: SITE_URL,
  output: 'static',   // Use static, mostly static pages + SSR endpoints
  adapter: netlify(),
  prefetch: {
    defaultStrategy: 'viewport',
  },
  vite: {
    resolve: {
      alias: {
        'astro/entrypoints/prerender': astroPrerenderEntrypoint,
        'astro/entrypoints/legacy': astroLegacyEntrypoint,
      },
    },
  },
});
