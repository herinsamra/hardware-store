/**
 * TypeScript interfaces and data fetching functions for categories and brands.
 * Mock data is provided here - to be replaced with Decap CMS integration later.
 */

import { allBrands } from './brands';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface Category {
  name: string;
  slug: string;
  image: string;
  icon: string;
  subcategories: string[];
}

export interface Brand {
  name: string;
  slug: string;
  logo: string;
  category?: string;
}

export interface SubcategoryMap {
  [subcategory: string]: {
    [subSubcategory: string]: never[];
  };
}

export interface CategoriesData {
  [category: string]: SubcategoryMap;
}

// ============================================================================
// Cloudinary Configuration
// ============================================================================

const CLOUDINARY_BASE = 'https://res.cloudinary.com/demo/image/upload';

/**
 * Generate a Cloudinary URL with transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    gravity?: 'auto' | 'face' | 'center';
    quality?: 'auto' | number;
  } = {}
): string {
  const { width = 400, height = 300, crop = 'fill', gravity = 'auto', quality = 'auto' } = options;
  const transformations = `c_${crop},g_${gravity},w_${width},h_${height},q_${quality}`;
  return `${CLOUDINARY_BASE}/${transformations}/${publicId}`;
}

// ============================================================================
// Mock Data (to be replaced with Decap CMS data)
// ============================================================================

const mockCategories: Category[] = [
  {
    name: 'Plumbing',
    slug: 'plumbing',
    image: getCloudinaryUrl('samples/food/spices', { width: 400, height: 300 }),
    icon: getCloudinaryUrl('samples/cloudinary-icon', { width: 80, height: 80, crop: 'fit' }),
    subcategories: ['Pipes & Fittings', 'Faucets', 'Water Heaters', 'Valves', 'Tanks', 'Water Pumps'],
  },
  {
    name: 'Electrical',
    slug: 'electrical',
    image: getCloudinaryUrl('samples/landscapes/architecture-signs', { width: 400, height: 300 }),
    icon: getCloudinaryUrl('samples/cloudinary-icon', { width: 80, height: 80, crop: 'fit' }),
    subcategories: ['Wiring Devices', 'Power Distribution', 'Wires & Cables', 'Lighting Fixtures', 'Fans', 'Water Heaters'],
  },
  {
    name: 'Sanitary',
    slug: 'sanitary-ware',
    image: getCloudinaryUrl('samples/landscapes/nature-mountains', { width: 400, height: 300 }),
    icon: getCloudinaryUrl('samples/cloudinary-icon', { width: 80, height: 80, crop: 'fit' }),
    subcategories: ['Closets', 'Basins', 'Faucets', 'Showers', 'Bath Tubs', 'Bathroom Accessories'],
  },
  {
    name: 'Hardware',
    slug: 'hardwares',
    image: getCloudinaryUrl('samples/food/pot-mussels', { width: 400, height: 300 }),
    icon: getCloudinaryUrl('samples/cloudinary-icon', { width: 80, height: 80, crop: 'fit' }),
    subcategories: ['Locks & Latches', 'Handles & Knobs', 'Cabinet Hardware', 'Hinges', 'Fasteners'],
  },
  {
    name: 'Painting',
    slug: 'paints',
    image: getCloudinaryUrl('samples/ecommerce/accessories-bag', { width: 400, height: 300 }),
    icon: getCloudinaryUrl('samples/cloudinary-icon', { width: 80, height: 80, crop: 'fit' }),
    subcategories: ['Emulsion', 'Enamels', 'Primers', 'Putty', 'Brushes & Rollers', 'Water Proofing'],
  },
];

const mockBrands: Brand[] = allBrands.map((brand) => ({
  name: brand.name,
  slug: brand.slug,
  logo: brand.imageUrl,
  category: brand.categories.join(', '),
}));

// ============================================================================
// Data Fetching Functions
// ============================================================================

/**
 * Fetch all categories with their subcategories
 * This function can be replaced with actual Decap CMS data fetching
 */
export async function fetchCategories(): Promise<Category[]> {
  // Simulating async data fetch (replace with actual CMS call)
  return Promise.resolve(mockCategories);
}

/**
 * Fetch a single category by slug
 */
export async function fetchCategoryBySlug(slug: string): Promise<Category | undefined> {
  const categories = await fetchCategories();
  return categories.find(cat => cat.slug === slug);
}

/**
 * Fetch all brands
 * This function can be replaced with actual Decap CMS data fetching
 */
export async function fetchBrands(): Promise<Brand[]> {
  // Simulating async data fetch (replace with actual CMS call)
  return Promise.resolve(mockBrands);
}

/**
 * Fetch a single brand by slug
 */
export async function fetchBrandBySlug(slug: string): Promise<Brand | undefined> {
  const brands = await fetchBrands();
  return brands.find(brand => brand.slug === slug);
}

// ============================================================================
// Legacy Exports (for backward compatibility with existing code)
// ============================================================================

import categoriesData from '../data/categories.json';

export const categories = categoriesData;

export function getSubcategories(categorySlug: string): string[] {
  const category = categories[categorySlug as keyof typeof categories];
  if (!category || typeof category !== 'object') return [];
  return Object.keys(category);
}

export function getSubSubcategories(categorySlug: string, subcategorySlug: string): string[] {
  const category = categories[categorySlug as keyof typeof categories];
  if (!category || typeof category !== 'object') return [];
  const subcategory = (category as Record<string, Record<string, unknown>>)[subcategorySlug];
  if (!subcategory) return [];
  return Object.keys(subcategory);
}

export function getAllCategoryPaths(): Array<{ category: string; subcategory?: string; subSubcategory?: string }> {
  const paths: Array<{ category: string; subcategory?: string; subSubcategory?: string }> = [];
  for (const [cat, subcats] of Object.entries(categories)) {
    paths.push({ category: cat });
    if (typeof subcats === 'object' && subcats !== null) {
      for (const subcat of Object.keys(subcats)) {
        paths.push({ category: cat, subcategory: subcat });
        const subsubcats = (subcats as Record<string, Record<string, unknown>>)[subcat];
        if (typeof subsubcats === 'object' && subsubcats !== null) {
          for (const subsub of Object.keys(subsubcats)) {
            paths.push({ category: cat, subcategory: subcat, subSubcategory: subsub });
          }
        }
      }
    }
  }
  return paths;
}
