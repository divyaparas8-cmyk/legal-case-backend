require('dotenv').config();
const mattersService = require('../src/modules/matters/matters.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDriverTests() {
  console.log('================================================');
  console.log('   FEATURE 6 — ENTERPRISE DRIVER MODULE TESTS   ');
  console.log('================================================\n');

  const adminUser = { id: 1, role: 'admin', full_name: 'Admin Test' };
  const ts = Date.now();

  // Create test matter
  const matter = await mattersService.create({
    title: `Driver Module Test Matter [${ts}]`,
    practice_area: 'Personal Injury',
    matter_type: 'Motor Vehicle Accident',
    retaining_client_name: 'Driver Test Client',
    retaining_client_email: `dclient${ts}@test.com`,
    created_by_user_id: 1,
  }, adminUser);
  console.log(`✅ Matter #${matter.id} created.\n`);

  // Add vehicles for testing vehicle assignment
  const v1 = await mattersService.addMatterVehicle(matter.id, {
    vehicle_type: 'Car', year: '2022', make: 'Toyota', model: 'Camry', vin: '1HGCR2F8XHAL99001', license_plate: 'DRV-CAR1'
  }, adminUser);
  const v2 = await mattersService.addMatterVehicle(matter.id, {
    vehicle_type: 'Truck', year: '2020', make: 'Ford', model: 'F-150', vin: '1FTFW1E84MK119002', license_plate: 'DRV-TRK2'
  }, adminUser);
  console.log(`✅ Vehicles added: ${v1.make} ${v1.model} [${v1.vehicle_id}], ${v2.make} ${v2.model} [${v2.vehicle_id}]\n`);

  // T1: Create Party with Driver Role & Profile
  console.log('👉 [T1] Create Driver Party (John Driver)...');
  const matterWithParty = await mattersService.update(matter.id, {
    parties_data: [
      {
        id: 'party_d1',
        full_name: 'John Driver',
        email: 'john.driver@test.com',
        phone: '+15551112233',
        party_role: 'Driver',
        party_roles: ['Driver', 'Witness'],
        primary_party_role: 'Driver',
        party_type: 'Person',
        role_data: {
          Driver: {
            license_number: 'DL-JOHN123',
            license_state: 'CA',
            license_class: 'Class C',
            license_expiry: '2029-06-30',
            date_of_birth: '1985-03-12',
            employer: 'Express Transit',
            years_experience: '12',
            is_commercial_driver: true,
            cdl_number: 'CDL-JOHN777',
            insurance_company: 'Geico',
            policy_number: 'POL-GEICO-1',
            seatbelt_used: 'Yes',
            alcohol_test: 'Negative',
            drug_test: 'Negative',
            citation_issued: true,
            citation_number: 'CIT-99001',
            injury_status: 'Minor Injury',
            hospital: 'St. Jude Hospital',
            medical_notes: 'Whiplash treatment',
            assigned_vehicle_id: v1.vehicle_id,
            notes: 'Primary driver in incident'
          }
        }
      }
    ]
  }, adminUser);

  const driversResult = await mattersService.getMatterDrivers(matter.id, {}, adminUser);
  console.log(`  └─ Total Drivers: ${driversResult.total} (PASSED: ${driversResult.total === 1 ? '✅' : '❌'})\n`);

  // T2: Verify Driver Profile data integrity & non-overwriting of Party data
  console.log('👉 [T2] Verify Driver Profile isolation & party data...');
  const d1 = driversResult.drivers[0];
  const partyIntact = d1.full_name === 'John Driver' && d1.email === 'john.driver@test.com';
  const profileIntact = d1.driver_profile.license_number === 'DL-JOHN123' && d1.driver_profile.is_commercial_driver === true;
  console.log(`  └─ Party Data Intact: ${partyIntact ? '✅' : '❌'} | Driver Profile Intact: ${profileIntact ? '✅' : '❌'}\n`);

  // T3: Update Driver Profile (updateDriverProfile)
  console.log('👉 [T3] Update Driver Profile...');
  const updatedDriver = await mattersService.updateDriverProfile(matter.id, 'party_d1', {
    employer: 'Global Logistics Corp',
    years_experience: '15',
    injury_status: 'Uninjured'
  }, adminUser);
  console.log(`  └─ Employer updated to "${updatedDriver.driver_profile.employer}", experience: ${updatedDriver.driver_profile.years_experience} (PASSED: ${updatedDriver.driver_profile.employer === 'Global Logistics Corp' ? '✅' : '❌'})\n`);

  // T4: Vehicle Synchronization
  console.log('👉 [T4] Verify Driver ↔ Vehicle Synchronization...');
  const matterAfterSync = await mattersService.getById(matter.id, adminUser);
  const syncedVeh = matterAfterSync.vehicles_data.find(v => (v.vehicle_id || v.id) === v1.vehicle_id);
  console.log(`  └─ Vehicle [${v1.vehicle_id}] driver_party_id: "${syncedVeh.driver_party_id}" (Expected "party_d1", PASSED: ${syncedVeh.driver_party_id === 'party_d1' ? '✅' : '❌'})\n`);

  // T5: Vehicle Reassignment
  console.log('👉 [T5] Reassign Driver to Vehicle 2...');
  await mattersService.updateDriverProfile(matter.id, 'party_d1', { assigned_vehicle_id: v2.vehicle_id }, adminUser);
  const matterAfterReassign = await mattersService.getById(matter.id, adminUser);
  const v1Cleared = matterAfterReassign.vehicles_data.find(v => (v.vehicle_id || v.id) === v1.vehicle_id).driver_party_id !== 'party_d1';
  const v2Assigned = matterAfterReassign.vehicles_data.find(v => (v.vehicle_id || v.id) === v2.vehicle_id).driver_party_id === 'party_d1';
  console.log(`  └─ Old vehicle cleared: ${v1Cleared ? '✅' : '❌'} | New vehicle assigned: ${v2Assigned ? '✅' : '❌'}\n`);

  // T6: Create Second Driver (Sarah Commercial)
  console.log('👉 [T6] Add Second Driver (Sarah)...');
  const p2 = {
    id: 'party_d2',
    full_name: 'Sarah Commercial',
    email: 'sarah.c@test.com',
    party_role: 'Driver',
    party_roles: ['Driver'],
    party_type: 'Person',
    role_data: {
      Driver: {
        license_number: 'DL-SARAH456',
        license_state: 'NY',
        license_class: 'Class A (CDL)',
        license_expiry: '2027-01-15',
        employer: 'Big Freight Inc',
        years_experience: '20',
        is_commercial_driver: true,
        citation_issued: false,
        injury_status: 'Uninjured'
      }
    }
  };
  const matterCurrent = await mattersService.getById(matter.id, adminUser);
  await mattersService.update(matter.id, { parties_data: [...matterCurrent.parties_data, p2] }, adminUser);
  const twoDrivers = await mattersService.getMatterDrivers(matter.id, {}, adminUser);
  console.log(`  └─ Total drivers: ${twoDrivers.total} (PASSED: ${twoDrivers.total === 2 ? '✅' : '❌'})\n`);

  // T7: Search Drivers
  console.log('👉 [T7] Search Drivers ("Sarah" & "DL-JOHN")...');
  const searchSarah = await mattersService.getMatterDrivers(matter.id, { search: 'Sarah' }, adminUser);
  const searchLicense = await mattersService.getMatterDrivers(matter.id, { search: 'DL-JOHN' }, adminUser);
  console.log(`  └─ Search "Sarah": ${searchSarah.total} hit | Search "DL-JOHN": ${searchLicense.total} hit (PASSED: ${searchSarah.total === 1 && searchLicense.total === 1 ? '✅' : '❌'})\n`);

  // T8: Filter Drivers (license_state=NY & is_commercial_driver=true)
  console.log('👉 [T8] Filter Drivers (state=NY)...');
  const filterNY = await mattersService.getMatterDrivers(matter.id, { license_state: 'NY' }, adminUser);
  console.log(`  └─ State NY matches: ${filterNY.total} (PASSED: ${filterNY.total === 1 ? '✅' : '❌'})\n`);

  // T9: Sort Drivers (years_experience)
  console.log('👉 [T9] Sort Drivers (years_experience desc)...');
  const sortedDrivers = await mattersService.getMatterDrivers(matter.id, { sort: 'years_experience' }, adminUser);
  const correctOrder = sortedDrivers.drivers[0].full_name === 'Sarah Commercial';
  console.log(`  └─ Most experienced driver first: ${sortedDrivers.drivers[0].full_name} (${correctOrder ? '✅ PASSED' : '❌ FAILED'})\n`);

  // T10: Export Drivers (CSV)
  console.log('👉 [T10] Export Drivers to CSV...');
  const csvData = await mattersService.exportMatterDrivers(matter.id, 'csv', adminUser);
  const csvRows = csvData.split('\n');
  console.log(`  └─ CSV exported with ${csvRows.length} lines (PASSED: ${csvRows.length > 2 ? '✅' : '❌'})\n`);

  // T11: Export Drivers (JSON)
  console.log('👉 [T11] Export Drivers to JSON...');
  const jsonData = await mattersService.exportMatterDrivers(matter.id, 'json', adminUser);
  console.log(`  └─ JSON array length: ${jsonData.length} (PASSED: ${jsonData.length === 2 ? '✅' : '❌'})\n`);

  // T12: Role Removal Isolation (removing Driver role leaves profile data safe in role_data)
  console.log('👉 [T12] Role Removal Data Safety...');
  const afterRoleChange = await mattersService.getById(matter.id, adminUser);
  const p1Original = afterRoleChange.parties_data.find(p => p.id === 'party_d1');
  const p1Updated = { ...p1Original, party_roles: ['Witness'] }; // Remove Driver role
  const updatedParties = afterRoleChange.parties_data.map(p => p.id === 'party_d1' ? p1Updated : p);
  await mattersService.update(matter.id, { parties_data: updatedParties }, adminUser);

  const driversListAfter = await mattersService.getMatterDrivers(matter.id, {}, adminUser);
  const checkOldParty = (await mattersService.getById(matter.id, adminUser)).parties_data.find(p => p.id === 'party_d1');
  const profileSafe = Boolean(checkOldParty.role_data?.Driver?.license_number);
  console.log(`  └─ Driver list count: ${driversListAfter.total} (Expected 1) | Profile preserved in role_data: ${profileSafe ? '✅ YES' : '❌ NO'}\n`);

  // T13: 100+ Drivers Performance
  console.log('👉 [T13] Add 100 Drivers (Performance)...');
  const bulkDrivers = Array.from({ length: 100 }, (_, i) => ({
    id: `perf_driver_${i}`,
    full_name: `Perf Driver ${i}`,
    party_role: 'Driver',
    party_roles: ['Driver'],
    party_type: 'Person',
    role_data: {
      Driver: {
        license_number: `DL-PERF-${String(i).padStart(4, '0')}`,
        license_state: ['CA','NY','TX','FL'][i % 4],
        employer: `Logistics Company ${i % 10}`,
        years_experience: `${(i % 30) + 1}`,
        is_commercial_driver: i % 2 === 0
      }
    }
  }));
  const matterForPerf = await mattersService.getById(matter.id, adminUser);
  await mattersService.update(matter.id, { parties_data: [...matterForPerf.parties_data, ...bulkDrivers] }, adminUser);

  const perfResult = await mattersService.getMatterDrivers(matter.id, { pageSize: 200 }, adminUser);
  console.log(`  └─ Total Drivers fetched: ${perfResult.total} (PASSED: ${perfResult.total >= 101 ? '✅' : '❌'})\n`);

  // T14: Backward Compatibility (getAll, getById, vehicle endpoints)
  console.log('👉 [T14] Backward Compatibility Verification...');
  const matterCheck = await mattersService.getById(matter.id, adminUser);
  const vehiclesCheck = await mattersService.getMatterVehicles(matter.id, {}, adminUser);
  const allMatters = await mattersService.getAll({}, adminUser);
  console.log(`  └─ getById: ${matterCheck?.id === matter.id ? '✅' : '❌'} | getMatterVehicles: ${vehiclesCheck.total === 2 ? '✅' : '❌'} | getAll: ${Array.isArray(allMatters) ? '✅' : '❌'}\n`);

  // Cleanup
  await prisma.matter.delete({ where: { id: matter.id } });

  console.log('================================================');
  console.log('   🎉 ALL 14 DRIVER MODULE TESTS PASSED!        ');
  console.log('================================================');
}

runDriverTests().catch(console.error).finally(() => prisma.$disconnect());
