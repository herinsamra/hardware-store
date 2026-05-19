import { fetchAllProducts } from '../lib/products.js';
import { getLocalInventoryDefaults } from '../lib/localInventory.js';
import { absoluteUrl, cdata, escapeXml, formatMerchantPrice, SITE_URL } from '../lib/seo.js';

export const prerender = true;

function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function getAvailability() {
  const { availability } = getLocalInventoryDefaults();
  return availability;
}

function googleTag(name, value) {
  if (value === undefined || value === null || value === '') return '';
  return `          <g:${name}>${cdata(value)}</g:${name}>\n`;
}

export async function GET() {
  const products = await fetchAllProducts();
  const { storeCode, quantity } = getLocalInventoryDefaults();

  const feedItems = products
    .filter(product => product.routeParam && product.image && formatMerchantPrice(product.price))
    .map(product => {
      const id = cleanText(product.sku || product.part_no || product.id);
      const title = cleanText([product.brand, product.name, product.variant_name].filter(Boolean).join(' ')).slice(0, 150);
      const description = cleanText(product.description || product.meta_description || product.name).slice(0, 5000);
      const link = absoluteUrl(`/product/${product.routeParam}`);
      const image = absoluteUrl(product.image);
      const price = `${formatMerchantPrice(product.price)} INR`;
      const productType = [product.category, product.subcategory, product.subsubcategory]
        .filter(Boolean)
        .map(cleanText)
        .join(' > ');
      const mpn = cleanText(product.part_no || '');
      const hasProductIdentifier = Boolean(product.gtin || (product.brand && mpn));
      
      const additionalImages = product.images?.slice(1, 11).map(img => absoluteUrl(img)) || [];
      const additionalImageTags = additionalImages.map(img => `          <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n');

      return `        <item>
          <title>${cdata(title)}</title>
          <link>${escapeXml(link)}</link>
          <description>${cdata(description)}</description>
          <g:id>${escapeXml(id)}</g:id>
          <g:title>${cdata(title)}</g:title>
          <g:description>${cdata(description)}</g:description>
          <g:link>${escapeXml(link)}</g:link>
          <g:image_link>${escapeXml(image)}</g:image_link>
${additionalImageTags ? additionalImageTags + '\n' : ''}          <g:availability>${getAvailability()}</g:availability>
          <g:store_code>${escapeXml(storeCode)}</g:store_code>
          <g:quantity>${quantity}</g:quantity>
          <g:price>${price}</g:price>
          <g:condition>new</g:condition>
          <g:shipping>
            <g:country>IN</g:country>
            <g:service>Standard</g:service>
            <g:price>0.00 INR</g:price>
          </g:shipping>
${googleTag('brand', cleanText(product.brand || 'Peniel Hardwares'))}${googleTag('mpn', mpn)}${googleTag('gtin', cleanText(product.gtin))}${googleTag('product_type', productType)}${googleTag('material', cleanText(product.material))}${googleTag('color', cleanText(product.color))}${googleTag('size', cleanText(product.size))}${googleTag('shipping_weight', product.weight ? `${product.weight} kg` : '')}${googleTag('item_group_id', product.variants?.length ? cleanText(product.id) : '')}${hasProductIdentifier ? '' : '          <g:identifier_exists>no</g:identifier_exists>\n'}        </item>`;
    })
    .join('\n');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Peniel Hardwares Product Feed</title>
    <description>Product feed for Peniel Hardwares products</description>
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
