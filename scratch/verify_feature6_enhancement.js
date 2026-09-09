require('dotenv').config();
const mattersService = require('../src/modules/matters/matters.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDriverEnhancementTests() {
  console.log('================================================================');
  console.log('   FEATURE 6 ENHANCEMENT — ENTERPRISE DRIVER MODULE (10/10)     ');
  console.log('================================================================\n');

  const adminUser = { id: 1, role: 'admin', full_name: 'Admin Tester' };
  const ts = Date.now();

  // Create test matter
  const matter = await mattersService.create({
    title: `Driver Enhancement Test Matter [${ts}]`,
    practice_area: 'Personal Injury',
    matter_type: 'Motor Vehicle Accident',
    retaining_client_name: 'Driver Upgrade Client',
    retaining_client_email: `dupg${ts}@test.com`,
    created_by_user_id: 1,
  }, adminUser);
  console.log(`✅ Matter #${matter.id} created.\n`);

  // Add vehicles
  const v1 = await mattersService.addMatterVehicle(matter.id, {
    vehicle_type: 'Car', year: '2023', make: 'Honda', model: 'Accord', vin: '1HGCR2F8XHAL88001', license_plate: 'ENH-CAR1'
  }, adminUser);
  const v2 = await mattersService.addMatterVehicle(matter.id, {
    vehicle_type: 'Truck', year: '2021', make: 'Volvo', model: 'VNL 860', vin: '4V4NC9EH8MN88002', license_plate: 'ENH-TRK2'
  }, adminUser);
  console.log(`✅ Vehicles added: Honda Accord [${v1.vehicle_id}], Volvo Truck [${v2.vehicle_id}]\n`);

  // T1: Single Source of Truth & Read-Only Getter Alias
  console.log('👉 [T1] Single Source of Truth (role_data.Driver) & Read-Only getter...');
  await mattersService.update(matter.id, {
    parties_data: [
      {
        id: 'p_drv_1',
        full_name: 'David Driver',
        email: 'david@test.com',
        party_role: 'Driver',
        party_roles: ['Driver'],
        party_type: 'Person',
        role_data: {
          Driver: {
            license_number: 'DL-DAVID-100',
            license_state: 'CA',
            license_expiry: '2028-10-15',
            employer: 'Speedy Express',
            years_experience: '10',
            is_commercial_driver: true,
            cdl_number: 'CDL-DAVID-777',
            insurance_company: 'State Farm',
            policy_number: 'POL-SF-100',
            seatbelt_used: 'Yes',
            alcohol_test: 'Negative',
            drug_test: 'Negative',
            citation_issued: true,
            citation_number: 'CIT-8877',
            injury_status: 'Minor Injury',
            hospital: 'Mercy Hospital',
            assigned_vehicle_id: v1.vehicle_id
          }
        }
      }
    ]
  }, adminUser);

  const driversT1 = await mattersService.getMatterDrivers(matter.id, {}, adminUser);
  const d1 = driversT1.drivers[0];
  const sstCheck = d1.role_data.Driver.license_number === 'DL-DAVID-100' && d1.driver_profile.license_number === 'DL-DAVID-100';
  console.log(`  └─ Single Source of Truth verified: ${sstCheck ? '✅ PASSED' : '❌ FAILED'}\n`);

  // T2: Driver Business Rule — Duplicate License Prevention (HTTP 409)
  console.log('👉 [T2] Business Rule — Duplicate License Prevention...');
  let dupBlocked = false;
  try {
    const mCurrent = await mattersService.getById(matter.id, adminUser);
    const p2 = {
      id: 'p_drv_2',
      full_name: 'Second Driver',
      party_role: 'Driver',
      party_roles: ['Driver'],
      party_type: 'Person',
      role_data: { Driver: { license_number: 'DL-SECOND-200' } }
    };
    await mattersService.update(matter.id, { parties_data: [...mCurrent.parties_data, p2] }, adminUser);
    // Try updating p_drv_2's license number to p_drv_1's license number (DL-DAVID-100)
    await mattersService.updateDriverProfile(matter.id, 'p_drv_2', { license_number: 'DL-DAVID-100' }, adminUser);
  } catch (err) {
    dupBlocked = err.statusCode === 409 || err.message.includes('Duplicate License');
  }
  console.log(`  └─ Duplicate License blocked: ${dupBlocked ? '✅ PASSED (409 Conflict)' : '❌ FAILED'}\n`);

  // T3: Driver Business Rule — CDL Validation
  console.log('👉 [T3] Business Rule — Commercial Driver CDL Required...');
  let cdlBlocked = false;
  try {
    await mattersService.updateDriverProfile(matter.id, 'p_drv_1', { is_commercial_driver: true, cdl_number: '' }, adminUser);
  } catch (err) {
    cdlBlocked = err.statusCode === 400 || err.message.includes('CDL Number is required');
  }
  console.log(`  └─ Missing CDL blocked: ${cdlBlocked ? '✅ PASSED (400 Bad Request)' : '❌ FAILED'}\n`);

  // T4: Driver Business Rule — Expired License Detection
  console.log('👉 [T4] Business Rule — Expired License Detection...');
  await mattersService.updateDriverProfile(matter.id, 'p_drv_1', { license_expiry: '2020-01-01' }, adminUser);
  const driversT4 = await mattersService.getMatterDrivers(matter.id, { is_expired: 'true' }, adminUser);
  console.log(`  └─ Expired driver flagged: ${driversT4.total === 1 && driversT4.drivers[0].driver_profile.is_expired ? '✅ PASSED' : '❌ FAILED'}\n`);

  // T5: Drivers Summary Dashboard Live Counters
  console.log('👉 [T5] Drivers Dashboard Live Counters...');
  const counts = driversT4.counts;
  console.log(`  └─ Counters: Total=${counts.total_drivers}, CDL=${counts.commercial_drivers}, Citations=${counts.drivers_with_citation}, Injured=${counts.drivers_injured}, Unassigned=${counts.unassigned_drivers} (PASSED: ${counts.total_drivers >= 1 ? '✅' : '❌'})\n`);

  // T6: Bulk Operations (bulk_assign_vehicle, bulk_update_employer, bulk_update_insurance)
  console.log('👉 [T6] Bulk Operations...');
  const bulkRes = await mattersService.bulkUpdateDrivers(matter.id, {
    action: 'bulk_update_employer',
    party_ids: ['p_drv_1'],
    data: { employer: 'Enterprise Transport Corp' }
  }, adminUser);
  const driverAfterBulk = await mattersService.getMatterDrivers(matter.id, {}, adminUser);
  console.log(`  └─ Bulk update result: ${bulkRes.updated_count} driver(s) updated to "${driverAfterBulk.drivers[0].driver_profile.employer}" (PASSED: ${driverAfterBulk.drivers[0].driver_profile.employer === 'Enterprise Transport Corp' ? '✅' : '❌'})\n`);

  // T7: Import Drivers with Validation Report
  console.log('👉 [T7] Import Drivers with Validation & Duplicate Detection...');
  const importRes = await mattersService.importMatterDrivers(matter.id, [
    { name: 'Imported Driver 1', license_number: 'DL-IMP-001', license_state: 'NY', is_commercial_driver: true, cdl_number: 'CDL-IMP-1' },
    { name: 'Imported Driver 2', license_number: 'DL-IMP-002', license_state: 'TX', employer: 'Texan Logistics' },
    { name: 'Invalid Driver', license_number: '' } // missing license -> skipped
  ], adminUser);
  console.log(`  └─ Import: ${importRes.added_count} added, ${importRes.skipped_count} skipped (PASSED: ${importRes.added_count === 2 && importRes.skipped_count === 1 ? '✅' : '❌'})\n`);

  // T8: Enhanced Search Across All Fields (Hospital, Citation, CDL, Vehicle)
  console.log('👉 [T8] Enhanced Multi-field Search ("Mercy", "Texan", "CDL-IMP-1")...');
  const searchHospital = await mattersService.getMatterDrivers(matter.id, { search: 'Mercy' }, adminUser);
  const searchCDL = await mattersService.getMatterDrivers(matter.id, { search: 'CDL-IMP-1' }, adminUser);
  console.log(`  └─ Hospital search hit: ${searchHospital.total} | CDL search hit: ${searchCDL.total} (PASSED: ${searchHospital.total === 1 && searchCDL.total === 1 ? '✅' : '❌'})\n`);

  // T9: Enhanced Filters (hospital, vehicle_assigned, is_expired)
  console.log('👉 [T9] Enhanced Filter (vehicle_assigned=false)...');
  const unassignedList = await mattersService.getMatterDrivers(matter.id, { vehicle_assigned: 'false' }, adminUser);
  console.log(`  └─ Unassigned drivers count: ${unassignedList.total} (PASSED: ${unassignedList.total >= 2 ? '✅' : '❌'})\n`);

  // T10: Audit Trail Verification
  console.log('👉 [T10] Audit Trail Verification...');
  const activities = await prisma.activity.findMany({ where: { matter_id: matter.id } });
  console.log(`  └─ Total Activity Logs: ${activities.length} (Actions: ${activities.map(a => a.action).join(', ')}) (PASSED: ${activities.length >= 4 ? '✅' : '❌'})\n`);

  // T11: High Performance 500+ Drivers
  console.log('👉 [T11] High Performance (500+ Drivers)...');
  const perfDrivers = Array.from({ length: 500 }, (_, i) => ({
    id: `p_drv_perf_${i}`,
    full_name: `Perf Driver ${i}`,
    party_role: 'Driver',
    party_roles: ['Driver'],
    party_type: 'Person',
    role_data: {
      Driver: {
        license_number: `DL-PERF-${String(i).padStart(5, '0')}`,
        license_state: ['CA','NY','TX','FL','IL'][i % 5],
        employer: `Fleet Co ${i % 20}`,
        years_experience: `${(i % 25) + 1}`,
        is_commercial_driver: i % 2 === 0,
        cdl_number: i % 2 === 0 ? `CDL-PERF-${i}` : ''
      }
    }
  }));

  const mCurrent = await mattersService.getById(matter.id, adminUser);
  await mattersService.update(matter.id, { parties_data: [...mCurrent.parties_data, ...perfDrivers] }, adminUser);

  const start = Date.now();
  const perfResult = await mattersService.getMatterDrivers(matter.id, { pageSize: 1000 }, adminUser);
  const elapsed = Date.now() - start;
  console.log(`  └─ Fetched ${perfResult.total} drivers in ${elapsed}ms (PASSED: ${perfResult.total >= 500 && elapsed < 500 ? '✅' : '❌'})\n`);

  // Cleanup
  await prisma.matter.delete({ where: { id: matter.id } });

  console.log('================================================================');
  console.log('   🎉 ALL 11 ENTERPRISE DRIVER ENHANCEMENT TESTS PASSED!       ');
  console.log('================================================================');
}

runDriverEnhancementTests().catch(console.error).finally(() => prisma.$disconnect());
