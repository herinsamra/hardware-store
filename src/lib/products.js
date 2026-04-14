// src/lib/products.js
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Path to your Excel file (place it in the project root)
const excelPath = path.join(__dirname, '../../products.xlsx');

let cachedProducts = null;

export function loadProductsFromExcel() {
  if (cachedProducts) return cachedProducts;

  try {
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const products = rows.map(row => ({
      // Use part_no as unique ID (fallback to sku if part_no missing)
      id: row.part_no || row.sku,
      part_no: row.part_no || '',
      sku: row.sku || '',
      category: row.category,
      subcategory: row.subcategory,
      subsubcategory: row.subsubcategory,
      type: row.type || '',
      name: row.product_name,
      description: row.description || '',
      brand: row.brand || '',
      images: row.images ? row.images.split(',').map(img => img.trim()) : [],
      // Main image is the first one
      image: row.images ? row.images.split(',')[0].trim() : '',
      thumbnail: row.images ? row.images.split(',')[0].trim().replace('/upload/', '/upload/c_fill,w_200,h_200/') : '',
      variant_name: row.variant_name || '',
      price: parseFloat(row.mrp),
      slug: row.slug || '',
      meta_title: row.meta_title || '',
      meta_description: row.meta_description || '',
    }));

    cachedProducts = products;
    return products;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
}

export async function fetchAllProducts() {
  return loadProductsFromExcel();
}

export async function fetchProductById(id) {
  const products = loadProductsFromExcel();
  return products.find(p => p.id === id);
}

export async function getAllProductSlugs() {
  const products = loadProductsFromExcel();
  return products.map(p => ({ params: { id: p.id } }));
}
