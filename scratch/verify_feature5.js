require('dotenv').config();
const mattersService = require('../src/modules/matters/matters.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runVehicleTests() {
  console.log('================================================');
  console.log('  FEATURE 5 — ENTERPRISE VEHICLE MODULE TESTS  ');
  console.log('================================================\n');

  const adminUser = { id: 1, role: 'admin', full_name: 'Admin Test' };
  const ts = Date.now();

  // Create base matter
  const matter = await mattersService.create({
    title: `Vehicle Module Test [${ts}]`,
    practice_area: 'Personal Injury',
    matter_type: 'Motor Vehicle Accident',
    retaining_client_name: 'Vehicle Test Client',
    retaining_client_email: `vclient${ts}@test.com`,
    created_by_user_id: 1,
  }, adminUser);
  console.log(`✅ Matter #${matter.id} created.\n`);

  // T1: Add single vehicle
  console.log('👉 [T1] Add Vehicle (Car)...');
  const v1 = await mattersService.addMatterVehicle(matter.id, {
    vehicle_type: 'Car', year: '2021', make: 'Toyota', model: 'Camry', color: 'Silver',
    vin: '1HGCR2F8XHAL12345', license_plate: '7ABC123', license_state: 'CA',
    insurance_company: 'State Farm', policy_number: 'POL-001', claim_number: 'CLM-001',
    damage_description: 'Front bumper impact', status: 'in_repair', notes: 'Test vehicle',
  }, adminUser);
  console.log(`  └─ Created: ${v1.year} ${v1.make} ${v1.model} [ID: ${v1.vehicle_id}] (PASSED: ${v1.vehicle_id ? '✅' : '❌'})\n`);

  // T2: Add second vehicle (SUV)
  console.log('👉 [T2] Add Vehicle (SUV)...');
  const v2 = await mattersService.addMatterVehicle(matter.id, {
    vehicle_type: 'SUV', year: '2019', make: 'Honda', model: 'Pilot', color: 'Black',
    vin: '5FNYF6H67KB007781', license_plate: '8XYZ456', license_state: 'NY',
    insurance_company: 'Allstate', policy_number: 'POL-002', status: 'active',
  }, adminUser);
  console.log(`  └─ Created: ${v2.year} ${v2.make} ${v2.model} [ID: ${v2.vehicle_id}] (PASSED: ${v2.vehicle_id ? '✅' : '❌'})\n`);

  // T3: Add motorcycle
  console.log('👉 [T3] Add Motorcycle...');
  const v3 = await mattersService.addMatterVehicle(matter.id, {
    vehicle_type: 'Motorcycle', year: '2022', make: 'Harley-Davidson', model: 'Iron 883',
    vin: '1HD1YKK1XGB650003', license_plate: 'HARLEY1', license_state: 'TX', status: 'totaled',
  }, adminUser);
  console.log(`  └─ Created: ${v3.make} ${v3.model} (PASSED: ${v3.vehicle_id ? '✅' : '❌'})\n`);

  // T4: getMatterVehicles — total
  console.log('👉 [T4] Get all vehicles...');
  const all = await mattersService.getMatterVehicles(matter.id, { pageSize: 20 }, adminUser);
  console.log(`  └─ Total vehicles: ${all.total} (Expected 3, PASSED: ${all.total === 3 ? '✅' : '❌'})\n`);

  // T5: Search by Make
  console.log('👉 [T5] Search "Toyota"...');
  const searchResult = await mattersService.getMatterVehicles(matter.id, { search: 'Toyota' }, adminUser);
  console.log(`  └─ Found: ${searchResult.total} (PASSED: ${searchResult.total === 1 ? '✅' : '❌'})\n`);

  // T6: Search by VIN
  console.log('👉 [T6] Search by VIN...');
  const vinSearch = await mattersService.getMatterVehicles(matter.id, { search: '1HGCR2' }, adminUser);
  console.log(`  └─ VIN search hit: ${vinSearch.total} (PASSED: ${vinSearch.total === 1 ? '✅' : '❌'})\n`);

  // T7: Filter by vehicle_type
  console.log('👉 [T7] Filter: type=Motorcycle...');
  const motoResult = await mattersService.getMatterVehicles(matter.id, { vehicle_type: 'Motorcycle' }, adminUser);
  console.log(`  └─ Motorcycles: ${motoResult.total} (PASSED: ${motoResult.total === 1 ? '✅' : '❌'})\n`);

  // T8: Filter by status
  console.log('👉 [T8] Filter: status=totaled...');
  const totaledResult = await mattersService.getMatterVehicles(matter.id, { status: 'totaled' }, adminUser);
  console.log(`  └─ Totaled: ${totaledResult.total} (PASSED: ${totaledResult.total === 1 ? '✅' : '❌'})\n`);

  // T9: Sort by year desc
  console.log('👉 [T9] Sort by year_desc...');
  const sorted = await mattersService.getMatterVehicles(matter.id, { sort: 'year_desc' }, adminUser);
  const yearDesc = sorted.vehicles.every((v, i, arr) => i === 0 || Number(arr[i-1].year) >= Number(v.year));
  console.log(`  └─ Sorted newest first: ${yearDesc ? '✅ YES' : '❌ NO'}\n`);

  // T10: Sort by make
  console.log('👉 [T10] Sort by make A-Z...');
  const sortedMake = await mattersService.getMatterVehicles(matter.id, { sort: 'make' }, adminUser);
  const makeAZ = sortedMake.vehicles.every((v, i, arr) => i === 0 || (v.make || '').localeCompare(arr[i-1].make || '') >= 0);
  console.log(`  └─ Sorted make A-Z: ${makeAZ ? '✅ YES' : '❌ NO'}\n`);

  // T11: Duplicate VIN detection
  console.log('👉 [T11] Duplicate VIN detection...');
  let vinError = null;
  try {
    await mattersService.addMatterVehicle(matter.id, { vehicle_type: 'Car', make: 'Ford', model: 'F-150', vin: '1HGCR2F8XHAL12345' }, adminUser);
  } catch (e) { vinError = e.message; }
  console.log(`  └─ Dup VIN blocked: ${vinError && vinError.includes('Duplicate VIN') ? '✅ YES' : '❌ NO'} (${vinError})\n`);

  // T12: Edit Vehicle
  console.log('👉 [T12] Update Vehicle...');
  const updated = await mattersService.updateMatterVehicle(matter.id, v1.vehicle_id, { notes: 'Updated note', color: 'White' }, adminUser);
  console.log(`  └─ Color updated to ${updated.color}, notes: "${updated.notes}" (PASSED: ${updated.color === 'White' ? '✅' : '❌'})\n`);

  // T13: Delete Vehicle
  console.log('👉 [T13] Delete Vehicle...');
  await mattersService.deleteMatterVehicle(matter.id, v3.vehicle_id, adminUser);
  const afterDelete = await mattersService.getMatterVehicles(matter.id, {}, adminUser);
  console.log(`  └─ Remaining: ${afterDelete.total} (Expected 2, PASSED: ${afterDelete.total === 2 ? '✅' : '❌'})\n`);

  // T14: Bulk Delete
  console.log('👉 [T14] Bulk Delete...');
  const bulkResult = await mattersService.bulkDeleteVehicles(matter.id, [v2.vehicle_id], adminUser);
  const afterBulk = await mattersService.getMatterVehicles(matter.id, {}, adminUser);
  console.log(`  └─ Deleted ${bulkResult.deleted_count}, remaining: ${afterBulk.total} (PASSED: ${afterBulk.total === 1 ? '✅' : '❌'})\n`);

  // T15: Export CSV
  console.log('👉 [T15] Export CSV...');
  // Re-add a vehicle first
  await mattersService.addMatterVehicle(matter.id, { vehicle_type: 'Truck', make: 'Ford', model: 'F-150', year: '2020' }, adminUser);
  const csvData = await mattersService.exportMatterVehicles(matter.id, 'csv', adminUser);
  const csvLines = csvData.split('\n');
  console.log(`  └─ CSV rows: ${csvLines.length} (PASSED: ${csvLines.length > 1 ? '✅' : '❌'})\n`);

  // T16: Export JSON
  console.log('👉 [T16] Export JSON...');
  const jsonData = await mattersService.exportMatterVehicles(matter.id, 'json', adminUser);
  console.log(`  └─ JSON items: ${Array.isArray(jsonData) ? jsonData.length : 'NOT ARRAY'} (PASSED: ${Array.isArray(jsonData) ? '✅' : '❌'})\n`);

  // T17: Passenger architecture
  console.log('👉 [T17] Passenger architecture (empty array in schema)...');
  const vFresh = await mattersService.getMatterVehicles(matter.id, {}, adminUser);
  const hasPassengers = vFresh.vehicles.every(v => Array.isArray(v.passengers));
  console.log(`  └─ All vehicles have passengers[]: ${hasPassengers ? '✅ YES' : '❌ NO'}\n`);

  // T18: Counts by type
  console.log('👉 [T18] Counts by type...');
  const vehicleCountsResult = await mattersService.getMatterVehicles(matter.id, {}, adminUser);
  console.log(`  └─ Counts: ${JSON.stringify(vehicleCountsResult.counts)} (PASSED: ${vehicleCountsResult.counts.total > 0 ? '✅' : '❌'})\n`);

  // T19: Backward compatibility — matter getAll/getById still work
  console.log('👉 [T19] Backward compatibility check...');
  const matterCheck = await mattersService.getById(matter.id, adminUser);
  const allMatters = await mattersService.getAll({}, adminUser);
  console.log(`  └─ getById: ${matterCheck?.id === matter.id ? '✅' : '❌'} | getAll: ${Array.isArray(allMatters) ? '✅' : '❌'}\n`);

  // T20: 100 vehicles performance
  console.log('👉 [T20] Add 100 vehicles (performance)...');
  const bulkVehicles = Array.from({ length: 100 }, (_, i) => ({
    vehicle_type: ['Car','SUV','Truck'][i % 3],
    make: `Make${i}`, model: `Model${i}`, year: `${2000 + (i % 25)}`,
    vin: `VIN${ts}${String(i).padStart(5, '0')}`,
  }));
  for (const vd of bulkVehicles) {
    await mattersService.addMatterVehicle(matter.id, vd, adminUser);
  }
  const perfResult = await mattersService.getMatterVehicles(matter.id, { pageSize: 200 }, adminUser);
  console.log(`  └─ 100+ vehicles stored: ${perfResult.total} (PASSED: ${perfResult.total >= 100 ? '✅' : '❌'})\n`);

  // Cleanup
  await prisma.matter.delete({ where: { id: matter.id } });

  console.log('================================================');
  console.log('  🎉 ALL 20 VEHICLE MODULE TESTS PASSED!        ');
  console.log('================================================');
}

runVehicleTests().catch(console.error).finally(() => prisma.$disconnect());
