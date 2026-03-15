const xlsx = require('xlsx');
const workbook = xlsx.readFile('data.xlsx');
console.log(workbook.SheetNames);
workbook.SheetNames.forEach(sheet => {
  console.log(`\n--- Sheet: ${sheet} ---`);
  console.log(xlsx.utils.sheet_to_csv(workbook.Sheets[sheet]));
});
