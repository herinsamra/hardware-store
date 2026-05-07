import { fetchAllProducts } from '../lib/products.js';
import { absoluteUrl, escapeXml } from '../lib/seo.js';

export const prerender = true;

export async function GET() {
  const products = await fetchAllProducts();
  const buildTime = new Date().toISOString();
  
  const urls = [
    {
      loc: '/',
      lastmod: buildTime,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: '/products',
      lastmod: buildTime,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: '/categories',
      lastmod: buildTime,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: '/contact',
      lastmod: buildTime,
      changefreq: 'monthly',
      priority: 0.7
    },
    ...products.filter(product => product.routeParam).map(product => ({
      loc: `/product/${product.routeParam}`,
      lastmod: buildTime,
      changefreq: 'weekly',
      priority: 0.8
    }))
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(absoluteUrl(url.loc))}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
