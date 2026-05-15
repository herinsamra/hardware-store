import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsonResponse } from '../../lib/cacheHeaders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

export async function GET() {
  try {
    const unitsPath = path.join(projectRoot, 'src', 'data', 'units.json');
    if (!fs.existsSync(unitsPath)) {
      return jsonResponse([], { status: 200 });
    }
    const units = JSON.parse(fs.readFileSync(unitsPath, 'utf-8'));
    return jsonResponse(units, { status: 200 });
  } catch (error) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}
