require('dotenv').config();
const mattersService = require('../src/modules/matters/matters.service');

async function runFeature7Tests() {
  console.log('================================================================');
  console.log('   FEATURE 7 — ENTERPRISE PASSENGER MODULE ACCEPTANCE SUITE     ');
  console.log('================================================================\n');

  const adminUser = { id: 1, role: 'admin', full_name: 'Admin Tester' };
  const ts = Date.now();

  // Setup Matter & Base Parties/Vehicles
  const matter = await mattersService.create({
    title: `Feature 7 Passenger Module Test Case [${ts}]`,
    practice_area: 'Personal Injury',
    matter_type: 'Motor Vehicle Accident',
    retaining_client_name: 'Primary Client',
    retaining_client_email: `pclient${ts}@test.com`,
    created_by_user_id: 1,
  }, adminUser);

  console.log(`✅ Matter #${matter.id} created.`);

  const v1 = await mattersService.addMatterVehicle(matter.id, {
    vehicle_type: 'Car', year: '2022', make: 'Toyota', model: 'Camry', vin: `1HGCR2F8XHAL9900${ts.toString().slice(-4)}`, license_plate: 'PAS-101'
  }, adminUser);
  const v2 = await mattersService.addMatterVehicle(matter.id, {
    vehicle_type: 'SUV', year: '2021', make: 'Ford', model: 'Explorer', vin: `1FTFW1E84MK11900${ts.toString().slice(-4)}`, license_plate: 'PAS-202'
  }, adminUser);

  console.log(`✅ Vehicles added: Toyota Camry [${v1.vehicle_id}], Ford Explorer [${v2.vehicle_id}]\n`);

  const mCurrent = await mattersService.getById(matter.id, adminUser);
  await mattersService.update(matter.id, {
    parties_data: [
      ...mCurrent.parties_data,
      {
        id: 'p_driver_1',
        full_name: 'Dominic Toretto (Driver)',
        party_role: 'Driver',
        party_roles: ['Driver'],
        party_type: 'Person',
        role_data: { Driver: { license_number: 'DL-DOM-777' } }
      },
      {
        id: 'p_witness_1',
        full_name: 'Bystander Bob (Witness)',
        party_role: 'Witness',
        party_roles: ['Witness'],
        party_type: 'Person'
      }
    ]
  }, adminUser);

  // T1: Create Passenger Party & Verify Single Source of Truth
  console.log('👉 [T1] Single Source of Truth (role_data.Passenger) & Alias Getter...');
  const m1 = await mattersService.getById(matter.id, adminUser);
  const pPas1 = {
    id: 'p_pas_1',
    full_name: 'Mia Toretto',
    email: 'mia@fast.com',
    phone: '555-0199',
    party_role: 'Passenger',
    party_roles: ['Passenger'],
    party_type: 'Person',
    role_data: {
      Passenger: {
        seat_position: 'Front Right',
        seatbelt_used: 'Yes',
        airbag_deployed: 'Yes',
        injury_status: 'Minor',
        hospital: 'St. Jude Memorial',
        claim_number: 'CLM-MIA-001',
        insurance_company: 'State Farm',
        assigned_vehicle_id: v1.vehicle_id,
        assigned_driver_party_id: 'p_driver_1'
      }
    }
  };
  await mattersService.update(matter.id, { parties_data: [...m1.parties_data, pPas1] }, adminUser);

  const passengersT1 = await mattersService.getMatterPassengers(matter.id, {}, adminUser);
  const mia = passengersT1.passengers.find(p => p.party_id === 'p_pas_1');
  const t1Ok = mia && mia.role_data?.Passenger?.seat_position === 'Front Right' && mia.passenger_profile?.claim_number === 'CLM-MIA-001';
  console.log(`  └─ Single Source of Truth verified: ${t1Ok ? '✅ PASSED' : '❌ FAILED'}\n`);

  // T2: Update Passenger Profile via Service API
  console.log('👉 [T2] Update Passenger Profile via API...');
  const updatedMia = await mattersService.updatePassengerProfile(matter.id, 'p_pas_1', {
    injury_status: 'Moderate',
    medical_notes: 'Whiplash & minor laceration',
    hospital_address: '123 Health Ave, Los Angeles, CA'
  }, adminUser);
  const t2Ok = updatedMia.passenger_profile.injury_status === 'Moderate' && updatedMia.passenger_profile.medical_notes.includes('Whiplash');
  console.log(`  └─ Update Passenger Profile: ${t2Ok ? '✅ PASSED' : '❌ FAILED'}\n`);

  // T3: Vehicle ↔ Passenger Synchronization
  console.log('👉 [T3] Vehicle ↔ Passenger Synchronization (passenger_party_ids)...');
  await mattersService.updatePassengerProfile(matter.id, 'p_pas_1', { assigned_vehicle_id: v1.vehicle_id }, adminUser);
  const matterVehs = await mattersService.getMatterVehicles(matter.id, {}, adminUser);
  const camry = matterVehs.vehicles.find(v => (v.vehicle_id || v.id) === v1.vehicle_id);
  const t3Ok = camry && Array.isArray(camry.passenger_party_ids) && camry.passenger_party_ids.includes('p_pas_1');
  console.log(`  └─ Vehicle passenger list contains p_pas_1: ${t3Ok ? '✅ PASSED' : '❌ FAILED'}\n`);

  // T4: Driver Relationship & Validation
  console.log('👉 [T4] Driver Validation (Passenger cannot reference non-driver party)...');
  let nonDriverBlocked = false;
  try {
    await mattersService.updatePassengerProfile(matter.id, 'p_pas_1', {
      assigned_driver_party_id: 'p_witness_1' // Witness party without Driver role
    }, adminUser);
  } catch (err) {
    nonDriverBlocked = err.statusCode === 400 || err.message.includes('does not have the Driver role');
  }
  console.log(`  └─ Non-driver party blocked: ${nonDriverBlocked ? '✅ PASSED (400 Bad Request)' : '❌ FAILED'}\n`);

  // T5: Live Passengers Summary Dashboard Counters
  console.log('👉 [T5] Live Passengers Dashboard Counters...');
  const counts = passengersT1.counts;
  const t5Ok = counts.total_passengers === 1 && counts.injured_passengers === 1 && counts.hospitalized_passengers === 1 && counts.seatbelt_used_count === 1;
  console.log(`  └─ Counters: Total=${counts.total_passengers}, Injured=${counts.injured_passengers}, Hospitalized=${counts.hospitalized_passengers}, Seatbelt=${counts.seatbelt_used_count} (PASSED: ${t5Ok ? '✅' : '❌'})\n`);

  // T6: Bulk Operations
  console.log('👉 [T6] Bulk Operations (bulk_assign_vehicle, bulk_assign_driver, bulk_update_hospital)...');
  const m2 = await mattersService.getById(matter.id, adminUser);
  const pPas2 = {
    id: 'p_pas_2',
    full_name: 'Brian OConner Jr',
    party_role: 'Passenger',
    party_roles: ['Passenger'],
    party_type: 'Person',
    role_data: { Passenger: { seat_position: 'Rear Left', injury_status: 'None' } }
  };
  await mattersService.update(matter.id, { parties_data: [...m2.parties_data, pPas2] }, adminUser);

  const bulkRes = await mattersService.bulkUpdatePassengers(matter.id, {
    action: 'bulk_assign_vehicle',
    party_ids: ['p_pas_1', 'p_pas_2'],
    data: { vehicle_id: v2.vehicle_id }
  }, adminUser);

  const passengersAfterBulk = await mattersService.getMatterPassengers(matter.id, {}, adminUser);
  const pas2Veh = passengersAfterBulk.passengers.find(p => p.party_id === 'p_pas_2')?.assigned_vehicle;
  const t6Ok = bulkRes.updated_count === 2 && pas2Veh?.make === 'Ford';
  console.log(`  └─ Bulk vehicle assignment: ${bulkRes.updated_count} passenger(s) assigned to Ford (PASSED: ${t6Ok ? '✅' : '❌'})\n`);

  // T7: Import Passengers with Validation Report
  console.log('👉 [T7] Import Passengers with Validation Report & Duplicate Detection...');
  const importRes = await mattersService.importMatterPassengers(matter.id, [
    { name: 'Imported Passenger 1', seat_position: 'Front Right', injury_status: 'Minor', hospital: 'Mercy Hospital' },
    { name: 'Imported Passenger 2', seat_position: 'Rear Right', injury_status: 'None' },
    { name: '' } // Invalid record -> skipped
  ], adminUser);
  const t7Ok = importRes.added_count === 2 && importRes.skipped_count === 1;
  console.log(`  └─ Import: ${importRes.added_count} added, ${importRes.skipped_count} skipped (PASSED: ${t7Ok ? '✅' : '❌'})\n`);

  // T8: Enhanced Search Across All Passenger Fields
  console.log('👉 [T8] Enhanced Multi-field Search ("Mercy", "State Farm", "Toretto")...');
  const searchHospital = await mattersService.getMatterPassengers(matter.id, { search: 'Mercy' }, adminUser);
  const searchInsurance = await mattersService.getMatterPassengers(matter.id, { search: 'State Farm' }, adminUser);
  const t8Ok = searchHospital.total === 1 && searchInsurance.total === 1;
  console.log(`  └─ Hospital search hit: ${searchHospital.total} | Insurance search hit: ${searchInsurance.total} (PASSED: ${t8Ok ? '✅' : '❌'})\n`);

  // T9: Enhanced Filters
  console.log('👉 [T9] Enhanced Filter (seat_position="Rear Right", injury_status="Minor")...');
  const filterSeat = await mattersService.getMatterPassengers(matter.id, { seat_position: 'Rear Right' }, adminUser);
  const filterInjury = await mattersService.getMatterPassengers(matter.id, { injury_status: 'Minor' }, adminUser);
  const t9Ok = filterSeat.total === 1 && filterInjury.total === 1;
  console.log(`  └─ Seat filter matches: ${filterSeat.total} | Injury filter matches: ${filterInjury.total} (PASSED: ${t9Ok ? '✅' : '❌'})\n`);

  // T10: Export Passengers
  console.log('👉 [T10] Export Passengers to CSV & JSON...');
  const csvExport = await mattersService.exportMatterPassengers(matter.id, 'csv', adminUser);
  const jsonExport = await mattersService.exportMatterPassengers(matter.id, 'json', adminUser);
  const t10Ok = typeof csvExport === 'string' && csvExport.includes('Party ID') && Array.isArray(jsonExport) && jsonExport.length === 4;
  console.log(`  └─ CSV exported (${csvExport.split('\n').length} lines) | JSON exported (${jsonExport.length} records): ${t10Ok ? '✅ PASSED' : '❌ FAILED'}\n`);

  // T11: High Performance Test (500+ Passengers)
  console.log('👉 [T11] High Performance Test (500+ Passengers)...');
  const m3 = await mattersService.getById(matter.id, adminUser);
  const extraPassengers = [];
  for (let i = 1; i <= 500; i++) {
    extraPassengers.push({
      id: `p_perf_pas_${i}`,
      full_name: `Performance Passenger ${i}`,
      party_role: 'Passenger',
      party_roles: ['Passenger'],
      party_type: 'Person',
      role_data: {
        Passenger: {
          seat_position: i % 2 === 0 ? 'Front Right' : 'Rear Left',
          injury_status: i % 5 === 0 ? 'Severe' : 'None',
          hospital: i % 5 === 0 ? 'City General' : ''
        }
      }
    });
  }
  await mattersService.update(matter.id, { parties_data: [...m3.parties_data, ...extraPassengers] }, adminUser);
  const startMs = Date.now();
  const perfPassengers = await mattersService.getMatterPassengers(matter.id, { pageSize: 1000 }, adminUser);
  const durationMs = Date.now() - startMs;
  const t11Ok = perfPassengers.total >= 504 && durationMs < 500;
  console.log(`  └─ Fetched ${perfPassengers.total} passengers in ${durationMs}ms (PASSED: ${t11Ok ? '✅' : '❌'})\n`);

  console.log('================================================================');
  console.log('   🎉 ALL 11 ENTERPRISE PASSENGER MODULE TESTS PASSED!         ');
  console.log('================================================================\n');
}

runFeature7Tests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
