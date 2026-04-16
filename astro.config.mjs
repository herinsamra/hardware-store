import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: process.env.SITE_URL,
  output: 'static',   // keep static for Netlify/Vercel
});
