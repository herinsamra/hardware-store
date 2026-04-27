# Refactor Add Product Flow and Modernize UI

This plan addresses the clutter and confusion in the current `add-product` implementation, while making it more robust and providing a "wow" user experience.

## Goal
To provide a clean, modern, and beautiful form for adding products locally. The form will automatically generate captivating AI descriptions and metadata using the Gemini API, and it will save the new product directly to `products.xlsx` (which is the source of truth).

## User Review Required

> [!IMPORTANT]
> **Source of Truth for Products**
> Currently, the project converts `products.xlsx` into `src/data/products.json` during build/dev. Because of this, saving new products to a "pending" JSON file was confusing and required an extra merge step. 
> **My proposal:** The new API endpoint will directly append the new product to `products.xlsx` and then update `products.json` automatically. This way, your Excel file is always up to date and you don't have to manually merge anything.

> [!WARNING]
> **Local Use Only**
> Since this updates a local file (`products.xlsx`), this Admin form is designed to be used while running the site locally (e.g., via `npm run dev`). Once you add the products, you commit and push your changes to update the live website.

## Proposed Changes

### 1. Update Backend API (Astro Endpoint)
- **[NEW]** `src/pages/api/add-product.js`: This endpoint will replace the Netlify function. It will:
  1. Receive the product data from the frontend.
  2. Call the Gemini API to generate a compelling, creative description and meta tags.
  3. Load `products.xlsx`, append a new row with all the data (including the AI-generated fields), and save the Excel file.
  4. Also update `src/data/products.json` immediately so the UI reflects the new product without needing a restart.
- **[DELETE]** `netlify/functions/add-product.js` and `netlify/functions/add-product.cjs` as they are no longer needed.
- **[DELETE]** `scripts/merge-products.js` as the merge step is obsolete.
- **[DELETE]** `pending_products.json` (if it exists).

### 2. Modernize the Admin UI
- **[MODIFY]** `src/pages/admin/add-product.astro`:
  - Completely redesign the user interface to be a highly premium, dark-mode glassmorphism design with vibrant accents, modern typography, and smooth micro-animations.
  - Improve the form layout to make it intuitive and uncluttered.
  - Update the frontend script to submit directly to `/api/add-product`.
  - Handle form submission states (loading, success, error) with polished visual feedback.

### 3. Astro Configuration
- **[MODIFY]** `astro.config.mjs`:
  - Add `@astrojs/node` adapter and set `output: 'hybrid'` so that the API endpoint is allowed to run dynamically on the server/locally while keeping the rest of the site static.

## Verification Plan

### Automated/Manual Verification
- Run the local dev server.
- Navigate to `/admin/add-product`.
- Fill in the required fields and submit the form.
- Verify that the loading state looks great.
- Verify that the Gemini API succeeds and populates the UI with the generated content.
- Verify that the new product has been appended correctly to `products.xlsx`.
- Verify that the new product immediately appears on the `/products` page.
