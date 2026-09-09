const prisma = require('../src/config/db');

async function main() {
  const existingMatters = await prisma.matter.findMany({ select: { id: true } });
  const validMatterIds = new Set(existingMatters.map(m => m.id));

  // 1. Invoices
  const invoices = await prisma.invoice.findMany({ select: { id: true, matter_id: true } });
  const orphanedInvoices = invoices.filter(i => !validMatterIds.has(i.matter_id));
  console.log('Orphaned invoices count:', orphanedInvoices.length);

  // 2. Time Entries
  const timeEntries = await prisma.timeEntry.findMany({ select: { id: true, matter_id: true } });
  const orphanedTimeEntries = timeEntries.filter(t => !validMatterIds.has(t.matter_id));
  console.log('Orphaned time entries count:', orphanedTimeEntries.length);

  // 3. Expenses
  const expenses = await prisma.expense.findMany({ select: { id: true, matter_id: true } });
  const orphanedExpenses = expenses.filter(e => !validMatterIds.has(e.matter_id));
  console.log('Orphaned expenses count:', orphanedExpenses.length);

  // 4. Documents
  const documents = await prisma.document.findMany({ select: { id: true, matter_id: true } });
  const orphanedDocuments = documents.filter(d => d.matter_id && !validMatterIds.has(d.matter_id));
  console.log('Orphaned documents count:', orphanedDocuments.length);

  // 5. Tasks
  const tasks = await prisma.task.findMany({ select: { id: true, matter_id: true } });
  const orphanedTasks = tasks.filter(t => t.matter_id && !validMatterIds.has(t.matter_id));
  console.log('Orphaned tasks count:', orphanedTasks.length);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  if (orphanedInvoices.length > 0) {
    const ids = orphanedInvoices.map(i => i.id).join(',');
    await prisma.$executeRawUnsafe(`DELETE FROM invoice_items WHERE invoice_id IN (${ids})`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM payments WHERE invoice_id IN (${ids})`).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM invoices WHERE id IN (${ids})`);
  }

  if (orphanedTimeEntries.length > 0) {
    const ids = orphanedTimeEntries.map(t => t.id).join(',');
    await prisma.$executeRawUnsafe(`DELETE FROM time_entries WHERE id IN (${ids})`);
  }

  if (orphanedExpenses.length > 0) {
    const ids = orphanedExpenses.map(e => e.id).join(',');
    await prisma.$executeRawUnsafe(`DELETE FROM expenses WHERE id IN (${ids})`);
  }

  if (orphanedDocuments.length > 0) {
    const ids = orphanedDocuments.map(d => d.id).join(',');
    await prisma.$executeRawUnsafe(`DELETE FROM documents WHERE id IN (${ids})`);
  }

  if (orphanedTasks.length > 0) {
    const ids = orphanedTasks.map(t => t.id).join(',');
    await prisma.$executeRawUnsafe(`DELETE FROM tasks WHERE id IN (${ids})`);
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('Orphans successfully cleaned up!');
}

main().finally(() => process.exit(0));
