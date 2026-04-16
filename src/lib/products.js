// src/lib/products.js
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Path to your Excel file (place it in the project root)
const excelPath = path.join(__dirname, '../../products.xlsx');

let cachedProducts = null;

export function slugifyProductValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function getProductRouteParam(product) {
  if (!product) return '';

  const id = String(product.id || '').trim();
  const slug = slugifyProductValue(product.slug || product.name || id);

  if (!id) return slug;
  return slug ? `${id}-${slug}` : id;
}

export function getProductUrl(product) {
  const routeParam = getProductRouteParam(product);
  return routeParam ? `/product/${routeParam}` : '/products';
}

export function loadProductsFromExcel() {
  if (cachedProducts) return cachedProducts;

  try {
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const products = rows.map(row => {
      const id = row.part_no || row.sku;
      const slug = slugifyProductValue(row.slug || row.product_name || id);
      const images = row.images ? row.images.split(',').map(img => img.trim()) : [];
      const image = images[0] || '';
      const routeParam = getProductRouteParam({ id, slug, name: row.product_name });

      return {
        // Use part_no as unique ID (fallback to sku if part_no missing)
        id,
        part_no: row.part_no || '',
        sku: row.sku || '',
        category: row.category,
        subcategory: row.subcategory,
        subsubcategory: row.subsubcategory,
        type: row.type || '',
        name: row.product_name,
        description: row.description || '',
        brand: row.brand || '',
        images,
        image,
        thumbnail: image ? image.replace('/upload/', '/upload/c_fill,w_200,h_200/') : '',
        variant_name: row.variant_name || '',
        price: parseFloat(row.mrp),
        slug,
        routeParam,
        url: routeParam ? `/product/${routeParam}` : '/products',
        meta_title: row.meta_title || '',
        meta_description: row.meta_description || '',
      };
    });

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

export async function fetchProductByRouteParam(routeParam) {
  const products = loadProductsFromExcel();
  return products.find(product =>
    routeParam === product.id ||
    routeParam === product.routeParam ||
    routeParam.startsWith(`${product.id}-`)
  );
}

export async function getAllProductSlugs() {
  const products = loadProductsFromExcel();
  return products.flatMap(product => {
    const paths = [{ params: { id: product.routeParam } }];

    if (product.routeParam !== product.id) {
      paths.push({ params: { id: product.id } });
    }

    return paths;
  });
}
