const fs = require('fs');
const path = require('path');

const PENDING_FILE = path.join(__dirname, '../netlify/functions/pending_products.json');
const PRODUCTS_JSON = path.join(__dirname, '../src/data/products.json');

if (!fs.existsSync(PENDING_FILE)) {
  console.log('No pending products to merge.');
  process.exit(0);
}

const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
let currentProducts = [];
if (fs.existsSync(PRODUCTS_JSON)) {
  currentProducts = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
}

const merged = [...currentProducts, ...pending];
fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(merged, null, 2));
console.log(`✅ Merged ${pending.length} products into ${PRODUCTS_JSON}`);

// Optional: also update your Excel file using xlsx or exceljs
// (you can call your existing convert script backwards)

// Clear pending file
fs.writeFileSync(PENDING_FILE, '[]');
console.log('Cleared pending queue.');