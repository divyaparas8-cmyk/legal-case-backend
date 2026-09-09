const prisma = require('../src/config/db');

async function main() {
  const targetNumbers = [
    'MT-00010', 'MT-00011', 'MT-00012', 'MT-00013', 'MT-00014',
    'MT-00015', 'MT-00016', 'MT-00017', 'MT-00018', 'MT-00019',
    'MT-00020', 'MT-00021', 'MT-00022', 'MT-00023'
  ];

  const matters = await prisma.matter.findMany({
    where: { matter_number: { in: targetNumbers } },
    select: { id: true, matter_number: true, title: true }
  });

  console.log('Target matters to delete:', matters);
  const ids = matters.map(m => m.id);

  if (ids.length === 0) {
    console.log('No matters found.');
    return;
  }

  const idList = ids.join(',');

  try {
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);
    await prisma.$executeRawUnsafe(`DELETE FROM matters WHERE id IN (${idList})`);
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
    console.log(`Successfully deleted ${ids.length} matters: ${targetNumbers.join(', ')}`);
  } catch (err) {
    console.error('Delete error:', err);
  }
}

main().finally(() => process.exit(0));
