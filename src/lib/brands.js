import brandData from '../data/brands.json';

const brandAliases = {
  asian: 'asianpaints',
  dr_fixit: 'drfixit',
  hi_fi: 'hifi',
  jaquar_and_essco: 'jaquar',
  jaquar_essco: 'jaquar',
};

const categoryAliases = {
  electrical: 'Electrical',
  electricals: 'Electrical',
  hardware: 'Hardware',
  hardwares: 'Hardware',
  paints: 'Paints',
  paint: 'Paints',
  plumbing: 'Plumbing',
  sanitary: 'Sanitary',
  sanitaryware: 'Sanitary',
  sanitary_ware: 'Sanitary',
};

export function normalizeBrandKey(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return brandAliases[normalized] || normalized.replace(/_/g, '');
}

function slugifyBrand(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeBrandCategory(value) {
  const key = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]+/g, '');

  return categoryAliases[key] || String(value || '').trim();
}

function parseBrandCategories(value) {
  return String(value || '')
    .split(',')
    .map((part) => normalizeBrandCategory(part))
    .filter(Boolean);
}

function chunkIntoRows(items, rowCount) {
  const rows = Array.from({ length: rowCount }, () => []);
  items.forEach((item, index) => {
    rows[index % rowCount].push(item);
  });
  return rows.filter((row) => row.length > 0);
}

export const allBrands = brandData.map((brand) => ({
  ...brand,
  slug: slugifyBrand(brand.name),
  categories: parseBrandCategories(brand.category),
  url: brand.imageUrl,
}));

export const brandsByCategory = allBrands.reduce((accumulator, brand) => {
  brand.categories.forEach((category) => {
    if (!accumulator[category]) accumulator[category] = [];
    accumulator[category].push(brand);
  });

  return accumulator;
}, {});

export const brandRows = chunkIntoRows(allBrands, 4).map((row, rowIndex) =>
  rowIndex % 2 === 0 ? row : [...row].reverse()
);

const brandIndex = new Map();

for (const brand of allBrands) {
  const key = normalizeBrandKey(brand.name);
  if (!brandIndex.has(key)) {
    brandIndex.set(key, brand);
  }
}

export function getBrandAsset(brandName) {
  return brandIndex.get(normalizeBrandKey(brandName));
}

export function getBrandsForCategory(categoryName) {
  const normalized = normalizeBrandCategory(categoryName);
  return brandsByCategory[normalized] || [];
}
