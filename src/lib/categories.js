import categoriesData from '../data/categories.json';

// Cast to the correct type (or use JSDoc for type safety)
/** @type {import('../types/categories').CategoriesData} */
export const categories = categoriesData;

/**
 * @param {string} categorySlug
 * @returns {string[]}
 */
export function getSubcategories(categorySlug) {
  const category = categories[categorySlug];
  if (!category) return [];
  return Object.keys(category);
}

/**
 * @param {string} categorySlug
 * @param {string} subcategorySlug
 * @returns {string[]}
 */
export function getSubSubcategories(categorySlug, subcategorySlug) {
  const subcategory = categories[categorySlug]?.[subcategorySlug];
  if (!subcategory) return [];
  return Object.keys(subcategory);
}

/**
 * @returns {Array<{category: string, subcategory?: string, subSubcategory?: string}>}
 */
export function getAllCategoryPaths() {
  const paths = [];
  for (const [cat, subcats] of Object.entries(categories)) {
    paths.push({ category: cat });
    for (const subcat of Object.keys(subcats)) {
      paths.push({ category: cat, subcategory: subcat });
      for (const subsub of Object.keys(subcats[subcat])) {
        paths.push({ category: cat, subcategory: subcat, subSubcategory: subsub });
      }
    }
  }
  return paths;
}