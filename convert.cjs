const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('data.xlsx');
let allData = {};

workbook.SheetNames.forEach(sheet => {
  if(sheet === 'Summary') return;
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1 });
  
  // Find header row (usually the one that contains 'Fund Name')
  let headerRowIndex = -1;
  for(let i=0; i<data.length; i++) {
    if(data[i] && data[i].includes('Fund Name')) {
      headerRowIndex = i;
      break;
    }
  }

  if(headerRowIndex !== -1) {
    const headers = data[headerRowIndex];
    const rows = data.slice(headerRowIndex + 1).filter(r => r.length > 0 && r[1]); // Ensure it has a name
    
    // Parse the data
    const parsedRows = rows.map(r => {
      let rateStr = r[4] ? r[4].toString().replace('%', '') : '0';
      return {
        name: r[1],
        manager: r[2],
        type: r[3],
        rate: parseFloat(rateStr)
      };
    });
    
    let key = "stable";
    if (sheet.includes('Growth')) key = "growth";
    else if (sheet.includes('Shariah')) key = "shariah";
    
    allData[key] = parsedRows;
  }
});

fs.writeFileSync('src/fundsData.js', `export const FUNDS_DATA = ${JSON.stringify(allData, null, 2)};\n`);
console.log('Successfully generated src/fundsData.js');
