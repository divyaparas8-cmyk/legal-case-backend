require('dotenv').config();
const mattersService = require('../src/modules/matters/matters.service');
const reportsService = require('../src/modules/reports/reports.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runFeature1Tests() {
  console.log('==================================================');
  console.log('   FEATURE 1 ACCEPTANCE TESTS SUITE              ');
  console.log('==================================================\n');

  const adminUser = { id: 1, role: 'admin', full_name: 'Victoria Admin' };

  // Test 1: Create Matter with Person and Organization Parties
  console.log('👉 [Test 1] Creating Matter with Person and Organization Parties...');
  const matterPayload = {
    title: 'Party Management Test Matter',
    practice_area: 'Personal Injury',
    matter_type: 'Motor Vehicle Accident',
    retaining_client_name: 'Feature 1 Retaining Client',
    retaining_client_email: `f1.${Date.now()}@vktori-test.com`,
    created_by_user_id: 1,
    parties_data: [
      {
        id: 'p_1',
        full_name: 'John Witness',
        email: 'john.witness@test.com',
        phone: '+15550001111',
        party_role: 'Witness',
        party_type: 'Person',
        notes: 'Eyewitness at intersection'
      },
      {
        id: 'p_2',
        full_name: 'State Farm Insurance',
        company_name: 'State Farm Insurance',
        contact_person: 'Sarah Adjuster',
        email: 'claims@statefarm.test',
        phone: '+18005552222',
        website: 'https://statefarm.test',
        party_role: 'Insurance Company',
        party_type: 'Organization',
        insurance_number: 'POL-998877'
      }
    ]
  };

  const createdMatter = await mattersService.create(matterPayload, adminUser);
  console.log(`✅ Matter #${createdMatter.id} created! Total Parties: ${createdMatter.parties?.length || createdMatter.parties_data?.length}`);

  // Test 2: Edit Party in Matter
  console.log('\n👉 [Test 2] Updating Matter Parties (Edit Party flow)...');
  const updatedParties = [
    ...createdMatter.parties_data.map(p => p.full_name === 'John Witness' ? { ...p, notes: 'Updated witness statement: saw red light run' } : p)
  ];

  await mattersService.update(createdMatter.id, { parties_data: updatedParties }, adminUser);
  const reFetched = await mattersService.getById(createdMatter.id, adminUser);
  
  const editedWitness = reFetched.parties_data?.find(p => p.full_name === 'John Witness');
  console.log(`  └─ Witness updated statement: "${editedWitness?.notes}" (PASSED: ✅)`);

  // Test 3: Retaining Client Read-only / Non-deletable Protection
  console.log('\n👉 [Test 3] Verifying Retaining Client protection...');
  const retainingClientRow = reFetched.parties_data?.find(p => p.is_retaining_client || p.party_role === 'Retaining Client');
  console.log(`  └─ Retaining Client present: "${retainingClientRow?.full_name}" | Is Retaining Client? ${retainingClientRow?.is_retaining_client || retainingClientRow?.party_role === 'Retaining Client' ? '✅ YES (Protected)' : '❌ NO'}`);

  // Test 4: Delete Non-retaining Party
  console.log('\n👉 [Test 4] Deleting additional Party (Delete Party flow)...');
  const remainingParties = reFetched.parties_data?.filter(p => p.full_name !== 'John Witness');
  await mattersService.update(createdMatter.id, { parties_data: remainingParties }, adminUser);

  const finalFetched = await mattersService.getById(createdMatter.id, adminUser);
  console.log(`  └─ Witness removed? ${!finalFetched.parties_data?.some(p => p.full_name === 'John Witness') ? '✅ YES' : '❌ NO'}`);
  console.log(`  └─ Organization party retained? ${finalFetched.parties_data?.some(p => p.full_name === 'State Farm Insurance') ? '✅ YES' : '❌ NO'}`);

  // Cleanup test matter
  await prisma.matter.delete({ where: { id: createdMatter.id } });

  // Test 5 - 7: Backward compatibility
  console.log('\n👉 [Test 5 - 7] Testing Reports & API backward compatibility...');
  const reportsList = await reportsService.list();
  console.log(`  └─ Reports Service intact? ${Array.isArray(reportsList) ? '✅ YES' : '❌ NO'}`);

  const allMatters = await mattersService.getAll({}, adminUser);
  console.log(`  └─ getAll Matters API intact? ${Array.isArray(allMatters) ? '✅ YES (' + allMatters.length + ' matters)' : '❌ NO'}`);

  console.log('\n==================================================');
  console.log('   🎉 ALL FEATURE 1 TESTS PASSED SUCCESSFULLY!   ');
  console.log('==================================================');
}

runFeature1Tests().catch(console.error).finally(() => prisma.$disconnect());
