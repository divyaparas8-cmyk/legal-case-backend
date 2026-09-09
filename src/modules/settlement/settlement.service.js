const prisma = require('../../config/db');

/**
 * Initialize dedicated MySQL table `matter_settlements` if it does not already exist.
 */
let dbInitialized = false;
async function ensureTableExists() {
  if (dbInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS matter_settlements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        matter_id INT NOT NULL,
        demand_amount DECIMAL(12,2) DEFAULT 0.00,
        initial_offer DECIMAL(12,2) DEFAULT 0.00,
        counter_offer DECIMAL(12,2) DEFAULT 0.00,
        final_settlement_amount DECIMAL(12,2) DEFAULT 0.00,
        future_medical_expenses DECIMAL(12,2) DEFAULT 0.00,
        pain_and_suffering DECIMAL(12,2) DEFAULT 0.00,
        out_of_pocket_expenses DECIMAL(12,2) DEFAULT 0.00,
        miscellaneous_damages DECIMAL(12,2) DEFAULT 0.00,
        punitive_damages DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Open',
        settlement_date DATE,
        notes TEXT,
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_matter (matter_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    dbInitialized = true;
  } catch (err) {
    console.error('Failed to initialize matter_settlements table:', err);
  }
}

/**
 * Calculate automated financial totals from Matter JSON objects (parties_data & vehicles_data)
 */
async function calculateAutomatedTotals(matterId) {
  const matter = await prisma.matter.findUnique({
    where: { id: parseInt(matterId, 10) },
    select: { id: true, parties_data: true, vehicles_data: true }
  });

  if (!matter) {
    return {
      medical_expenses: 0,
      lost_wages: 0,
      property_damage: 0,
      vehicle_repair_cost: 0,
      insurance_limits: 0
    };
  }

  let medicalExpenses = 0;
  let lostWages = 0;
  let propertyDamage = 0;
  let vehicleRepairCost = 0;
  let insuranceLimits = 0;

  // Process parties_data JSON
  if (matter.parties_data) {
    try {
      const parties = typeof matter.parties_data === 'string' ? JSON.parse(matter.parties_data) : matter.parties_data;
      if (Array.isArray(parties)) {
        parties.forEach(p => {
          const role = (p.party_role || p.role || '').toLowerCase();
          const pType = (p.party_type || '').toLowerCase();
          
          // Medical Costs
          if (role.includes('medical') || pType.includes('medical')) {
            const bill = Number(p.medical_bills_total || p.total_bill || p.bill_amount || p.expenses || p.cost || 0);
            medicalExpenses += bill;
          }

          // Lost Wages
          if (role.includes('employer') || pType.includes('employer')) {
            const wage = Number(p.lost_wages || p.wage_loss || p.salary_loss || p.monthly_wage || 0);
            lostWages += wage;
          }

          // Property Damage
          if (role.includes('property') || pType.includes('property')) {
            const prop = Number(p.property_damage_amount || p.damage_estimate || p.cost || 0);
            propertyDamage += prop;
          }

          // Insurance Policy Limits
          if (role.includes('insurance') || pType.includes('insurance')) {
            const limit = Number(p.policy_limit || p.coverage_limit || p.settlement_limit || p.paid_amount || 0);
            insuranceLimits += limit;
          }
        });
      }
    } catch (e) { /* ignore JSON parse err */ }
  }

  // Process vehicles_data JSON
  if (matter.vehicles_data) {
    try {
      const vehicles = typeof matter.vehicles_data === 'string' ? JSON.parse(matter.vehicles_data) : matter.vehicles_data;
      if (Array.isArray(vehicles)) {
        vehicles.forEach(v => {
          const repair = Number(v.repair_cost || v.estimated_damage || v.vehicle_damage || v.cost || 0);
          vehicleRepairCost += repair;
        });
      }
    } catch (e) { /* ignore JSON parse err */ }
  }

  return {
    medical_expenses: medicalExpenses,
    lost_wages: lostWages,
    property_damage: propertyDamage,
    vehicle_repair_cost: vehicleRepairCost,
    insurance_limits: insuranceLimits
  };
}

const getSettlement = async (matterId, user) => {
  await ensureTableExists();
  const mId = parseInt(matterId, 10);

  const [historyRows, autoCalculated] = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT * FROM matter_settlements 
      WHERE matter_id = ${mId}
      ORDER BY created_at DESC
    `),
    calculateAutomatedTotals(mId)
  ]);

  const history = Array.isArray(historyRows) ? historyRows : [];
  const latest = history.length > 0 ? history[0] : null;

  const futureMedical = Number(latest?.future_medical_expenses || 0);
  const painSuffering = Number(latest?.pain_and_suffering || 0);
  const outOfPocket = Number(latest?.out_of_pocket_expenses || 0);
  const miscDamages = Number(latest?.miscellaneous_damages || 0);
  const punitiveDamages = Number(latest?.punitive_damages || 0);

  const totalEconomicDamages = autoCalculated.medical_expenses +
    autoCalculated.lost_wages +
    autoCalculated.property_damage +
    autoCalculated.vehicle_repair_cost +
    futureMedical +
    outOfPocket +
    miscDamages;

  const totalNonEconomicDamages = painSuffering + punitiveDamages;
  const totalClaimedDamages = totalEconomicDamages + totalNonEconomicDamages;

  const demandAmount = Number(latest?.demand_amount || 0);
  const counterOffer = Number(latest?.counter_offer || 0);
  const initialOffer = Number(latest?.initial_offer || 0);
  const finalSettlement = Number(latest?.final_settlement_amount || 0);

  let estimatedSettlementValue = totalClaimedDamages;
  if (finalSettlement > 0) estimatedSettlementValue = finalSettlement;
  else if (counterOffer > 0) estimatedSettlementValue = counterOffer;
  else if (demandAmount > 0) estimatedSettlementValue = demandAmount;
  else if (initialOffer > 0) estimatedSettlementValue = initialOffer;

  return {
    matter_id: mId,
    auto_calculated: autoCalculated,
    latest_settlement: latest,
    history,
    summary: {
      medical_expenses: autoCalculated.medical_expenses,
      lost_wages: autoCalculated.lost_wages,
      property_damage: autoCalculated.property_damage,
      vehicle_repair_cost: autoCalculated.vehicle_repair_cost,
      insurance_limits: autoCalculated.insurance_limits,
      future_medical_expenses: futureMedical,
      pain_and_suffering: painSuffering,
      out_of_pocket_expenses: outOfPocket,
      miscellaneous_damages: miscDamages,
      punitive_damages: punitiveDamages,
      total_economic_damages: totalEconomicDamages,
      total_non_economic_damages: totalNonEconomicDamages,
      total_claimed_damages: totalClaimedDamages,
      estimated_settlement_value: estimatedSettlementValue,
      demand_amount: demandAmount,
      initial_offer: initialOffer,
      counter_offer: counterOffer,
      final_settlement_amount: finalSettlement,
      status: latest?.status || 'Open'
    }
  };
};

const createSettlement = async (matterId, data, user) => {
  await ensureTableExists();
  const mId = parseInt(matterId, 10);
  const {
    demand_amount = 0,
    initial_offer = 0,
    counter_offer = 0,
    final_settlement_amount = 0,
    future_medical_expenses = 0,
    pain_and_suffering = 0,
    out_of_pocket_expenses = 0,
    miscellaneous_damages = 0,
    punitive_damages = 0,
    status = 'Open',
    settlement_date = null,
    notes = ''
  } = data;

  const dAmt = Math.max(0, Number(demand_amount) || 0);
  const iOff = Math.max(0, Number(initial_offer) || 0);
  const cOff = Math.max(0, Number(counter_offer) || 0);
  const fAmt = Math.max(0, Number(final_settlement_amount) || 0);
  const fMed = Math.max(0, Number(future_medical_expenses) || 0);
  const pSuf = Math.max(0, Number(pain_and_suffering) || 0);
  const oPkt = Math.max(0, Number(out_of_pocket_expenses) || 0);
  const mDmg = Math.max(0, Number(miscellaneous_damages) || 0);
  const pDmg = Math.max(0, Number(punitive_damages) || 0);

  const cleanStatus = (status || 'Open').trim();
  const cleanNotes = notes ? notes.trim() : '';
  const sDate = settlement_date ? `'${settlement_date}'` : 'NULL';
  const userId = user?.id ? parseInt(user.id, 10) : null;

  await prisma.$executeRawUnsafe(`
    INSERT INTO matter_settlements (
      matter_id, demand_amount, initial_offer, counter_offer, final_settlement_amount,
      future_medical_expenses, pain_and_suffering, out_of_pocket_expenses,
      miscellaneous_damages, punitive_damages, status, settlement_date, notes, created_by, created_at, updated_at
    )
    VALUES (
      ${mId}, ${dAmt}, ${iOff}, ${cOff}, ${fAmt},
      ${fMed}, ${pSuf}, ${oPkt},
      ${mDmg}, ${pDmg}, '${cleanStatus.replace(/'/g, "''")}', ${sDate}, ${cleanNotes ? `'${cleanNotes.replace(/'/g, "''")}'` : 'NULL'}, ${userId || 'NULL'}, NOW(), NOW()
    )
  `);

  // Audit Log to Activity/Timeline
  await prisma.activity.create({
    data: {
      matter_id: mId,
      entity_type: 'matter',
      entity_id: mId,
      action: 'settlement_created',
      description: `Settlement record created for Matter #${mId} (Demand: $${dAmt.toLocaleString()}, Status: ${cleanStatus})`,
      actor_user_id: user?.id || null
    }
  });

  return await getSettlement(mId, user);
};

const updateSettlement = async (id, data, user) => {
  await ensureTableExists();
  const sId = parseInt(id, 10);

  const existingRows = await prisma.$queryRawUnsafe(`
    SELECT * FROM matter_settlements WHERE id = ${sId}
  `);

  if (!Array.isArray(existingRows) || existingRows.length === 0) {
    const err = new Error('Settlement record not found.');
    err.statusCode = 404;
    throw err;
  }

  const existing = existingRows[0];
  const {
    demand_amount,
    initial_offer,
    counter_offer,
    final_settlement_amount,
    future_medical_expenses,
    pain_and_suffering,
    out_of_pocket_expenses,
    miscellaneous_damages,
    punitive_damages,
    status,
    settlement_date,
    notes
  } = data;

  const dAmt = Math.max(0, Number(demand_amount !== undefined ? demand_amount : existing.demand_amount) || 0);
  const iOff = Math.max(0, Number(initial_offer !== undefined ? initial_offer : existing.initial_offer) || 0);
  const cOff = Math.max(0, Number(counter_offer !== undefined ? counter_offer : existing.counter_offer) || 0);
  const fAmt = Math.max(0, Number(final_settlement_amount !== undefined ? final_settlement_amount : existing.final_settlement_amount) || 0);
  const fMed = Math.max(0, Number(future_medical_expenses !== undefined ? future_medical_expenses : existing.future_medical_expenses) || 0);
  const pSuf = Math.max(0, Number(pain_and_suffering !== undefined ? pain_and_suffering : existing.pain_and_suffering) || 0);
  const oPkt = Math.max(0, Number(out_of_pocket_expenses !== undefined ? out_of_pocket_expenses : existing.out_of_pocket_expenses) || 0);
  const mDmg = Math.max(0, Number(miscellaneous_damages !== undefined ? miscellaneous_damages : existing.miscellaneous_damages) || 0);
  const pDmg = Math.max(0, Number(punitive_damages !== undefined ? punitive_damages : existing.punitive_damages) || 0);

  const cleanStatus = (status !== undefined ? status : existing.status).trim();
  const cleanNotes = notes !== undefined ? notes.trim() : (existing.notes || '');
  const sDate = settlement_date !== undefined ? (settlement_date ? `'${settlement_date}'` : 'NULL') : (existing.settlement_date ? `'${existing.settlement_date.toISOString().split('T')[0]}'` : 'NULL');

  await prisma.$executeRawUnsafe(`
    UPDATE matter_settlements
    SET demand_amount = ${dAmt},
        initial_offer = ${iOff},
        counter_offer = ${cOff},
        final_settlement_amount = ${fAmt},
        future_medical_expenses = ${fMed},
        pain_and_suffering = ${pSuf},
        out_of_pocket_expenses = ${oPkt},
        miscellaneous_damages = ${mDmg},
        punitive_damages = ${pDmg},
        status = '${cleanStatus.replace(/'/g, "''")}',
        settlement_date = ${sDate},
        notes = ${cleanNotes ? `'${cleanNotes.replace(/'/g, "''")}'` : 'NULL'},
        updated_at = NOW()
    WHERE id = ${sId}
  `);

  const statusChanged = existing.status !== cleanStatus;
  const actionType = statusChanged ? 'settlement_status_changed' : 'settlement_updated';

  // Audit Log to Activity/Timeline
  await prisma.activity.create({
    data: {
      matter_id: existing.matter_id,
      entity_type: 'matter',
      entity_id: existing.matter_id,
      action: actionType,
      description: `Settlement record #${sId} updated (Status: ${cleanStatus}, Demand: $${dAmt.toLocaleString()})`,
      actor_user_id: user?.id || null
    }
  });

  return await getSettlement(existing.matter_id, user);
};

const deleteSettlement = async (id, user) => {
  await ensureTableExists();
  const sId = parseInt(id, 10);

  const existingRows = await prisma.$queryRawUnsafe(`
    SELECT * FROM matter_settlements WHERE id = ${sId}
  `);

  if (!Array.isArray(existingRows) || existingRows.length === 0) {
    const err = new Error('Settlement record not found.');
    err.statusCode = 404;
    throw err;
  }

  const existing = existingRows[0];

  await prisma.$executeRawUnsafe(`
    DELETE FROM matter_settlements WHERE id = ${sId}
  `);

  // Audit Log to Activity/Timeline
  await prisma.activity.create({
    data: {
      matter_id: existing.matter_id,
      entity_type: 'matter',
      entity_id: existing.matter_id,
      action: 'settlement_deleted',
      description: `Deleted settlement record #${sId}`,
      actor_user_id: user?.id || null
    }
  });

  return { success: true, deleted_id: sId };
};

module.exports = {
  getSettlement,
  createSettlement,
  updateSettlement,
  deleteSettlement
};
