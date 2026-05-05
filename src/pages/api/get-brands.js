export const prerender = false;
import fs from 'fs';
import path from 'path';

export async function GET({ request }) {
  const dataPath = path.resolve(process.cwd(), 'src', 'data', 'brands.json');

  try {
    if (!fs.existsSync(dataPath)) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = fs.readFileSync(dataPath, 'utf8');
    
    return new Response(data, {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
    });
  } catch (error) {
    console.error('Error reading brands:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
