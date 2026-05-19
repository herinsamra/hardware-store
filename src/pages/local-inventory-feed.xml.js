import { getLocalInventoryDefaults } from '../lib/localInventory.js';
import { fetchAllProducts } from '../lib/products.js';
import { escapeXml, formatMerchantPrice, SITE_URL } from '../lib/seo.js';

export const prerender = true;

function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function getMerchantId(product) {
  return cleanText(product.sku || product.part_no || product.id);
}

export async function GET() {
  const products = await fetchAllProducts();
  const { storeCode, availability, quantity } = getLocalInventoryDefaults();

  const feedItems = products
    .filter(product => getMerchantId(product))
    .map(product => {
      const id = getMerchantId(product);
      const price = formatMerchantPrice(product.price);
      const priceTag = price ? `          <g:price>${price} INR</g:price>\n` : '';

      return `        <item>
          <g:id>${escapeXml(id)}</g:id>
          <g:store_code>${escapeXml(storeCode)}</g:store_code>
          <g:availability>${escapeXml(availability)}</g:availability>
          <g:quantity>${quantity}</g:quantity>
${priceTag}        </item>`;
    })
    .join('\n');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Peniel Hardwares Local Inventory Feed</title>
    <description>Local inventory feed for Peniel Hardwares products</description>
    <link>${escapeXml(SITE_URL)}</link>
${feedItems}
  </channel>
</rss>`;

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
