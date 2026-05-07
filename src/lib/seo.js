export const SITE_URL = (process.env.SITE_URL || 'https://penielhardwares.com').replace(/\/+$/, '');

export function absoluteUrl(pathOrUrl = '/') {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, `${SITE_URL}/`).toString();
}

export function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function cdata(value = '') {
  return `<![CDATA[${String(value).replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

export function formatMerchantPrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price.toFixed(2) : '';
}
