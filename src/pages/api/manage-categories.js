export const prerender = false;
import fs from 'fs';
import path from 'path';

async function handleRequest(request) {
  const categoriesPath = path.resolve(process.cwd(), 'src', 'data', 'categories.json');
  const productsPath = path.resolve(process.cwd(), 'src', 'data', 'products.json');

  try {
    const payload = await request.json();
    const { action, path: catPath, name, newName, reassignTo, force } = payload;
    
    if (!fs.existsSync(categoriesPath)) {
      return new Response(JSON.stringify({ error: 'Categories file not found' }), { status: 404 });
    }

    let categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    let products = [];
    if (fs.existsSync(productsPath)) {
      products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    }

    let updated = false;
    let productsUpdated = false;

    const getNested = (obj, pathArr) => {
      let current = obj;
      for (const key of pathArr) {
        if (!current[key]) return undefined;
        current = current[key];
      }
      return current;
    };

    if (action === 'ADD') {
      if (!catPath || catPath.length === 0) {
        if (categories[name]) return new Response(JSON.stringify({ error: 'Category already exists' }), { status: 400 });
        categories[name] = {};
        updated = true;
      } else if (catPath.length === 1 || catPath.length === 2) {
        const parent = getNested(categories, catPath);
        if (!parent) return new Response(JSON.stringify({ error: 'Parent path not found' }), { status: 400 });
        if (parent[name]) return new Response(JSON.stringify({ error: 'Already exists' }), { status: 400 });
        parent[name] = catPath.length === 2 ? [] : {};
        updated = true;
      } else {
        return new Response(JSON.stringify({ error: 'Max depth reached' }), { status: 400 });
      }
    } 
    else if (action === 'RENAME') {
      if (!catPath || catPath.length === 0 || !newName) return new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 });
      const targetName = catPath[catPath.length - 1];
      const parentPath = catPath.slice(0, -1);
      
      let parent = parentPath.length === 0 ? categories : getNested(categories, parentPath);
      if (!parent || !parent[targetName]) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
      if (parent[newName]) return new Response(JSON.stringify({ error: 'New name already exists' }), { status: 400 });
      
      const newParent = {};
      for (const key in parent) {
        if (key === targetName) {
          newParent[newName] = parent[targetName];
        } else {
          newParent[key] = parent[key];
        }
      }
      
      if (parentPath.length === 0) {
        categories = newParent;
      } else {
        const rootParent = getNested(categories, parentPath.slice(0, -1));
        if (rootParent) {
          rootParent[parentPath[parentPath.length - 1]] = newParent;
        } else if (parentPath.length === 1) {
          categories[parentPath[0]] = newParent;
        }
      }
      updated = true;

      const levelKey = catPath.length === 1 ? 'category' : (catPath.length === 2 ? 'subcategory' : 'subsubcategory');
      products = products.map(p => {
        if (p[levelKey] === targetName) {
          let match = true;
          if (catPath.length > 1 && p.category !== catPath[0]) match = false;
          if (catPath.length > 2 && p.subcategory !== catPath[1]) match = false;
          
          if (match) {
            productsUpdated = true;
            return { ...p, [levelKey]: newName };
          }
        }
        return p;
      });

    } 
    else if (action === 'DELETE') {
      if (!catPath || catPath.length === 0) return new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400 });
      const targetName = catPath[catPath.length - 1];
      const parentPath = catPath.slice(0, -1);
      
      let parent = parentPath.length === 0 ? categories : getNested(categories, parentPath);
      if (!parent || parent[targetName] === undefined) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
      
      const levelKey = catPath.length === 1 ? 'category' : (catPath.length === 2 ? 'subcategory' : 'subsubcategory');
      const dependentProducts = products.filter(p => {
        let match = p[levelKey] === targetName;
        if (match && catPath.length > 1 && p.category !== catPath[0]) match = false;
        if (match && catPath.length > 2 && p.subcategory !== catPath[1]) match = false;
        return match;
      });

      if (dependentProducts.length > 0 && !force && !reassignTo) {
        return new Response(JSON.stringify({ 
          error: 'Dependent products exist',
          dependentProducts: dependentProducts.map(p => ({ sku: p.sku || p.part_no, name: p.product_name }))
        }), { status: 409 });
      }

      if (Array.isArray(parent)) {
        const index = parent.indexOf(targetName);
        if (index > -1) parent.splice(index, 1);
      } else {
        delete parent[targetName];
      }
      updated = true;

      if (reassignTo && dependentProducts.length > 0) {
        products = products.map(p => {
          let match = p[levelKey] === targetName;
          if (match && catPath.length > 1 && p.category !== catPath[0]) match = false;
          if (match && catPath.length > 2 && p.subcategory !== catPath[1]) match = false;
          if (match) {
            productsUpdated = true;
            return { ...p, [levelKey]: reassignTo };
          }
          return p;
        });
      }
    } 
    else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
    }

    if (updated) {
      fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2), 'utf8');
    }
    if (productsUpdated) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
    }

    return new Response(JSON.stringify({ success: true, categories }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('manage-categories error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST({ request }) {
  return handleRequest(request);
}

export async function DELETE({ request }) {
  return handleRequest(request);
}
