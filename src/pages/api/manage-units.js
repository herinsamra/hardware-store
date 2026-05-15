import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsonResponse } from '../../lib/cacheHeaders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

export async function POST({ request }) {
  try {
    const { action, name, oldName } = await request.json();
    const unitsPath = path.join(projectRoot, 'src', 'data', 'units.json');
    let units = JSON.parse(fs.readFileSync(unitsPath, 'utf-8'));

    if (action === 'ADD') {
      if (!units.includes(name)) {
        units.push(name);
      }
    } else if (action === 'RENAME') {
      const index = units.indexOf(oldName);
      if (index !== -1) {
        units[index] = name;
      }
    }

    fs.writeFileSync(unitsPath, JSON.stringify(units, null, 2));
    return jsonResponse({ message: 'Units updated', units }, { status: 200 });
  } catch (error) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}

export async function DELETE({ request }) {
  try {
    const { name } = await request.json();
    const unitsPath = path.join(projectRoot, 'src', 'data', 'units.json');
    let units = JSON.parse(fs.readFileSync(unitsPath, 'utf-8'));

    units = units.filter(u => u !== name);

    fs.writeFileSync(unitsPath, JSON.stringify(units, null, 2));
    return jsonResponse({ message: 'Unit deleted', units }, { status: 200 });
  } catch (error) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }
}
