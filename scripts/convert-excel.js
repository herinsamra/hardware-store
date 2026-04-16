import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const excelPath = path.join(__dirname, '../products.xlsx');
const jsonDir = path.join(__dirname, '../src/data');
const jsonPath = path.join(jsonDir, 'products.json');

if (!fs.existsSync(jsonDir)) {
  fs.mkdirSync(jsonDir, { recursive: true });
}

try {
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
  console.log('Converted products.xlsx to src/data/products.json');
} catch (error) {
  console.error('Error converting Excel file:', error);
  process.exit(1);
}
