export const prerender = false;

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function generateAI(productName, category, subcategory, brand, type) {
  const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a creative copywriter for a premium hardware brand. Write a *highly personalized* product description that feels like a story, highlighting:
- the exact product name and brand,
- its distinctive color, finish, and any unique features,
- the ideal use‑case or space where it shines,
- a subtle invitation to the buyer.
Also create:
1️⃣ A meta title (≤60 characters) that combines the brand and product name with a touch of luxury.
2️⃣ A meta description (≤160 characters) that captures the essence and key benefit.

Use ONLY valid JSON with the keys "description", "meta_title", and "meta_description". No extra text.

Product: ${productName}
Category: ${category} > ${subcategory}
Brand: ${brand}
Type: ${type || 'standard'}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json\s*|\s*```/g, '');
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('AI Generation Error:', error);
    // Return default values if AI fails
    return {
      description: `Premium ${productName} from ${brand}. Enhance your setup with this high-quality hardware component.`,
      meta_title: `${productName} - ${brand} | Premium Hardware`,
      meta_description: `Discover the ${productName} by ${brand}. High performance and reliability for your needs.`
    };
  }
}

export async function POST({ request }) {
  try {
    let productInput;
    try {
      productInput = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }

    const required = ['part_no', 'category', 'subcategory', 'subsubcategory', 'product_name', 'brand', 'mrp'];
    for (let field of required) {
      if (!productInput[field]) {
        return new Response(JSON.stringify({ error: `Missing ${field}` }), { status: 400 });
      }
    }

    // Generate AI content
    const ai = await generateAI(
      productInput.product_name,
      productInput.category,
      productInput.subcategory,
      productInput.brand,
      productInput.type
    );

    const slug = slugify(productInput.product_name);

    const newProduct = {
      part_no: productInput.part_no,
      category: productInput.category,
      subcategory: productInput.subcategory,
      subsubcategory: productInput.subsubcategory,
      type: productInput.type || '',
      product_name: productInput.product_name,
      description: ai.description,
      brand: productInput.brand,
      images: productInput.images || '',
      variant_name: productInput.variant_name || '',
      mrp: productInput.mrp.toString(),
      slug: slug,
      meta_title: ai.meta_title,
      meta_description: ai.meta_description,
      // Include SKU only if provided explicitly
      ...(productInput.sku ? { sku: productInput.sku } : {}),
    };

    // Update Excel file
    const excelPath = path.join(projectRoot, 'products.xlsx');
    
    let workbook;
    let sheetName;
    let existingData = [];

    if (fs.existsSync(excelPath)) {
      workbook = XLSX.readFile(excelPath);
      sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      existingData = XLSX.utils.sheet_to_json(sheet);
    } else {
      workbook = XLSX.utils.book_new();
      sheetName = 'Products';
    }

    // Check if part_no already exists
    const exists = existingData.some(row => row.part_no === newProduct.part_no);
    if (exists) {
      return new Response(JSON.stringify({ error: 'Product with this part_no already exists' }), { status: 409 });
    }

    existingData.push(newProduct);

    // Create a new worksheet from the updated data
    const newSheet = XLSX.utils.json_to_sheet(existingData);
    workbook.Sheets[sheetName] = newSheet;
    
    // Add sheet to workbook if it was newly created
    if (!workbook.SheetNames.includes(sheetName)) {
      XLSX.utils.book_append_sheet(workbook, newSheet, sheetName);
    }

    // Write back to Excel
    XLSX.writeFile(workbook, excelPath);

    // Also update products.json directly to keep it in sync without needing to run convert-excel.js manually
    const jsonPath = path.join(projectRoot, 'src', 'data', 'products.json');
    if (fs.existsSync(path.dirname(jsonPath))) {
      fs.writeFileSync(jsonPath, JSON.stringify(existingData, null, 2));
    }

    return new Response(JSON.stringify({
      message: 'Product saved successfully',
      product: newProduct,
    }), { status: 200 });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), { status: 500 });
  }
}
