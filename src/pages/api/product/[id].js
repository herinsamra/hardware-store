export const prerender = false;

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../../');

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function generateAI(productName, category, subcategory, brand, type, isFeatured) {
  const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const featuredInstruction = isFeatured ? '\n3️⃣ A short, extremely catchy, innovative, and compelling ad slogan (max 8 words) to be used in an eye-catching featured product banner.' : '';
  const jsonKeys = isFeatured ? '"description", "meta_title", "meta_description", "slogan"' : '"description", "meta_title", "meta_description"';

  const prompt = `You are a creative copywriter for a premium hardware brand. Write a *highly personalized* product description that feels like a story, highlighting:
- the exact product name and brand,
- its distinctive color, finish, and any unique features,
- the ideal use‑case or space where it shines,
- a subtle invitation to the buyer.
Also create:
1️⃣ A meta title (≤60 characters) that combines the brand and product name with a touch of luxury.
2️⃣ A meta description (≤160 characters) that captures the essence and key benefit.${featuredInstruction}

Use ONLY valid JSON with the keys ${jsonKeys}. No extra text.

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
    // Return empty on failure so we don't accidentally overwrite existing valid text with generic fallback
    return {
      description: "",
      meta_title: "",
      meta_description: "",
      slogan: ""
    };
  }
}

// PUT /api/product/[id] - Update a product
export async function PUT({ params, request }) {
  const targetPartNo = params.id;
  
  if (!targetPartNo) {
    return new Response(JSON.stringify({ error: 'Missing part number in URL' }), { status: 400 });
  }

  try {
    let updateData;
    try {
      updateData = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }

    const excelPath = path.join(projectRoot, 'products.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      return new Response(JSON.stringify({ error: 'Database (products.xlsx) not found' }), { status: 404 });
    }

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const existingData = XLSX.utils.sheet_to_json(sheet);

    const productIndex = existingData.findIndex(row => row.part_no === targetPartNo);

    if (productIndex === -1) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }

    const currentProduct = existingData[productIndex];

    // Check if AI needs regeneration
    let newDescription = updateData.description || currentProduct.description;
    let newMetaTitle = updateData.meta_title || currentProduct.meta_title;
    let newMetaDesc = updateData.meta_description || currentProduct.meta_description;

    let newSlogan = updateData.slogan !== undefined ? updateData.slogan : currentProduct.slogan;
    const isFeatured = updateData.is_featured === true || updateData.is_featured === 'true' || updateData.is_featured === 'on';

    if (updateData.regenerate_ai === 'on') {
      const ai = await generateAI(
        updateData.product_name || currentProduct.product_name,
        updateData.category || currentProduct.category,
        updateData.subcategory || currentProduct.subcategory,
        updateData.brand || currentProduct.brand,
        updateData.type || currentProduct.type,
        isFeatured
      );
      
      if (ai.description) newDescription = ai.description;
      if (ai.meta_title) newMetaTitle = ai.meta_title;
      if (ai.meta_description) newMetaDesc = ai.meta_description;
      if (isFeatured && ai.slogan) newSlogan = ai.slogan;
    }

    const newSlug = updateData.product_name ? slugify(updateData.product_name) : currentProduct.slug;

    // Merge updates
    const updatedProduct = {
      ...currentProduct,
      category: updateData.category || currentProduct.category,
      subcategory: updateData.subcategory || currentProduct.subcategory,
      subsubcategory: updateData.subsubcategory || currentProduct.subsubcategory || '',
      type: updateData.type || currentProduct.type || '',
      product_name: updateData.product_name || currentProduct.product_name,
      description: newDescription,
      brand: updateData.brand || currentProduct.brand,
      images: updateData.images || currentProduct.images || '',
      variant_name: updateData.variant_name || currentProduct.variant_name || '',
      mrp: updateData.mrp ? updateData.mrp.toString() : currentProduct.mrp,
      slug: newSlug,
      meta_title: newMetaTitle,
      meta_description: newMetaDesc,
      is_featured: isFeatured ? 'true' : 'false',
      slogan: newSlogan || '',
    };

    if (updateData.sku !== undefined) {
      updatedProduct.sku = updateData.sku;
      if (!updatedProduct.sku) delete updatedProduct.sku;
    }

    existingData[productIndex] = updatedProduct;

    // Save Excel
    const newSheet = XLSX.utils.json_to_sheet(existingData);
    workbook.Sheets[sheetName] = newSheet;
    XLSX.writeFile(workbook, excelPath);

    // Update JSON
    const jsonPath = path.join(projectRoot, 'src', 'data', 'products.json');
    if (fs.existsSync(path.dirname(jsonPath))) {
      fs.writeFileSync(jsonPath, JSON.stringify(existingData, null, 2));
    }

    return new Response(JSON.stringify({
      message: 'Product updated successfully',
      product: updatedProduct,
    }), { status: 200 });

  } catch (error) {
    console.error('Update Product Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), { status: 500 });
  }
}

// DELETE /api/product/[id] - Delete a product
export async function DELETE({ params }) {
  const targetPartNo = params.id;
  
  if (!targetPartNo) {
    return new Response(JSON.stringify({ error: 'Missing part number in URL' }), { status: 400 });
  }

  try {
    const excelPath = path.join(projectRoot, 'products.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      return new Response(JSON.stringify({ error: 'Database (products.xlsx) not found' }), { status: 404 });
    }

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const existingData = XLSX.utils.sheet_to_json(sheet);

    const initialLength = existingData.length;
    const newData = existingData.filter(row => row.part_no !== targetPartNo);

    if (newData.length === initialLength) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }

    // Save Excel
    const newSheet = XLSX.utils.json_to_sheet(newData);
    workbook.Sheets[sheetName] = newSheet;
    XLSX.writeFile(workbook, excelPath);

    // Update JSON
    const jsonPath = path.join(projectRoot, 'src', 'data', 'products.json');
    if (fs.existsSync(path.dirname(jsonPath))) {
      fs.writeFileSync(jsonPath, JSON.stringify(newData, null, 2));
    }

    return new Response(JSON.stringify({
      message: 'Product deleted successfully'
    }), { status: 200 });

  } catch (error) {
    console.error('Delete Product Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), { status: 500 });
  }
}
