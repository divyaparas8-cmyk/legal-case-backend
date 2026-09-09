require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matters = await prisma.matter.findMany({
    include: {
      client: true,
      assigned_lawyer: { select: { id: true, full_name: true, email: true } },
      created_by: { select: { id: true, full_name: true } },
      documents: true,
      invoices: true,
      tasks: true,
      activities: true,
    },
    orderBy: { updated_at: 'desc' }
  });

  console.log('Total Matters Count:', matters.length);
  for (const m of matters) {
    console.log('--------------------------------------------------');
    console.log(`ID: ${m.id} | Number: ${m.matter_number} | Title: ${m.title}`);
    console.log(`Status: ${m.status} | Priority: ${m.priority} | Practice Area: ${m.practice_area} | Type: ${m.matter_type}`);
    console.log(`Client: ${m.client?.full_name} (${m.client?.email || 'N/A'})`);
    console.log(`Assigned Lawyer: ${m.assigned_lawyer?.full_name || 'Unassigned'}`);
    console.log(`Case Number: ${m.case_number || 'N/A'} | Court: ${m.court_name || 'N/A'} | Judge: ${m.judge_name || 'N/A'}`);
    console.log(`Opposing Party: ${m.opposing_party_name || 'N/A'}`);
    console.log(`Opened At: ${m.opened_at} | Closed At: ${m.closed_at}`);
    console.log(`Next Hearing: ${m.next_hearing}`);
    console.log(`Parties Data:`, JSON.stringify(m.parties_data));
    console.log(`Vehicles Data:`, JSON.stringify(m.vehicles_data));
    console.log(`Intake Answers:`, JSON.stringify(m.intake_answers));
    console.log(`Description: ${m.description}`);
    console.log(`Updated At: ${m.updated_at}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
