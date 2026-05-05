export const prerender = false;
import fs from 'fs';
import path from 'path';

async function handleRequest(request) {
  const brandsPath = path.resolve(process.cwd(), 'src', 'data', 'brands.json');
  const productsPath = path.resolve(process.cwd(), 'src', 'data', 'products.json');

  try {
    const payload = await request.json();
    const { action, brand, oldName, reassignTo, force } = payload;
    
    if (!fs.existsSync(brandsPath)) {
      return new Response(JSON.stringify({ error: 'Brands file not found' }), { status: 404 });
    }

    let brands = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
    let products = [];
    if (fs.existsSync(productsPath)) {
      products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    }

    let updated = false;
    let productsUpdated = false;

    if (action === 'ADD') {
      if (!brand || !brand.name) return new Response(JSON.stringify({ error: 'Invalid brand data' }), { status: 400 });
      if (brands.find(b => b.name === brand.name)) {
        return new Response(JSON.stringify({ error: 'Brand already exists' }), { status: 400 });
      }
      brands.push(brand);
      updated = true;
    } 
    else if (action === 'EDIT') {
      if (!oldName || !brand || !brand.name) return new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 });
      const index = brands.findIndex(b => b.name === oldName);
      if (index === -1) return new Response(JSON.stringify({ error: 'Brand not found' }), { status: 404 });
      
      brands[index] = brand;
      updated = true;

      if (oldName !== brand.name) {
        products = products.map(p => {
          if (p.brand === oldName) {
            productsUpdated = true;
            return { ...p, brand: brand.name };
          }
          return p;
        });
      }
    } 
    else if (action === 'DELETE') {
      const targetName = payload.name;
      if (!targetName) return new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 });
      
      const index = brands.findIndex(b => b.name === targetName);
      if (index === -1) return new Response(JSON.stringify({ error: 'Brand not found' }), { status: 404 });

      const dependentProducts = products.filter(p => p.brand === targetName);

      if (dependentProducts.length > 0 && !force && !reassignTo) {
        return new Response(JSON.stringify({ 
          error: 'Dependent products exist',
          dependentProducts: dependentProducts.map(p => ({ sku: p.sku || p.part_no, name: p.product_name }))
        }), { status: 409 });
      }

      brands.splice(index, 1);
      updated = true;

      if (reassignTo && dependentProducts.length > 0) {
        products = products.map(p => {
          if (p.brand === targetName) {
            productsUpdated = true;
            return { ...p, brand: reassignTo };
          }
          return p;
        });
      }
    } 
    else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
    }

    if (updated) {
      fs.writeFileSync(brandsPath, JSON.stringify(brands, null, 2), 'utf8');
    }
    if (productsUpdated) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
    }

    return new Response(JSON.stringify({ success: true, brands }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('manage-brands error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST({ request }) {
  return handleRequest(request);
}

export async function DELETE({ request }) {
  return handleRequest(request);
}
