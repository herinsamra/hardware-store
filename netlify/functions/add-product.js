const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const PENDING_FILE = path.join(__dirname, 'pending_products.json');

// Helper: Generate unique slug
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Helper: call Gemini to generate description, meta_title, meta_description
async function generateAI(productName, category, subcategory, brand, type) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are an SEO expert for a hardware store. Generate:
1. A compelling product description (2-3 sentences)
2. A meta title (max 60 chars) including brand and product name
3. A meta description (max 160 chars) including key features and brand

Product: ${productName}
Category: ${category} > ${subcategory}
Brand: ${brand}
Type: ${type || 'standard'}

Respond in valid JSON format ONLY, no extra text:
{
  "description": "...",
  "meta_title": "...",
  "meta_description": "..."
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Clean up markdown code blocks if present
  const cleanedText = text.replace(/```json\s*|\s*```/g, '');
  return JSON.parse(cleanedText);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const productInput = JSON.parse(event.body);

    // Validate required fields
    const required = ['part_no', 'category', 'subcategory', 'subsubcategory', 'product_name', 'brand', 'mrp'];
    for (let field of required) {
      if (!productInput[field]) {
        return { statusCode: 400, body: JSON.stringify({ error: `Missing ${field}` }) };
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

    // Create slug from product name + part_no
    const baseSlug = slugify(productInput.product_name);
    const slug = `${productInput.part_no.toLowerCase()}-${baseSlug}`;

    // Build complete product object
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
      sku: productInput.part_no,
    };

    // Append to pending_products.json
    let pending = [];
    if (fs.existsSync(PENDING_FILE)) {
      pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
    }
    pending.push(newProduct);
    fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Product saved to pending queue',
        product: newProduct,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};