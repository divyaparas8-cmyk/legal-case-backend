const fs = require('fs');

const code = fs.readFileSync('c:\\Users\\abc\\Desktop\\legal-deepak-update\\Frontend\\src\\App.jsx', 'utf8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('add-case') || line.includes('edit-case') || line.includes('case-form') || line.includes('matter-form') || line.includes('retaining') || line.includes('parties_data') || line.includes('inlineParties')) {
    console.log(`Line ${idx + 1}: ${line.trim().substring(0, 120)}`);
  }
});
