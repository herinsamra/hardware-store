import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';

const astroPrerenderEntrypoint = fileURLToPath(
  new URL('./node_modules/astro/dist/entrypoints/prerender.js', import.meta.url)
);
const astroLegacyEntrypoint = fileURLToPath(
  new URL('./node_modules/astro/dist/entrypoints/legacy.js', import.meta.url)
);

export default defineConfig({
  site: process.env.SITE_URL,
  output: 'static',   // keep static for Netlify/Vercel
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
