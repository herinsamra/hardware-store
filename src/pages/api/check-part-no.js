export const prerender = false;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import productsData from '../../data/products.json' with { type: 'json' };
import { jsonResponse } from '../../lib/cacheHeaders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

function normalizePartNo(value) {
  return String(value || '').trim().toUpperCase();
}

function parseVariants(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function findPartNoMatch(rows, partNo) {
  for (const row of rows) {
    if (normalizePartNo(row.part_no) === partNo) {
      return { product: row, matchedPartNo: row.part_no, matchType: 'product' };
    }

    const variant = parseVariants(row.variants)
      .find(item => normalizePartNo(item?.part_no) === partNo);

    if (variant) {
      return { product: row, matchedPartNo: variant.part_no, matchType: 'variant' };
    }
  }

  return null;
}

function loadProductRows() {
  const excelPath = path.join(projectRoot, 'products.xlsx');
  if (fs.existsSync(excelPath)) {
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
  }

  return Array.isArray(productsData) ? productsData : [];
}

export async function GET({ url }) {
  const partNo = normalizePartNo(url.searchParams.get('part_no'));

  if (!partNo) {
    return jsonResponse({ exists: false, part_no: '' }, { status: 200 });
  }

  try {
    const match = findPartNoMatch(loadProductRows(), partNo);
    const product = match?.product;

    return jsonResponse({
      exists: Boolean(match),
      part_no: partNo,
      product: product ? {
        part_no: normalizePartNo(match.matchedPartNo),
        parent_part_no: normalizePartNo(product.part_no),
        match_type: match.matchType,
        product_name: product.product_name || '',
        brand: product.brand || '',
      } : null,
    }, { status: 200 });
  } catch (error) {
    console.error('Part number check failed:', error);
    return jsonResponse({ error: 'Unable to check part number' }, { status: 500 });
  }
}
