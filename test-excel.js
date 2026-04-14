// test-excel.mjs
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const excelPath = path.join(__dirname, 'products.xlsx');

try {
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log('✅ Number of rows:', rows.length);
  if (rows.length > 0) {
    console.log('📄 First row:', rows[0]);
    console.log('📋 Column headers:', Object.keys(rows[0]));
  } else {
    console.log('⚠️ No data rows found. Check your Excel file.');
  }
} catch (err) {
  console.error('❌ Error reading Excel file:', err.message);
}