import { absoluteUrl } from '../lib/seo.js';

export const prerender = true;

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${absoluteUrl('/sitemap.xml')}`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}
