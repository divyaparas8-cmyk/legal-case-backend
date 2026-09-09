require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updatedMatters = await prisma.matter.findMany({
    where: {
      id: { in: [22, 24, 23, 20, 14] }
    },
    include: {
      client: true,
      assigned_lawyer: { select: { id: true, full_name: true, email: true } },
      created_by: { select: { id: true, full_name: true } },
      documents: true,
      invoices: true,
      tasks: true,
      activities: true,
      generated_forms: true,
    },
    orderBy: { updated_at: 'desc' }
  });

  const customFields = await prisma.matterCustomFieldValue.findMany({
    include: { field_definition: true }
  });

  console.log('MATTER REPORT DETAILS:');
  for (const m of updatedMatters) {
    const fields = customFields.filter(cf => cf.matter_id === m.id);
    console.log(`\n=== MATTER #${m.id} (${m.matter_number}) ===`);
    console.log(`Title: ${m.title}`);
    console.log(`Status: ${m.status} | Priority: ${m.priority}`);
    console.log(`Practice Area: ${m.practice_area} | Type: ${m.matter_type}`);
    console.log(`Client Name: ${m.client?.full_name} | Email: ${m.client?.email} | Phone: ${m.client?.phone || 'N/A'}`);
    console.log(`Assigned Lawyer: ${m.assigned_lawyer?.full_name || 'Unassigned'}`);
    console.log(`Created By: ${m.created_by?.full_name}`);
    console.log(`Case Number: ${m.case_number || 'N/A'}`);
    console.log(`Court Name: ${m.court_name || 'N/A'}`);
    console.log(`Court Address: ${m.court_address || 'N/A'}`);
    console.log(`Judge Name: ${m.judge_name || 'N/A'}`);
    console.log(`Opposing Party: ${m.opposing_party_name || 'N/A'}`);
    console.log(`Filing Date: ${m.initial_filing_date || 'N/A'}`);
    console.log(`Date of Loss: ${m.date_of_loss || 'N/A'}`);
    console.log(`Trial Date: ${m.trial_date || 'N/A'}`);
    console.log(`Opened At: ${m.opened_at}`);
    console.log(`Closed At: ${m.closed_at}`);
    console.log(`Description: ${m.description || 'N/A'}`);
    console.log(`Custom Fields:`, fields.map(f => `${f.field_definition?.name}: ${f.value}`));
    console.log(`Generated Forms:`, m.generated_forms.length);
    console.log(`Documents Count:`, m.documents.length);
    console.log(`Invoices Count:`, m.invoices.length);
    console.log(`Tasks Count:`, m.tasks.length);
    console.log(`Updated At: ${m.updated_at}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
