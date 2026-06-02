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

function normalizeFeatureList(value) {
  const explanationPattern = /\b(enjoy|ensures?|offers?|provides?|enhances?|maximi[sz]es?|perfect|superior|effortless|luxurious|peace of mind|assured|lasting|stylish|reliable|premium|easy|modern|comfortable|confidence)\b/i;
  const stringifySpec = item => {
    if (!item || typeof item !== 'object') return String(item || '');
    const entries = Object.entries(item).filter(([, val]) => val !== undefined && val !== null && String(val).trim());
    if (entries.length === 0) return '';
    if (entries.length === 1) {
      const [[key, val]] = entries;
      return `${key}: ${val}`;
    }
    const label = item.name || item.label || item.key || item.spec || item.title;
    const detail = item.value || item.detail || item.description || item.text;
    if (label && detail) return `${label}: ${detail}`;
    return entries.map(([key, val]) => `${key}: ${val}`).join(', ');
  };
  const cleanFeatureLabel = item => {
    const cleaned = stringifySpec(item)
      .replace(/^\s*(?:[-*\u2022]|\d+[.)])\s*/, '')
      .trim()
      .replace(/[.]+$/, '');
    const colonIndex = cleaned.indexOf(':');
    if (colonIndex === -1) return cleaned;

    const name = cleaned.slice(0, colonIndex).trim();
    const detail = cleaned.slice(colonIndex + 1).trim().replace(/[.]+$/, '');
    if (!detail || detail.length > 48 || explanationPattern.test(detail)) return name;
    return `${name}: ${detail}`;
  };

  if (Array.isArray(value)) {
    return value
      .map(cleanFeatureLabel)
      .filter(Boolean)
      .slice(0, 5);
  }

  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return normalizeFeatureList(parsed);
  } catch (e) {}

  return value
    .split(/\r?\n|,/)
    .map(cleanFeatureLabel)
    .filter(Boolean)
    .slice(0, 5);
}

async function generateAI(productName, subsubcategory, brand, type, isFeatured, customFeatures) {
  const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const featuredInstruction = isFeatured ? '\n3️⃣ A short, extremely catchy, innovative, and compelling ad slogan (max 8 words) to be used in an eye-catching featured product banner.' : '';
  const specificationsInstruction = customFeatures ? `\n- Use these provided product details as technical specifications where relevant: "${customFeatures}"` : '';
  const jsonKeys = isFeatured ? '"description", "specifications", "meta_title", "meta_description", "slogan"' : '"description", "specifications", "meta_title", "meta_description"';

  const prompt = `You are a premium hardware copywriter. Write a concise, SEO‑friendly product description (max 620 characters) that focuses on the sub‑sub‑category (${subsubcategory}) and highlights:
- Exact product name and brand
- Technical details, finish, size, material, mounting, wattage, capacity, warranty, or other real specifications
- Ideal use‑case or setting
- A subtle invitation to the buyer${specificationsInstruction}

Also create:
0. 4 to 6 technical specification points in a JSON array named "specifications". This must be an array of strings, not objects. Use factual product specs only. Prefer concise key-value style like "Material: Brass", "Finish: Chrome", "Mount Type: Wall Mounted", "Size: 600 mm". Do not write benefits, explanations, sales copy, or catchy phrases.
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
  // Return default values if AI fails, but incorporate custom specifications if provided.
  return {
    description: `Premium ${productName} by ${brand}, a top-quality ${subsubcategory} for practical use. ${customFeatures ? 'Technical specifications: ' + customFeatures + '.' : ''}`.trim(),
    meta_title: `${brand} ${productName} – Premium ${subsubcategory}`,
    meta_description: `${productName} by ${brand}: SEO‑friendly, high‑performance ${subsubcategory} for modern installations.`,
    specifications: normalizeFeatureList(customFeatures).length
      ? normalizeFeatureList(customFeatures)
      : ['Brand: ' + brand, 'Category: ' + subsubcategory, 'Type: ' + (type || 'Standard')],
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
      key_features: JSON.stringify(normalizeFeatureList(ai.specifications || ai.features)),
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
      featured_link: sanitizeInput(productInput.featured_link) || '',
      featured_link_type: sanitizeInput(productInput.featured_link_type) || 'product',
      featured_button_text: sanitizeInput(productInput.featured_button_text) || '',
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
