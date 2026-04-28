import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import { fileURLToPath } from 'url';

const astroPrerenderEntrypoint = fileURLToPath(
  new URL('./node_modules/astro/dist/entrypoints/prerender.js', import.meta.url)
);
const astroLegacyEntrypoint = fileURLToPath(
  new URL('./node_modules/astro/dist/entrypoints/legacy.js', import.meta.url)
);

export default defineConfig({
  site: process.env.SITE_URL || 'https://your-site-url.com', // Replace with your actual site URL
  output: 'hybrid',   // Use hybrid for mostly static pages + SSR endpoints
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