export const prerender = false;

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { jsonResponse } from '../../lib/cacheHeaders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

// Utility function to sanitize input
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/data:/gi, '') // Remove data:
    .trim();
}

// Validate image URL
function isValidImageUrl(url) {
  try {
    if (!url || typeof url !== 'string') return false;
    
    // Check if it's a valid URL format
    const parsedUrl = new URL(url);
    const isCloudinaryOrValidDomain = parsedUrl.hostname.includes('cloudinary.com') || 
                                     parsedUrl.hostname.includes('res.cloudinary.com') ||
                                     parsedUrl.hostname.includes('images.unsplash.com') ||
                                     parsedUrl.hostname.includes('cdn.pixabay.com') ||
                                     /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);
                                     
    return isCloudinaryOrValidDomain;
  } catch (e) {
    return false;
  }
}

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function getModelCandidates() {
  const configuredModels =
    import.meta.env.GEMINI_MODELS ||
    process.env.GEMINI_MODELS ||
    import.meta.env.GEMINI_MODEL ||
    process.env.GEMINI_MODEL ||
    '';

  const parsedModels = configuredModels
    .split(',')
    .map(model => model.trim())
    .filter(Boolean);

  return parsedModels.length
    ? [...new Set(parsedModels)]
    : ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'];
}

async function generateAI(productName, subsubcategory, brand, type, isFeatured, customFeatures) {
  const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const featuredInstruction = isFeatured ? '\n3️⃣ A short, extremely catchy, innovative, and compelling ad slogan (max 8 words) to be used in an eye-catching featured product banner.' : '';
  const featuresInstruction = customFeatures ? `\n- Intelligently weave these exact keywords/features into the description naturally: "${customFeatures}"` : '';
  const jsonKeys = isFeatured ? '"description", "meta_title", "meta_description", "slogan"' : '"description", "meta_title", "meta_description"';

  const prompt = `You are a premium hardware copywriter. Write a concise, SEO‑friendly product description (max 620 characters) that focuses on the sub‑sub‑category (${subsubcategory}) and highlights:
- Exact product name and brand
- Distinctive features and finish
- Ideal use‑case or setting
- A subtle invitation to the buyer${featuresInstruction}

Also create:
1️⃣ A meta title (≤60 characters) blending brand and product name.
2️⃣ A meta description (≤160 characters) that is SEO‑optimized.${featuredInstruction}

Output ONLY valid JSON with keys ${jsonKeys}.

Product: ${productName}
Sub‑sub‑category: ${subsubcategory}
Brand: ${brand}
Type: ${type || 'standard'}
`;

  const modelsToTry = getModelCandidates();
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const cleanedText = text.replace(/```json\s*|\s*```/g, '');
      return JSON.parse(cleanedText);
    } catch (error) {
      console.warn(`Model ${modelName} failed:`, error.message);
      lastError = error;
      // Wait a short delay before trying the next model
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.error('AI Generation Error (All fallback models failed):', lastError);
  // Return default values if AI fails, but incorporate custom features if provided
  return {
    description: `Premium ${productName} by ${brand}, a top‑quality ${subsubcategory} offering sleek design and reliable performance. ${customFeatures ? 'Key features include: ' + customFeatures + '.' : ''}`.trim(),
    meta_title: `${brand} ${productName} – Premium ${subsubcategory}`,
    meta_description: `${productName} by ${brand}: SEO‑friendly, high‑performance ${subsubcategory} for modern installations.`,
    slogan: isFeatured ? `Experience the best ${productName} today!` : ''
  };
}

export async function POST({ request }) {
  try {
    let productInput;
    try {
      productInput = await request.json();
    } catch (e) {
      return jsonResponse({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Sanitize all string inputs
    for (const key in productInput) {
      if (typeof productInput[key] === 'string') {
        productInput[key] = sanitizeInput(productInput[key]);
      }
    }

    // Validate required fields
    const required = ['part_no', 'category', 'subcategory', 'subsubcategory', 'product_name', 'brand', 'mrp'];
    for (let field of required) {
      if (!productInput[field]) {
        return jsonResponse({ error: `Missing ${field}` }, { status: 400 });
      }
    }

    // Validate product name length (max 56 chars)
    if (productInput.product_name && productInput.product_name.length > 56) {
      return jsonResponse({ error: 'Product name must not exceed 56 characters' }, { status: 400 });
    }

    // Validate price (must be positive number)
    const mrp = parseFloat(productInput.mrp);
    if (isNaN(mrp) || mrp <= 0) {
      return jsonResponse({ error: 'MRP must be a positive number' }, { status: 400 });
    }

    // Validate image URLs if provided
    if (productInput.images) {
      const imageUrls = Array.isArray(productInput.images) 
        ? productInput.images 
        : productInput.images.split(',');
      
      for (const imageUrl of imageUrls) {
        const trimmedUrl = imageUrl.trim();
        if (trimmedUrl && !isValidImageUrl(trimmedUrl)) {
          return jsonResponse({ error: `Invalid image URL: ${trimmedUrl}` }, { status: 400 });
        }
      }
    }

    // Validate video URL if provided
    if (productInput.video_url && productInput.video_url.trim()) {
      try {
        new URL(productInput.video_url.trim());
      } catch (e) {
        return jsonResponse({ error: 'Invalid video URL' }, { status: 400 });
      }
    }

    // Convert part_no to uppercase
    productInput.part_no = productInput.part_no.toUpperCase();

    // Generate AI content
    const ai = await generateAI(
      productInput.product_name,
      productInput.subsubcategory,
      productInput.brand,
      productInput.type,
      productInput.is_featured === true || productInput.is_featured === 'true',
      productInput.custom_features
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
      video_url: productInput.video_url || '',
      variant_name: productInput.variant_name || '',
      mrp: productInput.mrp.toString(),
      slug: slug,
      unit: productInput.unit || '',
      meta_title: ai.meta_title,
      meta_description: ai.meta_description,
      is_featured: productInput.is_featured === true || productInput.is_featured === 'true' ? 'true' : 'false',
      slogan: ai.slogan || '',
      ...(productInput.sku ? { sku: productInput.sku } : {}),
      variants: productInput.variants && productInput.variants.length > 0 ? JSON.stringify(productInput.variants) : ''
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
      return jsonResponse({ error: 'Product with this part_no already exists' }, { status: 409 });
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
      const jsonDataToSave = existingData.map(item => {
        let variantsArray = [];
        if (item.variants) {
          try {
            variantsArray = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
          } catch(e) {}
        }
        const cleanedItem = { ...item };
        if (variantsArray && variantsArray.length > 0) {
          cleanedItem.variants = variantsArray;
        } else {
          delete cleanedItem.variants; // Keep clean JSON if no variants
        }
        return cleanedItem;
      });
      fs.writeFileSync(jsonPath, JSON.stringify(jsonDataToSave, null, 2));
    }

    return jsonResponse({
      message: 'Product saved successfully',
      product: newProduct,
    }, { status: 200 });

  } catch (error) {
    console.error('Function error:', error);
    return jsonResponse({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
