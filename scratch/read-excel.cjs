const XLSX = require('xlsx');
const path = require('path');

const workbook = XLSX.readFile('products.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
console.log(JSON.stringify(data.slice(0, 2), null, 2));
