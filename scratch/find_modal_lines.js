const fs = require('fs');

const code = fs.readFileSync('c:\\Users\\abc\\Desktop\\legal-deepak-update\\Frontend\\src\\App.jsx', 'utf8');
const lines = code.split('\n');

console.log('Lines matching modal types:');
lines.forEach((line, idx) => {
  if (line.includes("'add-case'") || line.includes("'edit-case'") || line.includes("partiesList") || line.includes("Matter Parties") || line.includes("Retaining Client")) {
    console.log(`Line ${idx + 1}: ${line.trim().substring(0, 120)}`);
  }
});
