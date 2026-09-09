const fs = require('fs');

const code = fs.readFileSync('c:\\Users\\abc\\Desktop\\legal-deepak-update\\Frontend\\src\\App.jsx', 'utf8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('showPartyModal') || line.includes('partyModal') || line.includes('party_role') || line.includes('party_type') || line.includes('retaining_client')) {
    console.log(`Line ${idx + 1}: ${line.trim().substring(0, 120)}`);
  }
});
