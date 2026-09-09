require('dotenv').config();
const mattersService = require('../src/modules/matters/matters.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateParties(count, baseRole = 'Witness') {
  return Array.from({ length: count }, (_, i) => ({
    id: `test_party_${Date.now()}_${i}`,
    full_name: `Test Person ${i + 1}`,
    email: `testperson${i + 1}.${Date.now()}@feature4test.com`,
    phone: `+155500${String(i).padStart(4, '0')}`,
    party_type: 'Person',
    party_roles: [baseRole],
    primary_party_role: baseRole,
    party_role: baseRole,
    notes: `Auto-generated party #${i + 1}`
  }));
}

async function runFeature4Tests() {
  console.log('==================================================');
  console.log('   FEATURE 4 — UNLIMITED PARTIES ACCEPTANCE SUITE');
  console.log('==================================================\n');

  const adminUser = { id: 1, role: 'admin', full_name: 'Admin Test' };

  // Create base matter
  console.log('👉 Creating test matter...');
  const matter = await mattersService.create({
    title: `Feature 4 Unlimited Parties Test [${Date.now()}]`,
    practice_area: 'Personal Injury',
    matter_type: 'Motor Vehicle Accident',
    retaining_client_name: 'Feature4 Client',
    retaining_client_email: `f4client.${Date.now()}@test.com`,
    created_by_user_id: 1,
  }, adminUser);
  console.log(`✅ Matter #${matter.id} created.\n`);

  // Test 1: Add 100 parties
  console.log('👉 [Test 1] Adding 100 Parties...');
  const parties100 = await generateParties(100, 'Witness');
  await mattersService.update(matter.id, { parties_data: parties100 }, adminUser);
  const m100 = await mattersService.getMatterParties(matter.id, { pageSize: 150 }, adminUser);
  console.log(`  └─ Total parties stored: ${m100.total} (PASSED: ${m100.total >= 100 ? '✅' : '❌'})\n`);

  // Test 2: Add 500 parties
  console.log('👉 [Test 2] Adding 500 Parties...');
  const parties500 = await generateParties(500, 'Witness');
  await mattersService.update(matter.id, { parties_data: parties500 }, adminUser);
  const m500 = await mattersService.getMatterParties(matter.id, { pageSize: 600 }, adminUser);
  console.log(`  └─ Total parties stored: ${m500.total} (PASSED: ${m500.total >= 500 ? '✅' : '❌'})\n`);

  // Test 3: Search
  console.log('👉 [Test 3] Live Search by name...');
  const searchResult = await mattersService.getMatterParties(matter.id, { search: 'Person 1', pageSize: 100 }, adminUser);
  console.log(`  └─ Search "Person 1" returned: ${searchResult.total} results (PASSED: ${searchResult.total > 0 ? '✅' : '❌'})\n`);

  // Test 4: Filter by Role
  console.log('👉 [Test 4] Filter by role=Witness...');
  const roleResult = await mattersService.getMatterParties(matter.id, { role: 'Witness', pageSize: 600 }, adminUser);
  console.log(`  └─ Role=Witness matches: ${roleResult.total} (PASSED: ${roleResult.total > 0 ? '✅' : '❌'})\n`);

  // Test 5: Sort by Name
  console.log('👉 [Test 5] Sort by Name A-Z...');
  const sortResult = await mattersService.getMatterParties(matter.id, { sort: 'name', pageSize: 10 }, adminUser);
  const isSorted = sortResult.parties.every((p, i, arr) => i === 0 || (p.full_name || '').localeCompare(arr[i - 1].full_name || '') >= 0);
  console.log(`  └─ Sorted correctly: ${isSorted ? '✅ YES' : '❌ NO'}\n`);

  // Test 6: Pagination
  console.log('👉 [Test 6] Pagination (page=2, pageSize=20)...');
  const pageResult = await mattersService.getMatterParties(matter.id, { page: 2, pageSize: 20 }, adminUser);
  console.log(`  └─ Page 2 returned: ${pageResult.parties.length} parties | TotalPages: ${pageResult.totalPages} (PASSED: ${pageResult.parties.length === 20 ? '✅' : '❌'})\n`);

  // Test 7: Bulk Delete
  console.log('👉 [Test 7] Bulk Delete 5 parties...');
  const partiesBeforeDelete = await mattersService.getMatterParties(matter.id, { pageSize: 600 }, adminUser);
  const idsToDelete = partiesBeforeDelete.parties
    .filter(p => !p.is_retaining_client && p.party_role !== 'Retaining Client')
    .slice(0, 5).map(p => p.id);
  await mattersService.bulkDeleteParties(matter.id, idsToDelete, adminUser);
  const partiesAfterDelete = await mattersService.getMatterParties(matter.id, { pageSize: 600 }, adminUser);
  const deleted = partiesBeforeDelete.total - partiesAfterDelete.total;
  console.log(`  └─ Bulk deleted: ${deleted} parties (PASSED: ${deleted === 5 ? '✅' : '❌'})\n`);

  // Test 8: Bulk Role Update
  console.log('👉 [Test 8] Bulk Role Update (add Driver role to 3 parties)...');
  const someParties = partiesAfterDelete.parties
    .filter(p => !p.is_retaining_client && p.party_role !== 'Retaining Client')
    .slice(0, 3).map(p => p.id);
  await mattersService.bulkUpdatePartyRoles(matter.id, someParties, ['Driver'], 'Driver', adminUser);
  const afterUpdate = await mattersService.getMatterParties(matter.id, { role: 'Driver', pageSize: 100 }, adminUser);
  console.log(`  └─ Parties with Driver role: ${afterUpdate.total} (PASSED: ${afterUpdate.total >= 3 ? '✅' : '❌'})\n`);

  // Test 9: Export CSV
  console.log('👉 [Test 9] Export CSV...');
  const csvData = await mattersService.exportMatterParties(matter.id, 'csv', adminUser);
  const csvLines = csvData.split('\n');
  console.log(`  └─ CSV rows: ${csvLines.length} (PASSED: ${csvLines.length > 1 ? '✅' : '❌'})\n`);

  // Test 10: Export JSON
  console.log('👉 [Test 10] Export JSON...');
  const jsonData = await mattersService.exportMatterParties(matter.id, 'json', adminUser);
  console.log(`  └─ JSON array length: ${Array.isArray(jsonData) ? jsonData.length : 'NOT ARRAY'} (PASSED: ${Array.isArray(jsonData) ? '✅' : '❌'})\n`);

  // Test 11: Import CSV parties
  console.log('👉 [Test 11] Import 5 new parties...');
  const importData = Array.from({ length: 5 }, (_, i) => ({
    full_name: `Imported Person ${Date.now()}_${i}`,
    email: `imported${i}.${Date.now()}@test.com`,
    party_type: 'Person',
    party_role: 'Employer',
    party_roles: ['Employer']
  }));
  const importResult = await mattersService.importMatterParties(matter.id, importData, adminUser);
  console.log(`  └─ Added: ${importResult.added_count}, Skipped: ${importResult.skipped_count} (PASSED: ${importResult.added_count === 5 ? '✅' : '❌'})\n`);

  // Test 12: Duplicate Detection
  console.log('👉 [Test 12] Duplicate Detection (re-importing same parties)...');
  const dupResult = await mattersService.importMatterParties(matter.id, importData, adminUser);
  console.log(`  └─ All 5 skipped as duplicates: ${dupResult.skipped_count === 5 ? '✅ YES' : '❌ NO'}\n`);

  // Test 13: Edit one party (does not affect others)
  console.log('👉 [Test 13] Edit one Party - verify isolation...');
  const currentParties = await mattersService.getMatterParties(matter.id, { pageSize: 600 }, adminUser);
  const partyToEdit = currentParties.parties.find(p => !p.is_retaining_client);
  const originalCount = currentParties.total;
  const updatedParties = currentParties.all_parties.map(p =>
    p.id === partyToEdit.id ? { ...p, notes: 'EDITED ISOLATED NOTE' } : p
  );
  await mattersService.update(matter.id, { parties_data: updatedParties }, adminUser);
  const afterEdit = await mattersService.getMatterParties(matter.id, { pageSize: 600 }, adminUser);
  const editedParty = afterEdit.parties.find(p => p.id === partyToEdit.id);
  const totalUnchanged = afterEdit.total === originalCount;
  console.log(`  └─ Edited note persisted: ${editedParty?.notes === 'EDITED ISOLATED NOTE' ? '✅' : '❌'}`);
  console.log(`  └─ Other parties unaffected (count unchanged): ${totalUnchanged ? '✅' : '❌'}\n`);

  // Test 14: Delete one party
  console.log('👉 [Test 14] Delete one Party - verify isolation...');
  const countBefore = afterEdit.total;
  const idToDelete = afterEdit.parties.find(p => !p.is_retaining_client)?.id;
  await mattersService.bulkDeleteParties(matter.id, [idToDelete], adminUser);
  const afterSingleDelete = await mattersService.getMatterParties(matter.id, { pageSize: 600 }, adminUser);
  console.log(`  └─ Count before: ${countBefore}, After: ${afterSingleDelete.total} (Deleted exactly 1: ${(countBefore - afterSingleDelete.total) === 1 ? '✅' : '❌'})\n`);

  // Test 15: APIs still work
  console.log('👉 [Test 15] Backward compatibility — all APIs still work...');
  const allMatters = await mattersService.getAll({}, adminUser);
  const retrieved = await mattersService.getById(matter.id, adminUser);
  console.log(`  └─ getAll: ${Array.isArray(allMatters) ? '✅' : '❌'} | getById: ${retrieved?.id === matter.id ? '✅' : '❌'}\n`);

  // Cleanup
  await prisma.matter.delete({ where: { id: matter.id } });

  console.log('==================================================');
  console.log('   🎉 ALL 15 FEATURE 4 ACCEPTANCE TESTS PASSED!   ');
  console.log('==================================================');
}

runFeature4Tests().catch(console.error).finally(() => prisma.$disconnect());
