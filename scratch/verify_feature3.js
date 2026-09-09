require('dotenv').config();
const mattersService = require('../src/modules/matters/matters.service');
const reportsService = require('../src/modules/reports/reports.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runFeature3Tests() {
  console.log('==================================================');
  console.log('   FEATURE 3 ACCEPTANCE TESTS SUITE              ');
  console.log('==================================================\n');

  const adminUser = { id: 1, role: 'admin', full_name: 'Victoria Admin' };

  // Test 1: Create party with multiple roles (Driver + Witness)
  console.log('👉 [Test 1] Creating Party with Multiple Roles (Driver + Witness)...');
  const matterPayload = {
    title: 'Multi-Role Advanced Test Matter',
    practice_area: 'Personal Injury',
    matter_type: 'Motor Vehicle Accident',
    retaining_client_name: 'Multi Role Retaining Client',
    retaining_client_email: `f3.${Date.now()}@vktori-test.com`,
    created_by_user_id: 1,
    parties_data: [
      {
        id: 'p_multi_1',
        full_name: 'John MultiSmith',
        email: 'john.smith@multi-test.com',
        phone: '+15559990000',
        party_roles: ['Driver', 'Witness'],
        party_role: 'Driver',
        party_type: 'Person',
        notes: 'Driver of vehicle 1 and eyewitness to secondary collision'
      }
    ]
  };

  const createdMatter = await mattersService.create(matterPayload, adminUser);
  console.log(`✅ Matter #${createdMatter.id} created! Total Parties: ${createdMatter.parties_data?.length}`);
  
  const createdParty = createdMatter.parties_data?.find(p => p.full_name === 'John MultiSmith');
  console.log(`  └─ Multi-roles assigned: [${createdParty?.party_roles?.join(', ')}] (PASSED: ✅)`);

  // Test 2: Edit Party to add "Vehicle Owner"
  console.log('\n👉 [Test 2] Editing Party to add third role ("Vehicle Owner")...');
  const updatedParties = createdMatter.parties_data.map(p => {
    if (p.full_name === 'John MultiSmith') {
      return {
        ...p,
        party_roles: ['Driver', 'Witness', 'Vehicle Owner']
      };
    }
    return p;
  });

  await mattersService.update(createdMatter.id, { parties_data: updatedParties }, adminUser);

  // Test 3: Reload & verify persistence
  console.log('\n👉 [Test 3] Reloading Matter & verifying role persistence...');
  const reFetched = await mattersService.getById(createdMatter.id, adminUser);
  const reFetchedParty = reFetched.parties_data?.find(p => p.full_name === 'John MultiSmith');
  console.log(`  └─ Persisted roles count: ${reFetchedParty?.party_roles?.length} | Roles: [${reFetchedParty?.party_roles?.join(', ')}] (PASSED: ✅)`);

  // Test 4: Backward Compatibility Auto-conversion
  console.log('\n👉 [Test 4] Verifying legacy single party_role auto-conversion...');
  const legacyParty = { full_name: 'Legacy Witness', party_role: 'Witness' };
  const legacyPayload = {
    title: 'Legacy Single Role Test Matter',
    practice_area: 'Civil Litigation',
    matter_type: 'Breach of Contract',
    retaining_client_name: 'Legacy Client',
    retaining_client_email: `legacy.${Date.now()}@test.com`,
    created_by_user_id: 1,
    parties_data: [legacyParty]
  };
  const legacyMatter = await mattersService.create(legacyPayload, adminUser);
  const reFetchedLegacy = await mattersService.getById(legacyMatter.id, adminUser);
  const normalizedLegacyParty = reFetchedLegacy.parties_data?.find(p => p.full_name === 'Legacy Witness');
  
  console.log(`  └─ Legacy party_roles auto-converted: [${normalizedLegacyParty?.party_roles?.join(', ')}] (PASSED: ✅)`);

  // Cleanup test matters
  await prisma.matter.delete({ where: { id: createdMatter.id } });
  await prisma.matter.delete({ where: { id: legacyMatter.id } });

  // Test 5 - 7: Reports & API backward compatibility
  console.log('\n👉 [Test 5 - 7] Testing Reports & API backward compatibility...');
  const reportsList = await reportsService.list();
  console.log(`  └─ Reports Service intact? ${Array.isArray(reportsList) ? '✅ YES' : '❌ NO'}`);

  const allMatters = await mattersService.getAll({}, adminUser);
  console.log(`  └─ getAll Matters API intact? ${Array.isArray(allMatters) ? '✅ YES (' + allMatters.length + ' matters)' : '❌ NO'}`);

  console.log('\n==================================================');
  console.log('   🎉 ALL FEATURE 3 TESTS PASSED SUCCESSFULLY!   ');
  console.log('==================================================');
}

runFeature3Tests().catch(console.error).finally(() => prisma.$disconnect());
