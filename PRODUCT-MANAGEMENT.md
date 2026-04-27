# Product Management Workflow

This document explains how to add new products to your hardware store website.

## Adding Products

The process for adding products to the website consists of two steps:

### Step 1: Submit Product via Form
1. Go to the "Add Product" form on your website
2. Fill in all required fields:
   - Part Number
   - Category, Subcategory, and Sub-Subcategory
   - Product Name
   - Brand
   - MRP (Maximum Retail Price)
   - Any other required fields
3. Click "Submit"
4. The product will be saved to the pending queue (`pending_products.json`)

> Note: After submitting, the product will not immediately appear on the website. It will be placed in a moderation queue.

### Step 2: Merge Pending Products
After a product is submitted, you need to manually merge it with the main product catalog:

```bash
cd my-products-site
npm run merge-products
```

This command:
- Takes all pending products from `pending_products.json`
- Adds them to the main `src/data/products.json` file
- Removes the `pending_products.json` file
- The products will now be available on your website

## Troubleshooting

### Product doesn't appear on website after submission
- Check if the product is in the pending queue: `cat pending_products.json`
- If it's there, run the merge command: `npm run merge-products`
- Rebuild the website if necessary: `npm run build`

### Netlify Function Issues
The product submission endpoint is located at `netlify/functions/add-product.js`. Make sure:
- Your form sends a POST request to the correct endpoint
- The GEMINI_API_KEY environment variable is set in your deployment platform
- The function has write permissions to create the pending_products.json file

## Development Workflow

During development:
1. After merging products, rebuild the site with `npm run dev` to see changes
2. The `npm run dev` command runs the conversion script automatically before starting the development server

## Production Deployment

When deployed:
1. Products submitted via the form go to the pending queue
2. Periodically merge pending products using the `merge-products` script
3. Trigger a new build/deployment to make the products live