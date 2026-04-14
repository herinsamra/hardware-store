// scripts/generate-excel-lookups.js
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Path to your categories.json – adjust if yours is elsewhere
const categoriesPath = path.join(__dirname, '../src/data/categories.json');
const outputExcel = path.join(__dirname, '../category-lookups.xlsx');

// Read and parse categories.json
const raw = fs.readFileSync(categoriesPath, 'utf8');
const categoriesData = JSON.parse(raw);

// Separate Brands from the rest
const { Brands, ...categories } = categoriesData;

// --- 1. Build the Lookups sheet (Category, Subcategory, Subsubcategory) ---
const lookupsRows = [];

for (const [catName, subcats] of Object.entries(categories)) {
  for (const [subcatName, subsubcats] of Object.entries(subcats)) {
    // If subsubcats is an array (empty array or list of sub‑sub‑categories)
    if (Array.isArray(subsubcats)) {
      // No deeper level – treat the subcategory itself as the leaf
      lookupsRows.push({
        Category: catName,
        Subcategory: subcatName,
        Subsubcategory: ''   // empty, meaning this subcategory has no further split
      });
    } else {
      // It's an object containing sub‑sub‑categories
      for (const subsubName of Object.keys(subsubcats)) {
        lookupsRows.push({
          Category: catName,
          Subcategory: subcatName,
          Subsubcategory: subsubName
        });
      }
    }
  }
}

// --- 2. Build the Brands sheet (unique brands from all categories) ---
const allBrands = new Set();
if (Brands && typeof Brands === 'object') {
  for (const brandList of Object.values(Brands)) {
    if (Array.isArray(brandList)) {
      brandList.forEach(b => allBrands.add(b));
    }
  }
}
const brandsRows = Array.from(allBrands).map(brand => ({ Brand: brand }));

// --- 3. Write to Excel file ---
const lookupsSheet = XLSX.utils.json_to_sheet(lookupsRows);
const brandsSheet = XLSX.utils.json_to_sheet(brandsRows);

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, lookupsSheet, 'Lookups');
XLSX.utils.book_append_sheet(workbook, brandsSheet, 'Brands');

XLSX.writeFile(workbook, outputExcel);

console.log(`✅ Excel file created: ${outputExcel}`);
console.log(`   - Lookups sheet: ${lookupsRows.length} rows`);
console.log(`   - Brands sheet: ${brandsRows.length} brands`);