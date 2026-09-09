const fs = require('fs');

const code = fs.readFileSync('c:\\Users\\abc\\Desktop\\legal-deepak-update\\Frontend\\src\\pages\\AdminPages.jsx', 'utf8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('export function') || line.includes('function CasesPage') || line.includes('function CaseDetail') || line.includes('function Modal') || line.includes('openModal') || line.includes('setShowModal') || line.includes('isAddOpen') || line.includes('isEditOpen') || line.includes('retaining_client_name') || line.includes('parties_data')) {
    console.log(`Line ${idx + 1}: ${line.trim().substring(0, 120)}`);
  }
});
