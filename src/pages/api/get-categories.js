export const prerender = false;
import fs from 'fs';
import path from 'path';
import { CACHE_CONTROL, jsonHeaders, jsonResponse } from '../../lib/cacheHeaders.js';

export async function GET({ request }) {
  const dataPath = path.resolve(process.cwd(), 'src', 'data', 'categories.json');

  try {
    if (!fs.existsSync(dataPath)) {
      return jsonResponse({ error: 'File not found' }, { status: 404 });
    }

    const data = fs.readFileSync(dataPath, 'utf8');
    
    return new Response(data, {
      status: 200,
      headers: jsonHeaders(CACHE_CONTROL.catalogData),
    });
  } catch (error) {
    console.error('Error reading categories:', error);
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}
