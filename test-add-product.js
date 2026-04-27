// Test script to simulate adding a product to pending_products.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PENDING_FILE = path.join(__dirname, 'pending_products.json');

// Example product to test with
const testProduct = {
  part_no: "TEST001",
  category: "Electrical",
  subcategory: "Switches",
  subsubcategory: "Dimmer_Switches",
  type: "Standard",
  product_name: "Test Product for Verification",
  description: "This is a test product to verify the add product workflow is working.",
  brand: "TestBrand",
  images: "",
  variant_name: "Standard",
  mrp: "999",
  slug: "test001-test-product-for-verification",
  meta_title: "Test Product for Verification - Hardware Store",
  meta_description: "Test product to verify the product addition workflow.",
  sku: "TEST001",
};

// Read existing pending products or initialize as empty array
let pending = [];
if (fs.existsSync(PENDING_FILE)) {
  pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
}

// Add the test product
pending.push(testProduct);

// Write back to the file
fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));

console.log(`✅ Added test product to pending queue. Total pending products: ${pending.length}`);
console.log("Now run: npm run merge-products");