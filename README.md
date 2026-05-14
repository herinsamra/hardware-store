# Astro Starter Kit: Basics

## 🛠️ Maintenance & Administration Guide

### Key Features
- **Product Management**: Add, update, and manage product listings.
- **SEO Optimization**: Automatically generate sitemaps and product feeds.
- **Responsive Design**: Mobile-friendly navigation with smooth animations.
- **Security**: Prevent image downloads and enforce CORS policies.
- **Data Validation**: Robust input validation for product data
- **Structured Data**: Built-in JSON-LD schemas for rich search results

### Setup Instructions
1. Clone the repository.
2. Install dependencies using `npm install`.
3. Configure environment variables in Netlify:
   - `SITE_URL`: Full HTTPS domain (e.g., https://yourdomain.com)
   - Other required keys as per project documentation.
4. Run the development server using `npm run dev`.

### Development Workflow
1. **Adding Products**: Use the `/api/add-product.js` endpoint to add new products directly to `products.json`.
2. **Data Validation**: Ensure all inputs comply with validation rules (e.g., MRP must be a positive number, image URLs must come from trusted CDNs).
3. **SEO Updates**: Changes to product data trigger automatic updates to `sitemap.xml` and `product-feed.xml`.
4. **Schema.org Integration**: JSON-LD schemas are dynamically generated based on product data.

## Internal Workings

### Product Management
1. **Add Product**: New products are added via the `/api/add-product.js` endpoint.
   - Data is validated against strict rules (e.g., MRP must be positive, image URLs from trusted CDNs).
   - Products are directly written to `products.json` and `products.xlsx`.
2. **Data Storage**: Product data is stored in `src/data/products.json`.
3. **Pending Queue Removal**: The previous pending queue system (`pending_products.json`) has been deprecated.

### SEO Integration
1. **Sitemap Generation**: 
   - Automatically generated during build.
   - Contains URLs for all published products.
2. **Product Feed**: 
   - Follows Google Merchant Center standards.
   - Includes fields like price, availability, image link, and brand.
3. **Schema.org**: 
   - JSON-LD schemas are dynamically injected into HTML `<head>`.
   - Schemas include Organization, WebSite, and Product types.

### Security Measures
1. **Image Protection**: Prevents downloads via JavaScript and CSS.
2. **CORS Policies**: Enforced on all API endpoints.
3. **Input Sanitization**: All inputs are sanitized to prevent XSS attacks.

### Deployment Process
1. **Build**: Push changes to the main branch.
2. **Automated Deployment**: Netlify builds and deploys the site automatically.
3. **Verification**: Check `sitemap.xml`, `product-feed.xml`, and live product pages.

### SEO and Data Management
- **Sitemap Generation**: Automatically updated during builds with priority and changefrequency metadata
- **Product Feed**: Follows Google Merchant Center standards with automatic currency conversion
- **Structured Data**: Implements Schema.org standards with Organization, WebSite, Product, and BreadcrumbList schemas
- **SEO Best Practices**: Includes Open Graph tags, Twitter cards, and canonical URLs

```sh
npm create astro@latest -- --template basics
```
Cloudinary Image Format
{
  "id": 1017,
  "name": "VLOC 1017",
  "category": "ONE PIECE TOILETS",
  "image": "https://res.cloudinary.com/YOUR_NAME/image/upload/vloc1017.jpg",
  "price": "₹8475"
}

## 🛡️ Security Measures

### Implementation Details
- **Image Protection**: JavaScript event listeners prevent right-click context menus on images
- **CORS Policies**: API routes include strict Access-Control-Allow-Origin headers
- **Input Validation**: All user input is sanitized using DOMPurify and validated against schema rules
- **Rate Limiting**: API endpoints implement rate limiting to prevent abuse
- **Content Security**: CSP headers configured to prevent unauthorized script execution

## 🚀 Deployment Process

### CI/CD Workflow
1. Push changes to the main branch
2. Netlify triggers automatic build process
3. Post-build checks verify:
   - Sitemap completeness (`sitemap.xml`)
   - Product feed validity (`product-feed.xml`)
   - Internal link health
4. Deployment to production environment
5. Verification of live product pages and structured data

### Manual Verification
1. Use Google Search Console to test sitemap submission
2. Validate product feed using Google's Merchant Center diagnostics
3. Check browser console for CSP violations
4. Test form submissions with invalid and valid data
5. Verify responsive behavior on multiple device sizes

## 📊 Monitoring & Maintenance

### Recommended Practices
- Weekly checks of Google Search Console for indexing issues
- Monthly validation of product feed against Google standards
- Quarterly security audits of API endpoints
- Bi-annual review of dependencies for updates and security patches
- Continuous monitoring of Netlify build logs for errors

## 🚨 Troubleshooting Common Issues
**Sitemap not updating**:
- Check .gitignore for excluded content
- Verify build process completes fully
- Confirm `sitemap.xml` is in the dist directory

**Product feed errors**:
- Validate JSON structure in `products.json`
- Check currency format matches Google requirements
- Ensure all required fields are present

**Security policy violations**:
- Review browser console for CSP warnings
- Check Netlify headers configuration
- Validate image protection scripts are loading

## 🛠️ Project Structure

### Directory Tree
```
.
├── my-products-site
│   ├── antigravity
│   │   └── implementation_plan.md
│   ├── brand-data
│   │   └── inventaa.json
│   ├── scripts
│   │   ├── convert-brands-to-excel.js
│   │   ├── convert-excel.js
│   │   └── generate-excel-lookups.js
│   ├── src
│   │   ├── data
│   │   │   ├── brands.json
│   │   │   ├── categories.json
│   │   │   └── products.json
│   │   ├── lib
│   │   │   ├── brands.js
│   │   │   ├── cacheHeaders.js
│   │   │   ├── categories.js
│   │   │   ├── categories.ts
│   │   │   ├── products.js
│   │   │   └── seo.js
│   │   ├── pages
│   │   │   ├── api
│   │   │   │   ├── product
│   │   │   │   │   └── [id].js
│   │   │   │   ├── add-product.js
│   │   │   │   ├── get-brands.js
│   │   │   │   ├── get-categories.js
│   │   │   │   └── manage-brands.js
│   │   │   │   └── manage-categories.js
│   │   │   ├── product-feed.xml.js
│   │   │   ├── robots.txt.js
│   │   │   └── sitemap.xml.js
│   │   ├── styles
│   │   │   └── global.css
│   │   └── types
│   │       └── categories.ts
│   ├── PRODUCT-MANAGEMENT.md
│   ├── README.md
│   ├── astro.config.mjs
│   ├── env.d.ts
│   ├── netlify.toml
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tailwind.config.mjs
│   └── tsconfig.json
└── brand.json
```

### File Descriptions
- **implementation_plan.md**: Documentation for the project's implementation plan.
- **inventaa.json**: Brand data stored in JSON format.
- **convert-brands-to-excel.js**: Script to convert brand data to Excel format.
- **convert-excel.js**: General script for Excel conversions.
- **generate-excel-lookups.js**: Generates lookup tables in Excel.
- **brands.json**, **categories.json**, **products.json**: Data files storing brands, categories, and products respectively.
- **brands.js**, **categories.js**, **products.js**: JavaScript modules handling data operations for brands, categories, and products.
- **cacheHeaders.js**: Module to manage HTTP cache headers.
- **seo.js**: SEO-related utilities.
- **[id].js**: API endpoint to fetch individual product details.
- **add-product.js**: Endpoint to add new products.
- **get-brands.js**, **get-categories.js**: Endpoints to retrieve brands and categories.
- **manage-brands.js**, **manage-categories.js**: Endpoints for managing brands and categories.
- **product-feed.xml.js**, **robots.txt.js**, **sitemap.xml.js**: Generate product feed, robots.txt, and sitemap.xml respectively.
- **global.css**: Global CSS styles.
- **categories.ts**: TypeScript definitions for categories.
- **PRODUCT-MANAGEMENT.md**: Documentation on product management processes.
- **astro.config.mjs**: Astro configuration file.
- **env.d.ts**: Environment variable type definitions.
- **netlify.toml**: Netlify configuration.
- **package-lock.json**, **package.json**: Dependency management files.
- **postcss.config.mjs**, **tailwind.config.mjs**: PostCSS and Tailwind CSS configurations.
- **tsconfig.json**: TypeScript configuration.
- **brand.json**: JSON file containing brand data.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?



```

```

```
