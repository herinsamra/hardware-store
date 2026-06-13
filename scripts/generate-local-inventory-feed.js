import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getLocalInventoryDefaults } from '../src/lib/localInventory.js';
import { fetchAllProducts } from '../src/lib/products.js';
import { formatMerchantPrice } from '../src/lib/seo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '../public');
const outputPath = path.join(outputDir, 'local-inventory-feed.csv');

function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function getMerchantId(product) {
  return cleanText(product.sku || product.part_no || product.id);
}

function csvCell(value = '') {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

try {
  const products = await fetchAllProducts();
  const { storeCode, availability, quantity } = getLocalInventoryDefaults();
  const rows = [['itemid', 'store code', 'availability', 'quantity', 'price']];

  for (const product of products) {
    const id = getMerchantId(product);
    if (!id) continue;

    const price = formatMerchantPrice(product.price);
    rows.push([
      id,
      storeCode,
      availability,
      quantity,
      price ? `${price} INR` : '',
    ]);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    outputPath,
    `${rows.map(row => row.map(csvCell).join(',')).join('\n')}\n`,
    'utf8'
  );
  console.log(`Generated ${path.relative(process.cwd(), outputPath)} with ${rows.length - 1} products`);
} catch (error) {
  console.error('Error generating local inventory feed:', error);
  process.exit(1);
}
