const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\abc\\Desktop\\legal-deepak-update\\Frontend\\src\\pages\\AdminPages.jsx';
const code = fs.readFileSync(filePath, 'utf8');

const lines = code.split('\n');
console.log('Total lines in AdminPages.jsx:', lines.length);

lines.forEach((line, idx) => {
  if (line.includes('parties_data') || line.includes('Retaining Client') || line.includes('Primary Client') || line.includes('MatterModal') || line.includes('CaseModal') || line.includes('Matter Parties') || line.includes('Add Matter')) {
    console.log(`Line ${idx + 1}: ${line.trim().substring(0, 100)}`);
  }
});
