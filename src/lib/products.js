// src/lib/products.js
import productsData from '../data/products.json' with { type: 'json' };


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

function normalizeFeatureList(value) {
  const explanationPattern = /\b(enjoy|ensures?|offers?|provides?|enhances?|maximi[sz]es?|perfect|superior|effortless|luxurious|peace of mind|assured|lasting|stylish|reliable|premium|easy|modern|comfortable|confidence)\b/i;
  const stringifySpec = item => {
    if (!item || typeof item !== 'object') return String(item || '');
    const entries = Object.entries(item).filter(([, val]) => val !== undefined && val !== null && String(val).trim());
    if (entries.length === 0) return '';
    if (entries.length === 1) {
      const [[key, val]] = entries;
      return `${key}: ${val}`;
    }
    const label = item.name || item.label || item.key || item.spec || item.title;
    const detail = item.value || item.detail || item.description || item.text;
    if (label && detail) return `${label}: ${detail}`;
    return entries.map(([key, val]) => `${key}: ${val}`).join(', ');
  };
  const cleanFeatureLabel = item => {
    const cleaned = stringifySpec(item)
      .replace(/^\s*(?:[-*\u2022]|\d+[.)])\s*/, '')
      .trim()
      .replace(/[.]+$/, '');
    const colonIndex = cleaned.indexOf(':');
    if (colonIndex === -1) return cleaned;

    const name = cleaned.slice(0, colonIndex).trim();
    const detail = cleaned.slice(colonIndex + 1).trim().replace(/[.]+$/, '');
    if (!detail || detail.length > 48 || explanationPattern.test(detail)) return name;
    return `${name}: ${detail}`;
  };

  if (Array.isArray(value)) {
    return value
      .map(cleanFeatureLabel)
      .filter(Boolean);
  }

  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return normalizeFeatureList(parsed);
  } catch (e) {}

  return value
    .split(/\r?\n|,/)
    .map(cleanFeatureLabel)
    .filter(Boolean);
}

export function loadProductsFromExcel() {

  const products = productsData.map(row => {
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
      key_features: normalizeFeatureList(row.key_features),
      brand: row.brand || '',
      images,
      image,
      thumbnail: image ? image.replace('/upload/', '/upload/c_fill,w_200,h_200/') : '',
      variant_name: row.variant_name || '',
      price: parseFloat(row.mrp),
      unit: row.unit || '',
      slug,
      routeParam,
      url: routeParam ? `/product/${routeParam}` : '/products',
      meta_title: row.meta_title || '',
      meta_description: row.meta_description || '',
      is_featured: row.is_featured || false,
      slogan: row.slogan || '',
      featured_link: row.featured_link || '',
      featured_link_type: row.featured_link_type || 'product',
      featured_button_text: row.featured_button_text || '',
      video_url: row.video_url || '',
      quantity: row.quantity ?? row.stock ?? '',
      availability: row.availability || '',
      gtin: row.gtin || row.upc || row.ean || '',
      material: row.material || '',
      color: row.color || '',
      size: row.size || '',
      variants: (() => {
        if (!row.variants) return [];
        if (Array.isArray(row.variants)) return row.variants;
        try { 
          const parsed = JSON.parse(row.variants);
          return Array.isArray(parsed) ? parsed : [];
        } catch(e) { return []; }
      })(),
    };
  });

  return products;
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
