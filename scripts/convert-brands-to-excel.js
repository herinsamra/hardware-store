import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Folder containing your brand JSON files (e.g., inventaa.json, havells.json, etc.)
const brandsFolder = path.join(__dirname, '../brand-data');
// Output Excel file
const outputExcel = path.join(__dirname, '../products.xlsx');

// Get all .json files in the folder
const jsonFiles = fs.readdirSync(brandsFolder).filter(f => f.endsWith('.json'));

const allRows = [];

for (const file of jsonFiles) {
  const filePath = path.join(brandsFolder, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  if (!data.products || !Array.isArray(data.products)) {
    console.warn(`Skipping ${file}: missing "products" array`);
    continue;
  }
  
  for (const product of data.products) {
    // If variants exist, create one row per variant
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        allRows.push({
          name: product.name,
          price: variant.new_mrp,
          description: product.description,
          category: product.category,
          subcategory: product.subcategory,
          subSubcategory: product.subsubcategory,
          sku: variant.sku,
          part_no: variant.part_no,
          variant_name: variant.variant_name,
          brand: product.brand,
          images: product.image || '',
          stock: variant.stock || 0,          // optional, default 0
        });
      }
    } else {
      // No variants: treat product as single row
      allRows.push({
        name: product.name,
        price: product.price || 0,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        subSubcategory: product.subsubcategory,
        sku: product.sku,
        part_no: product.part_no || '',
        variant_name: '',
        brand: product.brand,
        images: product.image || '',
        stock: product.stock || 0,
      });
    }
  }
}

// Create Excel worksheet
const ws = XLSX.utils.json_to_sheet(allRows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Products');
XLSX.writeFile(wb, outputExcel);

console.log(`✅ Converted ${jsonFiles.length} brand files into ${outputExcel} with ${allRows.length} rows.`);