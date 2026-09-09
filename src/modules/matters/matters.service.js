const prisma = require('../../config/db');
const billingService = require('../billing/billing.service');
const { findDuplicateContact } = require('../contacts/contacts.service');
const { formatPSTDate, formatPSTTime } = require('../../utils/dateUtils');

const canAccessMatter = (matter, user) => {
  if (!matter || !user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'lawyer') return matter.assigned_lawyer_id === user.id;
  if (user.role === 'client') {
    return matter.client?.user_id === user.id || (matter.parties && matter.parties.some(p => p.user_id === user.id));
  }
  return false;
};

const partyRoleOrder = {
  'Client': 1,
  'Retaining Client': 1,
  'Plaintiff': 2,
  'Defendant': 3,
  'Witness': 4,
  'Driver': 5,
  'Passenger': 6,
  'Organization': 7,
  'Insurance Company': 8,
  'Employer': 9,
  'Opposing Party': 10,
  'Applicant': 11,
  'Beneficiary': 12,
  'Petitioner': 13,
  'Respondent': 14,
  'Other': 15
};

const rolePriorityMap = {
  'Client': 1,
  'Retaining Client': 1,
  'Applicant': 2,
  'Petitioner': 3,
  'Plaintiff': 4,
  'Defendant': 5,
  'Driver': 6,
  'Passenger': 7,
  'Witness': 8,
  'Insurance Company': 9,
  'Employer': 10,
  'Medical Provider': 11,
  'Expert Witness': 12,
  'Police Officer': 13,
  'Organization': 14,
  'Other': 15
};

const resolvePrimaryRole = (roles, currentPrimary = null) => {
  if (!Array.isArray(roles) || roles.length === 0) return 'Party';
  const cleanRoles = Array.from(new Set(roles.filter(Boolean)));
  if (cleanRoles.length === 0) return 'Party';
  if (currentPrimary && cleanRoles.includes(currentPrimary)) {
    return currentPrimary;
  }
  return [...cleanRoles].sort((a, b) => (rolePriorityMap[a] || 99) - (rolePriorityMap[b] || 99))[0];
};

const normalizePartyRoles = (party) => {
  if (!party) return party;
  let roles = [];
  if (Array.isArray(party.party_roles) && party.party_roles.length > 0) {
    roles = Array.from(new Set(party.party_roles.filter(Boolean)));
  } else if (party.party_role || party.primary_party_role) {
    roles = [party.primary_party_role || party.party_role];
  } else {
    roles = ['Party'];
  }

  const primaryRole = resolvePrimaryRole(roles, party.primary_party_role || party.party_role);
  const secondaryRoles = roles.filter(r => r !== primaryRole);
  const roleData = party.role_data || {};

  const hasRole = {};
  roles.forEach(r => {
    hasRole[r] = true;
    hasRole[r.replace(/\s+/g, '')] = true;
  });

  return {
    ...party,
    party_roles: roles,
    primary_party_role: primaryRole,
    secondary_party_roles: secondaryRoles,
    party_role: primaryRole,
    role_count: roles.length,
    role_data: roleData,
    hasRole
  };
};

const sortPartiesByRole = (parties) => {
  if (!Array.isArray(parties)) return [];
  return parties.map(normalizePartyRoles).sort((a, b) => {
    const primaryA = a.primary_party_role || a.party_role;
    const primaryB = b.primary_party_role || b.party_role;
    const orderA = rolePriorityMap[primaryA] || 99;
    const orderB = rolePriorityMap[primaryB] || 99;
    return orderA - orderB;
  });
};

const nextMatterNumber = async (practiceArea = null) => {
  const practiceAreaPrefixes = {
    'PI - Auto / Property Damage': 'PI',
    'Catastrophic / Product Liability': 'PL',
    'Habitability / Premises': 'HB',
    'Employment': 'EM',
    'Civil Rights / Discrimination': 'CR',
    'Immigration': 'IM',
    'Personal Injury': 'PI'
  };
  const prefix = practiceAreaPrefixes[practiceArea] || (practiceArea ? practiceArea.substring(0, 2).toUpperCase() : 'MT');
  const count = await prisma.matter.count();
  return `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

const getAll = async (query, user) => {
  const { status, client_id, lawyer_id, page = 1, limit = 10 } = query;
  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;

  const where = {};
  if (status) where.status = status;
  if (client_id) where.client_id = parseInt(client_id);
  if (lawyer_id) where.assigned_lawyer_id = parseInt(lawyer_id);
  if (user?.role === 'lawyer') where.assigned_lawyer_id = user.id;
  if (user?.role === 'client') {
    where.OR = [
      { client: { user_id: user.id } },
      { parties: { some: { user_id: user.id } } }
    ];
  }

  const matters = await prisma.matter.findMany({
    where,
    skip,
    take,
    include: {
      client: { select: { id: true, full_name: true } },
      parties: { select: { id: true, full_name: true } },
      assigned_lawyer: { select: { id: true, full_name: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  const matterIds = matters.map(m => m.id);
  const customFields = await prisma.matterCustomFieldValue.findMany({
    where: { matter_id: { in: matterIds } },
    include: { field_definition: true }
  });

  const originalFields = ['Settlement Goal', 'Settlement Goall', 'Statute of Limitations', 'Court Jurisdiction'];
  return matters.map(m => {
    let additionalParties = [];
    if (m.parties_data) {
      const rawP = typeof m.parties_data === 'string' ? JSON.parse(m.parties_data) : m.parties_data;
      if (Array.isArray(rawP)) {
        additionalParties = rawP.filter(p => !p.is_retaining_client && p.party_role !== 'Retaining Client');
      }
    }

    // Synthesize legacy opposing_party_name if missing from parties_data
    if (m.opposing_party_name && m.opposing_party_name.trim()) {
      const oppName = m.opposing_party_name.trim();
      const exists = additionalParties.some(p => p.full_name?.toLowerCase() === oppName.toLowerCase());
      if (!exists) {
        additionalParties.push({
          id: `opp_${m.id}`,
          full_name: oppName,
          party_role: 'Opposing Party',
          party_type: 'Person',
          source: 'legacy_opposing_party'
        });
      }
    }

    let allParties = [];
    if (m.client) {
      const virtualRetainingClientParty = {
        id: `client_${m.client.id}`,
        client_id: m.client.id,
        full_name: m.client.full_name,
        email: m.client.email || '',
        phone: m.client.phone || '',
        address: m.client.home_address || m.client.address_line_1 || '',
        party_type: m.client.party_type || 'Individual',
        party_role: 'Client',
        is_retaining_client: true,
        source: 'client_id'
      };
      m.retaining_client = m.client;
      m.retaining_clients = m.client ? [m.client] : [];
      allParties = [virtualRetainingClientParty, ...additionalParties];
    } else {
      m.retaining_client = null;
      m.retaining_clients = [];
      allParties = additionalParties;
    }

    m.parties_data = sortPartiesByRole(allParties);

    m.custom_fields = customFields
      .filter(cf => cf.matter_id === m.id)
      .map(cf => ({
        field_id: cf.field_definition_id,
        name: cf.field_definition?.name || 'Unknown Field',
        type: cf.field_definition?.type || 'text',
        value: cf.value,
      }))
    return m;
  });

  if (query.role || query.party_role) {
    const filterRole = (query.role || query.party_role).trim().toLowerCase();
    resultMatters = resultMatters.filter(m =>
      m.parties_data?.some(p =>
        (p.party_roles || [p.primary_party_role || p.party_role]).some(r => r?.toLowerCase() === filterRole)
      )
    );
  }

  return resultMatters;
};

const maskGovId = (val) => {
  if (!val || typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (trimmed.length === 0) return val;
  if (trimmed.length <= 4) return `••••${trimmed}`;
  const visible = trimmed.slice(-4);
  return `••••-••••-${visible}`;
};

const getById = async (id, user, query = {}) => {
  const matter = await prisma.matter.findUnique({
    where: { id: parseInt(id) },
    include: {
      client: true,
      parties: { select: { id: true, full_name: true, user_id: true } },
      assigned_lawyer: { select: { id: true, full_name: true, email: true } },
      created_by: { select: { id: true, full_name: true } },
      documents: {
        include: {
          uploader: { select: { id: true, full_name: true } },
        },
      },
      drafts: {
        orderBy: { updated_at: 'desc' },
      },
      communications: {
        orderBy: { created_at: 'desc' },
        take: 50,
        include: {
          sender: { select: { id: true, full_name: true, role: true } },
        },
      },
      status_history: {
        orderBy: { created_at: 'desc' },
        take: 20,
      },
      invoices: {
        include: { payments: true }
      },
      time_entries: true,
      expenses: true,
      activities: {
        orderBy: { created_at: 'desc' },
        take: 20,
        include: {
          actor: { select: { id: true, full_name: true } },
        },
      },
      tasks: {
        include: {
          assigned_user: { select: { id: true, full_name: true, role: true } },
        },
        orderBy: [
          { status: 'asc' },
          { due_date: 'asc' }
        ]
      },
    }
  });
  if (!matter) return null;
  if (!canAccessMatter(matter, user)) {
    const err = new Error('Not authorized to access this matter');
    err.statusCode = 403;
    throw err;
  }

  // Sensitive Data Response Protection: Mask Government ID in standard responses
  const isEditMode = query?.mode === 'edit' && (user?.role === 'admin' || user?.role === 'lawyer');
  if (!isEditMode) {
    if (matter.client && matter.client.government_id) {
      matter.client.government_id = maskGovId(matter.client.government_id);
    }
    if (matter.parties_data) {
      const rawP = typeof matter.parties_data === 'string' ? JSON.parse(matter.parties_data) : matter.parties_data;
      if (Array.isArray(rawP)) {
        matter.parties_data = rawP.map(p => p.government_id ? { ...p, government_id: maskGovId(p.government_id) } : p);
      }
    }
  }

  // Synthesize Virtual Retaining Client Party Entry (Zero DB duplication)
  let additionalParties = [];
  if (matter.parties_data) {
    const rawP = typeof matter.parties_data === 'string' ? JSON.parse(matter.parties_data) : matter.parties_data;
    if (Array.isArray(rawP)) {
      additionalParties = rawP.filter(p => !p.is_retaining_client && p.party_role !== 'Retaining Client');
    }
  }

  // Synthesize legacy opposing_party_name if missing from parties_data
  if (matter.opposing_party_name && matter.opposing_party_name.trim()) {
    const oppName = matter.opposing_party_name.trim();
    const exists = additionalParties.some(p => p.full_name?.toLowerCase() === oppName.toLowerCase());
    if (!exists) {
      additionalParties.push({
        id: `opp_${matter.id}`,
        full_name: oppName,
        party_role: 'Opposing Party',
        party_type: 'Person',
        source: 'legacy_opposing_party'
      });
    }
  }

  let allParties = [];
  if (matter.client) {
    const virtualRetainingClientParty = {
      id: `client_${matter.client.id}`,
      client_id: matter.client.id,
      full_name: matter.client.full_name,
      email: matter.client.email || '',
      phone: matter.client.phone || '',
      address: matter.client.home_address || matter.client.address_line_1 || '',
      party_type: matter.client.party_type || 'Individual',
      party_role: 'Client',
      is_retaining_client: true,
      source: 'client_id'
    };
    matter.retaining_client = matter.client;
    matter.retaining_clients = matter.client ? [matter.client] : [];
    allParties = [virtualRetainingClientParty, ...additionalParties];
  } else {
    matter.retaining_client = null;
    matter.retaining_clients = [];
    allParties = additionalParties;
  }

  matter.parties_data = sortPartiesByRole(allParties);

  // Fetch custom fields
  const customFields = await prisma.matterCustomFieldValue.findMany({
    where: { matter_id: parseInt(id) },
    include: { field_definition: true }
  });
  const originalFields = ['Settlement Goal', 'Settlement Goall', 'Statute of Limitations', 'Court Jurisdiction'];
  matter.custom_fields = customFields
    .map(cf => ({
      field_id: cf.field_definition_id,
      name: cf.field_definition?.name || 'Unknown Field',
      type: cf.field_definition?.type || 'text',
      value: cf.value,
    }))
    .filter(cf => originalFields.includes(cf.name));

  // Standardize invoices
  if (matter.invoices) {
    matter.invoices = matter.invoices.map(billingService.calculateInvoiceFields);
  }

  if (user?.role === 'client') {
    matter.documents = (matter.documents || []).filter((d) =>
      d.visibility === 'client_shared' || d.visibility === 'client_visible',
    );
    matter.communications = (matter.communications || []).filter((c) =>
      c.visibility === 'client_visible' || c.visibility === 'client_shared',
    );
    matter.drafts = (matter.drafts || []).filter((d) =>
      d.status === 'sent_for_signature' || d.status === 'signed',
    );
  }
  return matter;
};

const create = async (data, user) => {
  if (user?.role === 'client') {
    const err = new Error('Client cannot create matters');
    err.statusCode = 403;
    throw err;
  }
  if (user?.role === 'lawyer') {
    if (!data.assigned_lawyer_id || Number(data.assigned_lawyer_id) !== user.id) {
      const err = new Error('Lawyer can only create matters assigned to self');
      err.statusCode = 403;
      throw err;
    }
    data.created_by_user_id = user.id;
  }

  const {
    custom_fields, clientIds, clientId, client_id, inlineParties, parties_data, vehicles_data, intake_answers,
    retaining_client_name, retaining_client_email, retaining_client_phone, retaining_client_address, retaining_client_dob, retaining_client_gov_id,
    fee_type, hourly_rate, contingency_rate, retainer_amount, lead_source, referral_source, existing_client_select, selected_client_id,
    ...payload
  } = data;

  if (parties_data) {
    const rawParties = typeof parties_data === 'string' ? JSON.parse(parties_data) : parties_data;
    // Sanitize: Do not store virtual/duplicate Retaining Client inside parties_data
    payload.parties_data = Array.isArray(rawParties)
      ? rawParties.filter(p => !p.is_retaining_client && p.party_role !== 'Retaining Client')
      : rawParties;
    if (Array.isArray(payload.parties_data)) {
      const opp = payload.parties_data.find(p => p.party_role === 'Opposing Party');
      if (opp && opp.full_name) {
        payload.opposing_party_name = opp.full_name;
      }
    }
  }
  if (vehicles_data) {
    payload.vehicles_data = typeof vehicles_data === 'string' ? JSON.parse(vehicles_data) : vehicles_data;
  }
  if (intake_answers) {
    payload.intake_answers = typeof intake_answers === 'string' ? JSON.parse(intake_answers) : intake_answers;
  }
  if (typeof payload.intake_answers !== 'object' || payload.intake_answers === null) {
    payload.intake_answers = {};
  }
  if (!payload.intake_answers.current_stage) {
    payload.intake_answers.current_stage = 'Intake';
  }
  if (lead_source || data.referral_source) {
    payload.intake_answers.referral_source = lead_source || data.referral_source;
  }
  if (fee_type || data.fee_type) {
    payload.intake_answers.fee_type = fee_type || data.fee_type;
  }

  // Referral Channel & CRPC 1.5.1 Compliance attributes
  if (data.referral_contact_id !== undefined) payload.intake_answers.referral_contact_id = data.referral_contact_id;
  if (data.referral_contact_name !== undefined) payload.intake_answers.referral_contact_name = data.referral_contact_name;
  if (data.referral_category !== undefined) payload.intake_answers.referral_category = data.referral_category;
  if (data.referral_agreement_on_file !== undefined) payload.intake_answers.referral_agreement_on_file = !!data.referral_agreement_on_file;
  if (data.referral_agreement_doc_url !== undefined) payload.intake_answers.referral_agreement_doc_url = data.referral_agreement_doc_url;
  if (data.referral_fee_type !== undefined) payload.intake_answers.referral_fee_type = data.referral_fee_type;
  if (data.referral_fee_value !== undefined) payload.intake_answers.referral_fee_value = data.referral_fee_value;
  if (data.crpc_151_consent_obtained !== undefined) payload.intake_answers.crpc_151_consent_obtained = !!data.crpc_151_consent_obtained;
  if (data.crpc_151_consent_date !== undefined) payload.intake_answers.crpc_151_consent_date = data.crpc_151_consent_date;
  if (data.crpc_151_doc_url !== undefined) payload.intake_answers.crpc_151_doc_url = data.crpc_151_doc_url;
  if (data.crpc_151_disclosure_details !== undefined) payload.intake_answers.crpc_151_disclosure_details = data.crpc_151_disclosure_details;
  if (data.referral_payouts !== undefined) payload.intake_answers.referral_payouts = data.referral_payouts;

  let primaryClientId = null;

  // 1. Validate explicit clientId / client_id or first ID in clientIds array
  const firstClientId = (clientIds && Array.isArray(clientIds) && clientIds.length > 0) ? clientIds[0] : null;
  const targetClientId = parseInt(clientId || client_id || firstClientId, 10);
  if (Number.isFinite(targetClientId) && targetClientId > 0) {
    const existingClient = await prisma.client.findUnique({ where: { id: targetClientId } });
    if (existingClient) {
      primaryClientId = existingClient.id;
    }
  }

  // 2. Find or create retaining client if explicit clientId not passed
  const inlineRetainingParty = (inlineParties && Array.isArray(inlineParties))
    ? inlineParties.find(p => p.party_role === 'Retaining Client' || (p.full_name === retaining_client_name && p.email === retaining_client_email))
    : null;

  const rName = (retaining_client_name || inlineRetainingParty?.full_name || '').trim();
  const rawEmail = (retaining_client_email || inlineRetainingParty?.email || '').trim();
  const rEmail = rawEmail || (rName ? `client_${Date.now()}@firm.local` : '');

  if (!primaryClientId && rName) {
    const rPhone = retaining_client_phone || inlineRetainingParty?.phone || null;
    const rGovId = retaining_client_gov_id || inlineRetainingParty?.government_id || null;

    if (!payload.bypass_duplicate) {
      const dup = await findDuplicateContact({ phone: rPhone, email: rawEmail, government_id: rGovId });
      if (dup) {
        const err = new Error(dup.message);
        err.statusCode = 409;
        err.duplicate = true;
        err.contact = dup.contact;
        err.matchedField = dup.matchedField;
        throw err;
      }
    }

    let existingClient = rawEmail ? await prisma.client.findFirst({ where: { email: rawEmail } }) : null;
    if (!existingClient) {
      existingClient = await prisma.client.findFirst({ where: { full_name: rName } });
    }
    if (existingClient) {
      primaryClientId = existingClient.id;
    } else {
      let targetUser = rEmail ? await prisma.user.findUnique({ where: { email: rEmail } }) : null;
      if (!targetUser) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('1234', salt);
        targetUser = await prisma.user.create({
          data: {
            email: rEmail,
            full_name: rName,
            password_hash,
            role: 'client',
            must_reset_password: true,
          }
        });
      }
      existingClient = await prisma.client.findFirst({ where: { user_id: targetUser.id } });
      if (existingClient) {
        primaryClientId = existingClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: {
            full_name: rName,
            email: rEmail,
            phone: retaining_client_phone || inlineRetainingParty?.phone || null,
            home_address: retaining_client_address || inlineRetainingParty?.home_address || null,
            date_of_birth: (retaining_client_dob || inlineRetainingParty?.date_of_birth) ? new Date(retaining_client_dob || inlineRetainingParty?.date_of_birth) : null,
            government_id: retaining_client_gov_id || inlineRetainingParty?.government_id || null,
            party_type: 'Individual',
            party_role: 'Retaining Client',
            user_id: targetUser.id,
          }
        });
        primaryClientId = newClient.id;
      }
    }
  }

  // 3. Fallback: if still no primaryClientId, pick any valid client ID from clientIds
  if (!primaryClientId && clientIds && Array.isArray(clientIds) && clientIds.length > 0) {
    const fallbackId = parseInt(clientIds[0], 10);
    if (Number.isFinite(fallbackId) && fallbackId > 0) {
      primaryClientId = fallbackId;
    }
  }

  // 4. Strict Primary Retaining Client Enforcement: Require valid primaryClientId
  if (!primaryClientId) {
    const err = new Error('A valid Primary Retaining Client is required to create a matter.');
    err.statusCode = 400;
    throw err;
  }

  payload.client_id = primaryClientId;

  // Process additional associated parties (clientIds & non-retaining inlineParties)
  let additionalPartyIds = [primaryClientId];
  if (clientIds && Array.isArray(clientIds)) {
    const parsed = clientIds.map(id => parseInt(id, 10)).filter(id => Number.isFinite(id));
    additionalPartyIds = [...new Set([...additionalPartyIds, ...parsed])];
  }

  if (inlineParties && Array.isArray(inlineParties)) {
    const nonRetainingInline = inlineParties.filter(p => p !== inlineRetainingParty && p.party_role !== 'Retaining Client' && p.party_role !== 'Client');
    for (const party of nonRetainingInline) {
      if (!party.full_name || !party.email) continue;
      let existingClient = await prisma.client.findFirst({ where: { email: party.email } });
      if (existingClient) {
        additionalPartyIds.push(existingClient.id);
        continue;
      }
      let targetUser = await prisma.user.findUnique({ where: { email: party.email } });
      if (!targetUser) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('1234', salt);
        targetUser = await prisma.user.create({
          data: {
            email: party.email,
            full_name: party.full_name,
            password_hash,
            role: 'client',
            must_reset_password: true,
          }
        });
      }
      existingClient = await prisma.client.findFirst({ where: { user_id: targetUser.id } });
      if (existingClient) {
        additionalPartyIds.push(existingClient.id);
      } else {
        const newClient = await prisma.client.create({
          data: {
            full_name: party.full_name,
            email: party.email,
            phone: party.phone || null,
            home_address: party.home_address || null,
            date_of_birth: party.date_of_birth ? new Date(party.date_of_birth) : null,
            government_id: party.government_id || null,
            insurance_number: party.insurance_number || null,
            notes: party.notes || null,
            party_type: party.party_type || 'Individual',
            party_role: party.party_role || 'Party',
            user_id: targetUser.id,
          }
        });
        additionalPartyIds.push(newClient.id);
      }
    }
  }

  payload.parties = {
    connect: [...new Set(additionalPartyIds)].map(id => ({ id }))
  };

  if (!payload.matter_number) {
    payload.matter_number = await nextMatterNumber(payload.practice_area);
  }

  if (payload.initial_filing_date) payload.initial_filing_date = new Date(payload.initial_filing_date);
  if (payload.date_of_loss) payload.date_of_loss = new Date(payload.date_of_loss);
  if (payload.trial_date) payload.trial_date = new Date(payload.trial_date);
  if (payload.next_hearing) payload.next_hearing = new Date(payload.next_hearing);

  if (payload.date_of_loss) {
    if (payload.sol_term === '1_year') {
      const d = new Date(payload.date_of_loss);
      d.setFullYear(d.getFullYear() + 1);
      payload.sol_date = d;
    } else if (payload.sol_term === '2_years') {
      const d = new Date(payload.date_of_loss);
      d.setFullYear(d.getFullYear() + 2);
      payload.sol_date = d;
    } else if (payload.sol_term === 'custom' && payload.sol_date) {
      payload.sol_date = new Date(payload.sol_date);
    } else {
      payload.sol_date = null;
    }
  } else {
    payload.sol_date = null;
  }

  const matter = await prisma.matter.create({ data: payload });

  // Sync to calendar
  try {
    const calendarService = require('../calendar/calendar.service');
    await calendarService.syncMatterDates(matter, data.created_by_user_id);
  } catch (e) {
    console.error('Failed to sync matter dates to calendar', e);
  }

  // Log activity
  await prisma.activity.create({
    data: {
      matter_id: matter.id,
      entity_type: 'matter',
      entity_id: matter.id,
      action: 'created',
      description: `Matter ${matter.matter_number} created: ${matter.title}`,
      actor_user_id: data.created_by_user_id
    }
  });

  // Save custom fields
  if (custom_fields && Array.isArray(custom_fields)) {
    for (const cf of custom_fields) {
      if (cf.field_id !== undefined && cf.value !== undefined) {
        await prisma.matterCustomFieldValue.create({
          data: {
            matter_id: matter.id,
            field_definition_id: parseInt(cf.field_id),
            value: String(cf.value),
          }
        });
      }
    }
  }

  return getById(matter.id, user);
};

const update = async (id, data, user) => {
  const idInt = parseInt(id, 10);
  const existing = await prisma.matter.findUnique({ where: { id: idInt } });
  if (!existing) {
    const err = new Error('Matter not found');
    err.statusCode = 404;
    throw err;
  }
  if (!canAccessMatter(existing, user)) {
    const err = new Error('Not authorized to update this matter');
    err.statusCode = 403;
    throw err;
  }
  if (user?.role === 'client') {
    const err = new Error('Client cannot update matters');
    err.statusCode = 403;
    throw err;
  }
  if (user?.role === 'lawyer') {
    delete data.client_id;
    delete data.assigned_lawyer_id;
    delete data.created_by_user_id;
  }

  const {
    updated_by_user_id, custom_fields, parties_data, vehicles_data, intake_answers,
    retaining_client_name, retaining_client_email, retaining_client_phone, retaining_client_address, retaining_client_dob, retaining_client_gov_id,
    fee_type, hourly_rate, contingency_rate, retainer_amount, lead_source, existing_client_select, selected_client_id,
    ...prismaData
  } = data;
  if (parties_data !== undefined) {
    const rawParties = typeof parties_data === 'string' ? JSON.parse(parties_data) : parties_data;
    let existingParties = [];
    if (existing.parties_data) {
      existingParties = typeof existing.parties_data === 'string' ? JSON.parse(existing.parties_data) : existing.parties_data;
    }

    prismaData.parties_data = Array.isArray(rawParties)
      ? rawParties
        .filter(p => !p.is_retaining_client && p.party_role !== 'Retaining Client')
        .map(p => {
          if (p.government_id && typeof p.government_id === 'string' && p.government_id.includes('••••')) {
            const orig = existingParties.find(ep => ep.full_name === p.full_name || ep.id === p.id);
            if (orig && orig.government_id) {
              return { ...p, government_id: orig.government_id };
            }
          }
          return p;
        })
      : rawParties;
    if (Array.isArray(prismaData.parties_data)) {
      const opp = prismaData.parties_data.find(p => p.party_role === 'Opposing Party');
      if (opp && opp.full_name) {
        prismaData.opposing_party_name = opp.full_name;
      }
    }
  }
  if (vehicles_data !== undefined) {
    prismaData.vehicles_data = typeof vehicles_data === 'string' ? JSON.parse(vehicles_data) : vehicles_data;
  }
  let mergedIntake = {};
  if (existing.intake_answers) {
    mergedIntake = typeof existing.intake_answers === 'string' ? JSON.parse(existing.intake_answers) : existing.intake_answers;
  }
  if (intake_answers !== undefined) {
    const passedIntake = typeof intake_answers === 'string' ? JSON.parse(intake_answers) : intake_answers;
    mergedIntake = { ...mergedIntake, ...passedIntake };
  }

  if (data.referral_source !== undefined) mergedIntake.referral_source = data.referral_source;
  if (data.referral_contact_id !== undefined) mergedIntake.referral_contact_id = data.referral_contact_id;
  if (data.referral_contact_name !== undefined) mergedIntake.referral_contact_name = data.referral_contact_name;
  if (data.referral_category !== undefined) mergedIntake.referral_category = data.referral_category;
  if (data.referral_agreement_on_file !== undefined) mergedIntake.referral_agreement_on_file = !!data.referral_agreement_on_file;
  if (data.referral_agreement_doc_url !== undefined) mergedIntake.referral_agreement_doc_url = data.referral_agreement_doc_url;
  if (data.referral_fee_type !== undefined) mergedIntake.referral_fee_type = data.referral_fee_type;
  if (data.referral_fee_value !== undefined) mergedIntake.referral_fee_value = data.referral_fee_value;
  if (data.crpc_151_consent_obtained !== undefined) mergedIntake.crpc_151_consent_obtained = !!data.crpc_151_consent_obtained;
  if (data.crpc_151_consent_date !== undefined) mergedIntake.crpc_151_consent_date = data.crpc_151_consent_date;
  if (data.crpc_151_doc_url !== undefined) mergedIntake.crpc_151_doc_url = data.crpc_151_doc_url;
  if (data.crpc_151_disclosure_details !== undefined) mergedIntake.crpc_151_disclosure_details = data.crpc_151_disclosure_details;
  if (data.referral_payouts !== undefined) mergedIntake.referral_payouts = data.referral_payouts;

  prismaData.intake_answers = mergedIntake;
  if (prismaData.next_hearing) {
    prismaData.next_hearing = new Date(prismaData.next_hearing);
  }
  if (prismaData.initial_filing_date) {
    prismaData.initial_filing_date = new Date(prismaData.initial_filing_date);
  }
  if (prismaData.date_of_loss) {
    prismaData.date_of_loss = new Date(prismaData.date_of_loss);
  }
  if (prismaData.trial_date) {
    prismaData.trial_date = new Date(prismaData.trial_date);
  }

  const finalDateOfLoss = prismaData.date_of_loss !== undefined ? prismaData.date_of_loss : existing.date_of_loss;
  const finalSolTerm = prismaData.sol_term !== undefined ? prismaData.sol_term : existing.sol_term;

  if (finalDateOfLoss) {
    if (finalSolTerm === '1_year') {
      const d = new Date(finalDateOfLoss);
      d.setFullYear(d.getFullYear() + 1);
      prismaData.sol_date = d;
    } else if (finalSolTerm === '2_years') {
      const d = new Date(finalDateOfLoss);
      d.setFullYear(d.getFullYear() + 2);
      prismaData.sol_date = d;
    } else if (finalSolTerm === 'custom') {
      if (prismaData.sol_date !== undefined) {
        prismaData.sol_date = prismaData.sol_date ? new Date(prismaData.sol_date) : null;
      }
    } else {
      prismaData.sol_date = null;
    }
  } else {
    prismaData.sol_date = null;
  }

  if (existing.client_id && (retaining_client_name || retaining_client_email || retaining_client_phone || retaining_client_address || retaining_client_dob || retaining_client_gov_id)) {
    const clientData = {};
    if (retaining_client_name) clientData.full_name = retaining_client_name.trim();
    if (retaining_client_email) clientData.email = retaining_client_email.trim();
    if (retaining_client_phone) clientData.phone = retaining_client_phone.trim();
    if (retaining_client_address) clientData.home_address = retaining_client_address.trim();
    if (retaining_client_dob) clientData.date_of_birth = new Date(retaining_client_dob);
    if (retaining_client_gov_id) clientData.government_id = retaining_client_gov_id.trim();
    
    await prisma.client.update({
      where: { id: existing.client_id },
      data: clientData
    });
  }
  const matter = await prisma.matter.update({
    where: { id: idInt },
    data: prismaData,
  });

  // Sync to calendar
  try {
    const calendarService = require('../calendar/calendar.service');
    await calendarService.syncMatterDates(matter, updated_by_user_id ?? existing.created_by_user_id);
  } catch (e) {
    console.error('Failed to sync matter dates to calendar on update', e);
  }

  if (matter.status !== existing.status) {
    const actorId = updated_by_user_id ?? existing.created_by_user_id;

    await prisma.activity.create({
      data: {
        matter_id: matter.id,
        entity_type: 'matter',
        entity_id: matter.id,
        action: 'status_updated',
        description: `Matter status changed to ${matter.status}`,
        actor_user_id: actorId,
      },
    });

    await prisma.matterStatusHistory.create({
      data: {
        matter_id: matter.id,
        old_status: existing.status,
        new_status: matter.status,
        changed_by_user_id: actorId,
        portal_visible: true, // Default to true when stage is updated
      },
    });

    // Test 24: Automated client notification trigger on stage change
    try {
      const clientsToNotify = await prisma.client.findMany({
        where: {
          OR: [
            { id: matter.client_id },
            { matter_parties: { some: { id: matter.id } } }
          ],
          user_id: { not: null }
        },
        select: { user_id: true }
      });

      const notificationsService = require('../notifications/notifications.service');
      for (const c of clientsToNotify) {
        if (c.user_id) {
          await notificationsService.createNotification({
            user_id: c.user_id,
            title: `Case Progress Update: ${matter.matter_number}`,
            message: `Your matter stage has advanced to "${data.status}". Check your portal for attorney guidance.`,
            type: 'matter',
            reference_id: matter.id
          });
        }
      }
    } catch (e) {
      console.error('Failed to send status update notification to client', e);
    }
  }

  // Update custom fields
  if (custom_fields && Array.isArray(custom_fields)) {
    for (const cf of custom_fields) {
      if (cf.field_id !== undefined && cf.value !== undefined) {
        await prisma.matterCustomFieldValue.upsert({
          where: {
            matter_id_field_definition_id: {
              matter_id: matter.id,
              field_definition_id: parseInt(cf.field_id)
            }
          },
          update: { value: String(cf.value) },
          create: {
            matter_id: matter.id,
            field_definition_id: parseInt(cf.field_id),
            value: String(cf.value)
          }
        });
      }
    }
  }

  return getById(matter.id, user);
};

const remove = async (id, user) => {
  const role = (user?.role || '').toLowerCase();
  const email = (user?.email || '').toLowerCase();
  const isAuth = role === 'admin' || email.includes('kathleen');
  if (!isAuth) {
    const err = new Error('Forbidden: Only Firm Owner/Admin or Kathleen are authorized to hard-delete records.');
    err.statusCode = 403;
    throw err;
  }
  const matterId = parseInt(id, 10);
  await prisma.$transaction([
    prisma.matterStatusHistory.deleteMany({ where: { matter_id: matterId } }),
    prisma.document.deleteMany({ where: { matter_id: matterId } }),
    prisma.communication.deleteMany({ where: { matter_id: matterId } }),
    prisma.invoice.deleteMany({ where: { matter_id: matterId } }),
    prisma.draft.deleteMany({ where: { matter_id: matterId } }),
    prisma.activity.deleteMany({ where: { matter_id: matterId } }),
    prisma.timeEntry.deleteMany({ where: { matter_id: matterId } }),
    prisma.calendarEvent.deleteMany({ where: { matter_id: matterId } }),
    prisma.folder.deleteMany({ where: { matter_id: matterId } }),
    prisma.trustTransaction.deleteMany({ where: { matter_id: matterId } }),
    prisma.task.deleteMany({ where: { matter_id: matterId } }),
    prisma.matterCustomFieldValue.deleteMany({ where: { matter_id: matterId } }),
    prisma.matter.delete({ where: { id: matterId } })
  ]);
  return { success: true };
};

const getMatterParties = async (id, query, user) => {
  const matter = await getById(id, user);
  let parties = matter.parties_data || [];

  const { search, role, primary_role, party_type, group, sort = 'name', page = 1, pageSize = 20 } = query;

  // Compute live group counts
  const counts = {
    total: parties.length,
    retaining_client: parties.filter(p => p.is_retaining_client || p.party_role === 'Retaining Client').length,
    witnesses: parties.filter(p => (p.party_roles || [p.party_role]).includes('Witness')).length,
    drivers: parties.filter(p => (p.party_roles || [p.party_role]).includes('Driver')).length,
    insurance: parties.filter(p => (p.party_roles || [p.party_role]).some(r => ['Insurance Company', 'Insurance Adjuster'].includes(r))).length,
    medical: parties.filter(p => (p.party_roles || [p.party_role]).includes('Medical Provider')).length,
    organizations: parties.filter(p => p.party_type === 'Organization' || (p.party_roles || [p.party_role]).includes('Employer')).length,
    other: parties.filter(p => !p.is_retaining_client && !(p.party_roles || [p.party_role]).some(r => ['Witness', 'Driver', 'Insurance Company', 'Medical Provider', 'Employer'].includes(r))).length
  };

  // Search filter
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    parties = parties.filter(p =>
      p.full_name?.toLowerCase().includes(term) ||
      p.company_name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.phone?.toLowerCase().includes(term) ||
      p.government_id?.toLowerCase().includes(term) ||
      p.insurance_number?.toLowerCase().includes(term) ||
      p.passport_number?.toLowerCase().includes(term) ||
      p.alien_number?.toLowerCase().includes(term) ||
      (p.party_roles || [p.party_role]).some(r => r?.toLowerCase().includes(term))
    );
  }

  // Role filter
  if (role) {
    const roleTerm = role.trim().toLowerCase();
    parties = parties.filter(p => (p.party_roles || [p.party_role]).some(r => r?.toLowerCase() === roleTerm));
  }

  // Primary Role filter
  if (primary_role) {
    const pRoleTerm = primary_role.trim().toLowerCase();
    parties = parties.filter(p => (p.primary_party_role || p.party_role)?.toLowerCase() === pRoleTerm);
  }

  // Party Type filter
  if (party_type) {
    parties = parties.filter(p => p.party_type?.toLowerCase() === party_type.trim().toLowerCase());
  }

  // Group filter
  if (group) {
    if (group === 'witnesses') parties = parties.filter(p => (p.party_roles || [p.party_role]).includes('Witness'));
    else if (group === 'drivers') parties = parties.filter(p => (p.party_roles || [p.party_role]).includes('Driver'));
    else if (group === 'insurance') parties = parties.filter(p => (p.party_roles || [p.party_role]).some(r => ['Insurance Company', 'Insurance Adjuster'].includes(r)));
    else if (group === 'medical') parties = parties.filter(p => (p.party_roles || [p.party_role]).includes('Medical Provider'));
    else if (group === 'organizations') parties = parties.filter(p => p.party_type === 'Organization' || (p.party_roles || [p.party_role]).includes('Employer'));
  }

  // Sorting
  if (sort === 'name') {
    parties.sort((a, b) => (a.full_name || a.company_name || '').localeCompare(b.full_name || b.company_name || ''));
  } else if (sort === 'primary_role') {
    parties.sort((a, b) => (a.primary_party_role || a.party_role || '').localeCompare(b.primary_party_role || b.party_role || ''));
  } else if (sort === 'role_count') {
    parties.sort((a, b) => (b.party_roles?.length || 1) - (a.party_roles?.length || 1));
  } else if (sort === 'recent') {
    parties.reverse();
  }

  // Pagination
  const pNum = Math.max(1, parseInt(page, 10) || 1);
  const pSize = Math.max(1, parseInt(pageSize, 10) || 20);
  const total = parties.length;
  const totalPages = Math.ceil(total / pSize);
  const paginatedParties = parties.slice((pNum - 1) * pSize, pNum * pSize);

  return {
    parties: paginatedParties,
    all_parties: matter.parties_data || [],
    total,
    page: pNum,
    pageSize: pSize,
    totalPages,
    counts
  };
};

const bulkDeleteParties = async (id, partyIds, user) => {
  if (!Array.isArray(partyIds) || partyIds.length === 0) {
    throw new Error('No party IDs provided for bulk delete');
  }
  const matter = await getById(id, user);
  const remaining = (matter.parties_data || []).filter(
    p => !partyIds.includes(p.id) && !p.is_retaining_client && p.party_role !== 'Retaining Client'
  );
  return update(id, { parties_data: remaining }, user);
};

const bulkUpdatePartyRoles = async (id, partyIds, newRoles, primaryRole, user) => {
  if (!Array.isArray(partyIds) || partyIds.length === 0) {
    throw new Error('No party IDs provided for bulk update');
  }
  const matter = await getById(id, user);
  const updatedParties = (matter.parties_data || []).map(p => {
    if (partyIds.includes(p.id) && !p.is_retaining_client && p.party_role !== 'Retaining Client') {
      const roles = Array.from(new Set([...(p.party_roles || [p.party_role]), ...newRoles]));
      return {
        ...p,
        party_roles: roles,
        primary_party_role: primaryRole || roles[0],
        party_role: primaryRole || roles[0]
      };
    }
    return p;
  });
  return update(id, { parties_data: updatedParties }, user);
};

const exportMatterParties = async (id, format = 'csv', user) => {
  const matter = await getById(id, user);
  const parties = matter.parties_data || [];

  if (format === 'json') {
    return parties;
  }

  // CSV Generation
  const headers = ['ID', 'Full Name', 'Company Name', 'Primary Role', 'Roles', 'Party Type', 'Email', 'Phone', 'Address', 'Govt ID / DL', 'Notes'];
  const rows = parties.map(p => [
    `"${p.id || ''}"`,
    `"${(p.full_name || '').replace(/"/g, '""')}"`,
    `"${(p.company_name || '').replace(/"/g, '""')}"`,
    `"${(p.primary_party_role || p.party_role || '').replace(/"/g, '""')}"`,
    `"${((p.party_roles || [p.party_role]).join('; ')).replace(/"/g, '""')}"`,
    `"${(p.party_type || 'Person').replace(/"/g, '""')}"`,
    `"${(p.email || '').replace(/"/g, '""')}"`,
    `"${(p.phone || '').replace(/"/g, '""')}"`,
    `"${(p.address || '').replace(/"/g, '""')}"`,
    `"${(p.government_id || '').replace(/"/g, '""')}"`,
    `"${(p.notes || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

const importMatterParties = async (id, importedParties, user) => {
  if (!Array.isArray(importedParties)) {
    throw new Error('Import data must be an array of party records');
  }
  const matter = await getById(id, user);
  const existing = matter.parties_data || [];

  const added = [];
  const skipped = [];

  for (const p of importedParties) {
    const name = (p.full_name || p.company_name || '').trim();
    if (!name) {
      skipped.push({ party: p, reason: 'Missing Name' });
      continue;
    }

    const isDuplicate = existing.some(
      ep => (ep.email && p.email && ep.email.trim().toLowerCase() === p.email.trim().toLowerCase()) ||
        (ep.full_name?.trim().toLowerCase() === name.toLowerCase())
    );

    if (isDuplicate) {
      skipped.push({ party: p, reason: 'Duplicate party name or email' });
      continue;
    }

    const roles = Array.isArray(p.party_roles) && p.party_roles.length > 0 ? p.party_roles : [p.party_role || 'Witness'];
    const cleanParty = {
      id: p.id || `party_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      full_name: name,
      company_name: p.party_type === 'Organization' ? name : (p.company_name || ''),
      party_type: p.party_type || 'Person',
      party_roles: roles,
      primary_party_role: p.primary_party_role || roles[0],
      party_role: p.primary_party_role || roles[0],
      email: (p.email || '').trim(),
      phone: (p.phone || '').trim(),
      address: (p.address || '').trim(),
      notes: (p.notes || '').trim()
    };

    existing.push(cleanParty);
    added.push(cleanParty);
  }

  await update(id, { parties_data: existing }, user);

  return {
    success: true,
    added_count: added.length,
    skipped_count: skipped.length,
    skipped_details: skipped
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getMatterParties,
  bulkDeleteParties,
  bulkUpdatePartyRoles,
  exportMatterParties,
  importMatterParties,
  getMatterVehicles,
  addMatterVehicle,
  updateMatterVehicle,
  deleteMatterVehicle,
  bulkDeleteVehicles,
  exportMatterVehicles,
  getMatterDrivers,
  updateDriverProfile,
  bulkUpdateDrivers,
  exportMatterDrivers,
  importMatterDrivers,
  getMatterPassengers,
  updatePassengerProfile,
  bulkUpdatePassengers,
  exportMatterPassengers,
  importMatterPassengers,
  getMatterWitnesses,
  updateWitnessProfile,
  bulkUpdateWitnesses,
  exportMatterWitnesses,
  importMatterWitnesses,
  getMatterInsurance,
  updateInsuranceProfile,
  bulkUpdateInsurance,
  exportMatterInsurance,
  importMatterInsurance,
  getMatterMedicalProviders,
  updateMedicalProviderProfile,
  bulkUpdateMedicalProviders,
  exportMatterMedicalProviders,
  importMatterMedicalProviders,
  getMatterEmployers,
  updateEmployerProfile,
  bulkUpdateEmployers,
  exportMatterEmployers,
  importMatterEmployers,
  getMatterPropertyDamage,
  updatePropertyDamageProfile,
  bulkUpdatePropertyDamage,
  exportMatterPropertyDamage,
  importMatterPropertyDamage,
  getMatterPolice,
  updatePoliceProfile,
  bulkUpdatePolice,
  exportMatterPolice,
  importMatterPolice,
  getMatterTimeline,
  addMatterTimelineEvent,
  updateMatterTimelineEvent,
  deleteMatterTimelineEvent,
};

// ============================================================
// ENTERPRISE VEHICLE MODULE — matters.service.js
// ============================================================

const VEHICLE_TYPES = ['Car', 'SUV', 'Truck', 'Motorcycle', 'Van', 'Bus', 'Commercial Vehicle', 'Trailer', 'Bicycle', 'Scooter', 'Other'];

function buildVehicleId() {
  return `veh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function normalizeVehicle(v) {
  const roles = Array.isArray(v.party_roles) ? v.party_roles : [v.party_role || 'Other'];
  return {
    vehicle_id: v.vehicle_id || v.id || buildVehicleId(),
    vehicle_type: v.vehicle_type || 'Car',
    year: v.year || '',
    make: (v.make || '').trim(),
    model: (v.model || '').trim(),
    color: v.color || '',
    vin: v.vin || '',
    license_plate: v.license_plate || '',
    license_state: v.license_state || '',
    registration_number: v.registration_number || '',
    insurance_company: v.insurance_company || '',
    policy_number: v.policy_number || '',
    claim_number: v.claim_number || '',
    owner_party_id: v.owner_party_id || null,
    driver_party_id: v.driver_party_id || null,
    passengers: Array.isArray(v.passengers) ? v.passengers : [],
    passenger_party_ids: Array.isArray(v.passenger_party_ids) ? v.passenger_party_ids : [],
    damage_description: v.damage_description || '',
    tow_information: v.tow_information || '',
    storage_location: v.storage_location || '',
    repair_shop: v.repair_shop || '',
    status: v.status || 'active',
    notes: v.notes || '',
    custom_fields: v.custom_fields || {},
    created_at: v.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function getMatterVehicles(id, query, user) {
  const matter = await getById(id, user);
  let vehicles = Array.isArray(matter.vehicles_data) ? matter.vehicles_data.map(normalizeVehicle) : [];

  const { search, vehicle_type, status, driver_party_id, owner_party_id, sort = 'year_desc', page = 1, pageSize = 50 } = query;

  // Live search
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    vehicles = vehicles.filter(v =>
      v.make?.toLowerCase().includes(term) ||
      v.model?.toLowerCase().includes(term) ||
      v.vin?.toLowerCase().includes(term) ||
      v.license_plate?.toLowerCase().includes(term) ||
      v.insurance_company?.toLowerCase().includes(term) ||
      v.policy_number?.toLowerCase().includes(term) ||
      v.claim_number?.toLowerCase().includes(term) ||
      v.color?.toLowerCase().includes(term) ||
      `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(term)
    );
  }

  if (vehicle_type) vehicles = vehicles.filter(v => v.vehicle_type === vehicle_type);
  if (status) vehicles = vehicles.filter(v => v.status === status);
  if (driver_party_id) vehicles = vehicles.filter(v => v.driver_party_id === driver_party_id);
  if (owner_party_id) vehicles = vehicles.filter(v => v.owner_party_id === owner_party_id);

  // Sorting
  if (sort === 'year_desc') vehicles.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
  else if (sort === 'year_asc') vehicles.sort((a, b) => (Number(a.year) || 0) - (Number(b.year) || 0));
  else if (sort === 'make') vehicles.sort((a, b) => (a.make || '').localeCompare(b.make || ''));
  else if (sort === 'model') vehicles.sort((a, b) => (a.model || '').localeCompare(b.model || ''));
  else if (sort === 'recent') vehicles.reverse();

  // Counts by type
  const counts = { total: vehicles.length };
  VEHICLE_TYPES.forEach(t => {
    const c = vehicles.filter(v => v.vehicle_type === t).length;
    if (c > 0) counts[t.toLowerCase().replace(/\s+/g, '_')] = c;
  });

  const pNum = Math.max(1, parseInt(page, 10) || 1);
  const pSize = Math.max(1, Math.min(parseInt(pageSize, 10) || 50, 500));
  const total = vehicles.length;
  const totalPages = Math.ceil(total / pSize);

  return {
    vehicles: vehicles.slice((pNum - 1) * pSize, pNum * pSize),
    total,
    page: pNum,
    pageSize: pSize,
    totalPages,
    counts,
    vehicle_types: VEHICLE_TYPES,
  };
}

async function addMatterVehicle(id, vehicleData, user) {
  if (!vehicleData.make || !vehicleData.model) throw Object.assign(new Error('Vehicle Make and Model are required'), { statusCode: 400 });

  const matter = await getById(id, user);
  const existing = Array.isArray(matter.vehicles_data) ? matter.vehicles_data : [];

  // Duplicate VIN check within matter
  if (vehicleData.vin && vehicleData.vin.trim()) {
    const vinDup = existing.find(v => v.vin && v.vin.trim().toUpperCase() === vehicleData.vin.trim().toUpperCase());
    if (vinDup) throw Object.assign(new Error(`Duplicate VIN: A vehicle with VIN "${vehicleData.vin}" already exists in this matter.`), { statusCode: 409 });
  }

  const newVehicle = normalizeVehicle({ ...vehicleData, vehicle_id: buildVehicleId() });
  const updatedVehicles = [...existing, newVehicle];

  await update(id, { vehicles_data: updatedVehicles }, user);

  // Activity log
  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'vehicle',
      entity_id: parseInt(id, 10),
      action: 'vehicle_added',
      description: `Vehicle added: ${newVehicle.year} ${newVehicle.make} ${newVehicle.model}${newVehicle.vin ? ` (VIN: ${newVehicle.vin})` : ''}`,
      actor_user_id: user?.id || null,
    }
  });

  return newVehicle;
}

async function updateMatterVehicle(id, vehicleId, vehicleData, user) {
  const matter = await getById(id, user);
  const existing = Array.isArray(matter.vehicles_data) ? matter.vehicles_data : [];
  const idx = existing.findIndex(v => (v.vehicle_id || v.id) === vehicleId);
  if (idx === -1) throw Object.assign(new Error('Vehicle not found'), { statusCode: 404 });

  // VIN duplicate check (excluding self)
  if (vehicleData.vin && vehicleData.vin.trim()) {
    const vinDup = existing.find((v, i) => i !== idx && v.vin && v.vin.trim().toUpperCase() === vehicleData.vin.trim().toUpperCase());
    if (vinDup) throw Object.assign(new Error(`Duplicate VIN: A vehicle with VIN "${vehicleData.vin}" already exists in this matter.`), { statusCode: 409 });
  }

  const updated = normalizeVehicle({ ...existing[idx], ...vehicleData, vehicle_id: vehicleId });
  existing[idx] = updated;
  await update(id, { vehicles_data: existing }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'vehicle',
      entity_id: parseInt(id, 10),
      action: 'vehicle_updated',
      description: `Vehicle updated: ${updated.year} ${updated.make} ${updated.model}`,
      actor_user_id: user?.id || null,
    }
  });

  return updated;
}

async function deleteMatterVehicle(id, vehicleId, user) {
  const matter = await getById(id, user);
  const existing = Array.isArray(matter.vehicles_data) ? matter.vehicles_data : [];
  const vehicle = existing.find(v => (v.vehicle_id || v.id) === vehicleId);
  if (!vehicle) throw Object.assign(new Error('Vehicle not found'), { statusCode: 404 });

  const remaining = existing.filter(v => (v.vehicle_id || v.id) !== vehicleId);
  await update(id, { vehicles_data: remaining }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'vehicle',
      entity_id: parseInt(id, 10),
      action: 'vehicle_deleted',
      description: `Vehicle deleted: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      actor_user_id: user?.id || null,
    }
  });

  return { success: true, deleted_vehicle_id: vehicleId };
}

async function bulkDeleteVehicles(id, vehicleIds, user) {
  if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) throw new Error('No vehicle IDs provided for bulk delete');
  const matter = await getById(id, user);
  const existing = Array.isArray(matter.vehicles_data) ? matter.vehicles_data : [];
  const remaining = existing.filter(v => !vehicleIds.includes(v.vehicle_id || v.id));
  await update(id, { vehicles_data: remaining }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'vehicle',
      entity_id: parseInt(id, 10),
      action: 'vehicles_bulk_deleted',
      description: `Bulk deleted ${vehicleIds.length} vehicles`,
      actor_user_id: user?.id || null,
    }
  });

  return { success: true, deleted_count: existing.length - remaining.length };
}

async function exportMatterVehicles(id, format = 'csv', user) {
  const matter = await getById(id, user);
  const vehicles = Array.isArray(matter.vehicles_data) ? matter.vehicles_data.map(normalizeVehicle) : [];

  if (format === 'json') return vehicles;

  const headers = ['Vehicle ID', 'Type', 'Year', 'Make', 'Model', 'Color', 'VIN', 'License Plate', 'State', 'Owner Party ID', 'Driver Party ID', 'Insurance Company', 'Policy #', 'Claim #', 'Status', 'Notes'];
  const rows = vehicles.map(v => [
    `"${v.vehicle_id || ''}"`, `"${v.vehicle_type || ''}"`, `"${v.year || ''}"`, `"${(v.make || '').replace(/"/g, '""')}"`,
    `"${(v.model || '').replace(/"/g, '""')}"`, `"${v.color || ''}"`, `"${v.vin || ''}"`, `"${v.license_plate || ''}"`,
    `"${v.license_state || ''}"`, `"${v.owner_party_id || ''}"`, `"${v.driver_party_id || ''}"`,
    `"${(v.insurance_company || '').replace(/"/g, '""')}"`, `"${v.policy_number || ''}"`, `"${v.claim_number || ''}"`,
    `"${v.status || ''}"`, `"${(v.notes || '').replace(/"/g, '""')}"`
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// ============================================================
// ENTERPRISE DRIVER MODULE — matters.service.js (Enhanced)
// ============================================================

function normalizeDriverProfile(p) {
  const driverProfile = p.role_data?.Driver || p.driver_profile || {};
  const licenseExpiry = driverProfile.license_expiry || p.license_expiry || '';
  const isExpired = Boolean(licenseExpiry && new Date(licenseExpiry) < new Date());

  return {
    license_number: driverProfile.license_number || p.license_number || '',
    license_state: driverProfile.license_state || p.license_state || '',
    license_class: driverProfile.license_class || p.license_class || '',
    license_expiry: licenseExpiry,
    is_expired: isExpired,
    date_of_birth: driverProfile.date_of_birth || p.date_of_birth || '',
    gender: driverProfile.gender || p.gender || '',
    phone: driverProfile.phone || p.phone || '',
    email: driverProfile.email || p.email || '',
    employer: driverProfile.employer || p.employer || '',
    years_experience: driverProfile.years_experience || p.years_experience || '',
    is_commercial_driver: Boolean(driverProfile.is_commercial_driver || p.is_commercial_driver),
    cdl_number: driverProfile.cdl_number || p.cdl_number || '',
    insurance_company: driverProfile.insurance_company || p.insurance_company || '',
    policy_number: driverProfile.policy_number || p.policy_number || '',
    seatbelt_used: driverProfile.seatbelt_used || p.seatbelt_used || 'Unknown',
    alcohol_test: driverProfile.alcohol_test || p.alcohol_test || 'Not Tested',
    drug_test: driverProfile.drug_test || p.drug_test || 'Not Tested',
    citation_issued: Boolean(driverProfile.citation_issued || p.citation_issued),
    citation_number: driverProfile.citation_number || p.citation_number || '',
    injury_status: driverProfile.injury_status || p.injury_status || 'Uninjured',
    hospital: driverProfile.hospital || p.hospital || '',
    medical_notes: driverProfile.medical_notes || p.medical_notes || '',
    assigned_vehicle_id: driverProfile.assigned_vehicle_id || p.assigned_vehicle_id || null,
    notes: driverProfile.notes || p.notes || ''
  };
}

async function getMatterDrivers(id, query, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  const vehicles = Array.isArray(matter.vehicles_data) ? matter.vehicles_data : [];

  let drivers = parties.filter(p => (p.party_roles || [p.party_role]).includes('Driver'));

  drivers = drivers.map(p => {
    const profile = normalizeDriverProfile(p);
    const linkedVehicle = vehicles.find(v => (v.vehicle_id || v.id) === profile.assigned_vehicle_id || v.driver_party_id === p.id);

    const roleData = {
      ...(p.role_data || {}),
      Driver: profile
    };

    return {
      party_id: p.id,
      full_name: p.full_name || p.company_name || '',
      email: p.email || '',
      phone: p.phone || '',
      party_type: p.party_type || 'Person',
      party_roles: p.party_roles || [p.party_role],
      role_data: roleData,
      driver_profile: profile,
      assigned_vehicle: linkedVehicle ? {
        vehicle_id: linkedVehicle.vehicle_id || linkedVehicle.id,
        year: linkedVehicle.year,
        make: linkedVehicle.make,
        model: linkedVehicle.model,
        license_plate: linkedVehicle.license_plate
      } : null
    };
  });

  const {
    search, license_state, is_commercial_driver, citation_issued,
    hospital, injury_status, vehicle_assigned, is_expired,
    sort = 'name', page = 1, pageSize = 50
  } = query;

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    drivers = drivers.filter(d => {
      const dp = d.role_data.Driver;
      const v = d.assigned_vehicle;
      return (
        d.full_name?.toLowerCase().includes(term) ||
        dp.license_number?.toLowerCase().includes(term) ||
        dp.employer?.toLowerCase().includes(term) ||
        dp.insurance_company?.toLowerCase().includes(term) ||
        dp.cdl_number?.toLowerCase().includes(term) ||
        dp.hospital?.toLowerCase().includes(term) ||
        dp.citation_number?.toLowerCase().includes(term) ||
        v?.make?.toLowerCase().includes(term) ||
        v?.model?.toLowerCase().includes(term) ||
        v?.license_plate?.toLowerCase().includes(term)
      );
    });
  }

  if (license_state) drivers = drivers.filter(d => d.role_data.Driver.license_state === license_state);
  if (is_commercial_driver !== undefined) drivers = drivers.filter(d => String(d.role_data.Driver.is_commercial_driver) === String(is_commercial_driver));
  if (citation_issued !== undefined) drivers = drivers.filter(d => String(d.role_data.Driver.citation_issued) === String(citation_issued));
  if (hospital) drivers = drivers.filter(d => d.role_data.Driver.hospital?.toLowerCase().includes(hospital.toLowerCase()));
  if (injury_status) drivers = drivers.filter(d => d.role_data.Driver.injury_status === injury_status);
  if (vehicle_assigned !== undefined) {
    const wantAssigned = String(vehicle_assigned) === 'true';
    drivers = drivers.filter(d => wantAssigned ? Boolean(d.assigned_vehicle) : !d.assigned_vehicle);
  }
  if (is_expired !== undefined) {
    const wantExpired = String(is_expired) === 'true';
    drivers = drivers.filter(d => d.role_data.Driver.is_expired === wantExpired);
  }

  if (sort === 'name') drivers.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  else if (sort === 'license_expiry') drivers.sort((a, b) => (a.role_data.Driver.license_expiry || '').localeCompare(b.role_data.Driver.license_expiry || ''));
  else if (sort === 'years_experience') drivers.sort((a, b) => (Number(b.role_data.Driver.years_experience) || 0) - (Number(a.role_data.Driver.years_experience) || 0));
  else if (sort === 'recent') drivers.reverse();

  const rawDrivers = parties.filter(p => (p.party_roles || [p.party_role]).includes('Driver'));
  const counts = {
    total_drivers: rawDrivers.length,
    commercial_drivers: rawDrivers.filter(p => (p.role_data?.Driver || p.driver_profile || {}).is_commercial_driver).length,
    drivers_with_citation: rawDrivers.filter(p => (p.role_data?.Driver || p.driver_profile || {}).citation_issued).length,
    drivers_injured: rawDrivers.filter(p => {
      const st = (p.role_data?.Driver || p.driver_profile || {}).injury_status;
      return st && st !== 'Uninjured';
    }).length,
    unassigned_drivers: rawDrivers.filter(p => {
      const dp = p.role_data?.Driver || p.driver_profile || {};
      const linkedVeh = vehicles.find(v => (v.vehicle_id || v.id) === dp.assigned_vehicle_id || v.driver_party_id === p.id);
      return !linkedVeh;
    }).length
  };

  const pNum = Math.max(1, parseInt(page, 10) || 1);
  const pSize = Math.max(1, Math.min(parseInt(pageSize, 10) || 50, 1000));
  const total = drivers.length;
  const totalPages = Math.ceil(total / pSize);

  return {
    drivers: drivers.slice((pNum - 1) * pSize, pNum * pSize),
    total,
    page: pNum,
    pageSize: pSize,
    totalPages,
    counts
  };
}

async function updateDriverProfile(id, partyId, profileData, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];
  const vehicles = Array.isArray(matter.vehicles_data) ? [...matter.vehicles_data] : [];

  const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
  if (idx === -1) throw Object.assign(new Error('Driver party not found'), { statusCode: 404 });

  const party = parties[idx];
  const roles = party.party_roles || [party.party_role];
  if (!roles.includes('Driver')) {
    throw Object.assign(new Error('Party does not have Driver role'), { statusCode: 400 });
  }

  const newLicNo = profileData.license_number !== undefined ? profileData.license_number?.trim().toUpperCase() : (party.role_data?.Driver?.license_number || '');
  if (!newLicNo) {
    throw Object.assign(new Error('Driver License Number is required.'), { statusCode: 400 });
  }

  const isCommercial = profileData.is_commercial_driver !== undefined ? Boolean(profileData.is_commercial_driver) : Boolean(party.role_data?.Driver?.is_commercial_driver);
  const cdlNo = profileData.cdl_number !== undefined ? profileData.cdl_number?.trim() : (party.role_data?.Driver?.cdl_number || '');
  if (isCommercial && !cdlNo) {
    throw Object.assign(new Error('CDL Number is required for Commercial Drivers.'), { statusCode: 400 });
  }

  const duplicate = parties.find(p =>
    (p.id !== partyId && p.id !== String(partyId)) &&
    (p.party_roles || [p.party_role]).includes('Driver') &&
    (p.role_data?.Driver?.license_number || p.driver_profile?.license_number || '').trim().toUpperCase() === newLicNo
  );
  if (duplicate) {
    throw Object.assign(new Error(`Duplicate License Number: A driver with license "${newLicNo}" already exists in this matter (${duplicate.full_name}).`), { statusCode: 409 });
  }

  const existingProfile = normalizeDriverProfile(party);
  const updatedProfile = {
    ...existingProfile,
    ...profileData,
    license_number: newLicNo,
    cdl_number: cdlNo,
    is_commercial_driver: isCommercial
  };

  party.role_data = {
    ...(party.role_data || {}),
    Driver: updatedProfile
  };
  party.driver_profile = updatedProfile;
  parties[idx] = party;

  if (updatedProfile.assigned_vehicle_id) {
    const vId = updatedProfile.assigned_vehicle_id;
    vehicles.forEach(v => {
      if (v.driver_party_id === partyId && (v.vehicle_id || v.id) !== vId) {
        v.driver_party_id = null;
      }
    });
    const targetVehIdx = vehicles.findIndex(v => (v.vehicle_id || v.id) === vId);
    if (targetVehIdx !== -1) {
      vehicles[targetVehIdx] = {
        ...vehicles[targetVehIdx],
        driver_party_id: partyId
      };
    }
  }

  await update(id, { parties_data: parties, vehicles_data: vehicles }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'driver_profile_updated',
      description: `Driver profile updated for ${party.full_name} (License: ${updatedProfile.license_number})`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    party_id: party.id,
    full_name: party.full_name,
    driver_profile: updatedProfile
  };
}

async function bulkUpdateDrivers(id, payload, user) {
  const { action, party_ids, data } = payload;
  if (!Array.isArray(party_ids) || party_ids.length === 0) {
    throw Object.assign(new Error('No driver party_ids provided for bulk update'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];
  const vehicles = Array.isArray(matter.vehicles_data) ? [...matter.vehicles_data] : [];

  let updatedCount = 0;

  for (const partyId of party_ids) {
    const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
    if (idx === -1) continue;
    const p = parties[idx];
    if (!(p.party_roles || [p.party_role]).includes('Driver')) continue;

    const existingProfile = normalizeDriverProfile(p);
    let newProfile = { ...existingProfile };

    if (action === 'bulk_assign_vehicle' && data?.vehicle_id) {
      newProfile.assigned_vehicle_id = data.vehicle_id;
      const targetVehIdx = vehicles.findIndex(v => (v.vehicle_id || v.id) === data.vehicle_id);
      if (targetVehIdx !== -1) vehicles[targetVehIdx].driver_party_id = p.id;
    } else if (action === 'bulk_remove_vehicle') {
      newProfile.assigned_vehicle_id = null;
      vehicles.forEach(v => { if (v.driver_party_id === p.id) v.driver_party_id = null; });
    } else if (action === 'bulk_update_insurance' && data?.insurance_company) {
      newProfile.insurance_company = data.insurance_company;
      if (data.policy_number) newProfile.policy_number = data.policy_number;
    } else if (action === 'bulk_update_employer' && data?.employer) {
      newProfile.employer = data.employer;
    } else if (action === 'bulk_delete_profile') {
      if (p.role_data) delete p.role_data.Driver;
      delete p.driver_profile;
      vehicles.forEach(v => { if (v.driver_party_id === p.id) v.driver_party_id = null; });
      updatedCount++;
      continue;
    }

    p.role_data = { ...(p.role_data || {}), Driver: newProfile };
    p.driver_profile = newProfile;
    parties[idx] = p;
    updatedCount++;
  }

  await update(id, { parties_data: parties, vehicles_data: vehicles }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'drivers_bulk_updated',
      description: `Bulk operation "${action}" completed for ${updatedCount} drivers`,
      actor_user_id: user?.id || null,
    }
  });

  return { success: true, action, updated_count: updatedCount };
}

async function exportMatterDrivers(id, format = 'csv', user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  const drivers = parties.filter(p => (p.party_roles || [p.party_role]).includes('Driver')).map(p => ({
    party_id: p.id,
    full_name: p.full_name || p.company_name || '',
    email: p.email || '',
    phone: p.phone || '',
    ...normalizeDriverProfile(p)
  }));

  if (format === 'json') return drivers;

  const headers = ['Party ID', 'Full Name', 'Email', 'Phone', 'License #', 'State', 'Class', 'Expiry', 'Expired Status', 'DOB', 'Gender', 'Employer', 'Experience (Yrs)', 'CDL', 'CDL Number', 'Insurance Co', 'Policy #', 'Seatbelt', 'Alcohol Test', 'Drug Test', 'Citation Issued', 'Citation #', 'Injury Status', 'Hospital', 'Notes'];
  const rows = drivers.map(d => [
    `"${d.party_id || ''}"`, `"${(d.full_name || '').replace(/"/g, '""')}"`, `"${d.email || ''}"`, `"${d.phone || ''}"`,
    `"${d.license_number || ''}"`, `"${d.license_state || ''}"`, `"${d.license_class || ''}"`, `"${d.license_expiry || ''}"`,
    `"${d.is_expired ? 'Expired' : 'Valid'}"`, `"${d.date_of_birth || ''}"`, `"${d.gender || ''}"`, `"${(d.employer || '').replace(/"/g, '""')}"`,
    `"${d.years_experience || ''}"`, `"${d.is_commercial_driver ? 'Yes' : 'No'}"`, `"${d.cdl_number || ''}"`, `"${(d.insurance_company || '').replace(/"/g, '""')}"`,
    `"${d.policy_number || ''}"`, `"${d.seatbelt_used || ''}"`, `"${d.alcohol_test || ''}"`, `"${d.drug_test || ''}"`,
    `"${d.citation_issued ? 'Yes' : 'No'}"`, `"${d.citation_number || ''}"`, `"${d.injury_status || ''}"`, `"${(d.hospital || '').replace(/"/g, '""')}"`,
    `"${(d.notes || '').replace(/"/g, '""')}"`
  ]);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'driver_exported',
      description: `Exported ${drivers.length} drivers in ${format.toUpperCase()} format`,
      actor_user_id: user?.id || null,
    }
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function importMatterDrivers(id, driverRecords, user) {
  if (!Array.isArray(driverRecords) || driverRecords.length === 0) {
    throw Object.assign(new Error('No driver records provided for import'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (let i = 0; i < driverRecords.length; i++) {
    const rec = driverRecords[i];
    const licNo = (rec.license_number || rec.license || '').trim().toUpperCase();
    const name = (rec.full_name || rec.name || '').trim();

    if (!name) {
      errors.push(`Record #${i + 1}: Missing driver name`);
      skippedCount++;
      continue;
    }
    if (!licNo) {
      errors.push(`Record #${i + 1} (${name}): Missing license number`);
      skippedCount++;
      continue;
    }

    const existingIdx = parties.findIndex(p =>
      (p.role_data?.Driver?.license_number || p.driver_profile?.license_number || '').trim().toUpperCase() === licNo
    );

    const driverProfile = {
      license_number: licNo,
      license_state: rec.license_state || rec.state || '',
      license_class: rec.license_class || '',
      license_expiry: rec.license_expiry || '',
      employer: rec.employer || '',
      years_experience: rec.years_experience || '',
      is_commercial_driver: Boolean(rec.is_commercial_driver || rec.cdl),
      cdl_number: rec.cdl_number || '',
      insurance_company: rec.insurance_company || '',
      policy_number: rec.policy_number || '',
      seatbelt_used: rec.seatbelt_used || 'Unknown',
      alcohol_test: rec.alcohol_test || 'Not Tested',
      drug_test: rec.drug_test || 'Not Tested',
      citation_issued: Boolean(rec.citation_issued),
      citation_number: rec.citation_number || '',
      injury_status: rec.injury_status || 'Uninjured',
      hospital: rec.hospital || '',
      notes: rec.notes || ''
    };

    if (existingIdx !== -1) {
      const p = parties[existingIdx];
      p.role_data = { ...(p.role_data || {}), Driver: { ...(p.role_data?.Driver || {}), ...driverProfile } };
      p.driver_profile = p.role_data.Driver;
      parties[existingIdx] = p;
      updatedCount++;
    } else {
      const newParty = {
        id: `party_imp_drv_${Date.now()}_${i}`,
        full_name: name,
        email: rec.email || '',
        phone: rec.phone || '',
        party_role: 'Driver',
        party_roles: ['Driver'],
        primary_party_role: 'Driver',
        party_type: 'Person',
        role_data: { Driver: driverProfile },
        driver_profile: driverProfile
      };
      parties.push(newParty);
      addedCount++;
    }
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'driver_imported',
      description: `Imported drivers: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    success: true,
    added_count: addedCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    errors
  };
}

// ============================================================
// ENTERPRISE TIMELINE & CASE ACTIVITY MODULE — matters.service.js
// ============================================================

async function getMatterTimeline(id, query = {}, user) {
  const matter = await getById(id, user);
  if (!matter) {
    throw Object.assign(new Error('Matter not found'), { statusCode: 404 });
  }

  const { module: moduleFilter = 'All', search = '', sort = 'newest' } = query;

  const where = { matter_id: parseInt(id, 10) };
  if (user?.role === 'client') {
    // Clients only see events that are marked client-visible or general updates
    where.action = {
      in: ['timeline_manual_entry', 'uploaded', 'converted_from_lead', 'portal_activated', 'portal_login', 'stage_change']
    };
  }

  const rawActivities = await prisma.activity.findMany({
    where,
    include: {
      actor: { select: { id: true, full_name: true, email: true } }
    },
    orderBy: { created_at: 'desc' }
  });

  const timelineItems = [];

  const getModuleMeta = (action, entityType, desc = '') => {
    const act = (action || '').toLowerCase();
    const ent = (entityType || '').toLowerCase();

    if (ent.includes('vehicle') || act.includes('vehicle')) return { module: 'Vehicle', icon: '🚘' };
    if (ent.includes('driver') || act.includes('driver')) return { module: 'Driver', icon: '🏎️' };
    if (ent.includes('passenger') || act.includes('passenger')) return { module: 'Passenger', icon: '👥' };
    if (ent.includes('witness') || act.includes('witness')) return { module: 'Witness', icon: '👁️' };
    if (ent.includes('insurance') || act.includes('insurance')) return { module: 'Insurance', icon: '🛡️' };
    if (ent.includes('medical') || act.includes('medical')) return { module: 'Medical Provider', icon: '🩹' };
    if (ent.includes('employer') || act.includes('employer')) return { module: 'Employer', icon: '🏢' };
    if (ent.includes('property') || act.includes('property')) return { module: 'Property Damage', icon: '🏠' };
    if (ent.includes('police') || act.includes('police')) return { module: 'Police', icon: '👮' };
    if (ent.includes('document') || act.includes('document')) return { module: 'Documents', icon: '📄' };
    if (ent.includes('party') || act.includes('party')) return { module: 'Legal Parties', icon: '👤' };
    return { module: 'Matter', icon: '⚖️' };
  };

  rawActivities.forEach(act => {
    let parsedData = {};
    if (act.description && act.description.startsWith('{')) {
      try { parsedData = JSON.parse(act.description); } catch (e) { }
    }
    const meta = getModuleMeta(act.action, act.entity_type, act.description);
    const title = parsedData.title || act.action?.replace(/_/g, ' ') || 'Case Event';
    const description = parsedData.description || act.description || '';

    timelineItems.push({
      id: act.id,
      module: parsedData.module || meta.module,
      icon: parsedData.icon || meta.icon,
      action: act.action,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      description: description,
      user_name: act.actor?.full_name || 'System User',
      actor_id: act.actor_user_id,
      created_at: act.created_at,
      date: formatPSTDate(act.created_at),
      time: formatPSTTime(act.created_at),
      related_matter: matter.title || `Matter #${id}`,
      related_party: parsedData.related_party || null
    });
  });

  // Always synthesize structural case events (Matter initialized, Parties, Vehicles, Documents)
  // so module filtering works seamlessly across all modules
  timelineItems.push({
    id: `synth_created_${id}`,
    module: 'Matter',
    icon: '⚖️',
    action: 'matter_created',
    title: 'Matter Initialized',
    description: `Matter "${matter.title || 'Legal Case'}" was created and logged into case management system.`,
    user_name: matter.assigned_lawyer?.full_name || 'Primary Counsel',
    created_at: matter.created_at || new Date(),
    date: formatPSTDate(matter.created_at || new Date()),
    time: formatPSTTime(matter.created_at || new Date()),
    related_matter: matter.title || `Matter #${id}`
  });

  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  parties.forEach((p, idx) => {
    const roles = p.party_roles || [p.party_role || 'Legal Parties'];
    roles.forEach(role => {
      let mod = 'Legal Parties';
      let ic = '👤';
      if (role === 'Driver') { mod = 'Driver'; ic = '🏎️'; }
      else if (role === 'Passenger') { mod = 'Passenger'; ic = '👥'; }
      else if (role === 'Witness') { mod = 'Witness'; ic = '👁️'; }
      else if (role === 'Insurance Company' || role === 'Insurance Adjuster' || role === 'Insurance') { mod = 'Insurance'; ic = '🛡️'; }
      else if (role === 'Medical Provider') { mod = 'Medical Provider'; ic = '🩹'; }
      else if (role === 'Employer') { mod = 'Employer'; ic = '🏢'; }
      else if (role === 'Property Damage') { mod = 'Property Damage'; ic = '🏠'; }
      else if (role === 'Police' || role === 'Police Officer') { mod = 'Police'; ic = '👮'; }

      timelineItems.push({
        id: `synth_party_${p.id || idx}_${role}`,
        module: mod,
        icon: ic,
        action: 'party_recorded',
        title: `${mod} Profile Recorded`,
        description: `${role} "${p.full_name || p.company_name || 'Party'}" recorded in matter file.`,
        user_name: 'Case Manager',
        created_at: p.created_at ? new Date(p.created_at) : new Date(matter.created_at || new Date()),
        date: formatPSTDate(p.created_at || matter.created_at || new Date()),
        time: formatPSTTime(p.created_at || matter.created_at || new Date()),
        related_matter: matter.title,
        related_party: p.full_name || p.company_name
      });
    });
  });

  const vehicles = Array.isArray(matter.vehicles_data) ? matter.vehicles_data : [];
  vehicles.forEach((v, idx) => {
    timelineItems.push({
      id: `synth_veh_${v.vehicle_id || v.id || idx}`,
      module: 'Vehicle',
      icon: '🚘',
      action: 'vehicle_added',
      title: 'Vehicle Added to Case',
      description: `Recorded vehicle: ${v.year || ''} ${v.make || ''} ${v.model || ''} (VIN: ${v.vin || 'N/A'})`,
      user_name: 'Case Manager',
      created_at: v.created_at ? new Date(v.created_at) : new Date(matter.created_at || new Date()),
      date: formatPSTDate(v.created_at || matter.created_at || new Date()),
      time: formatPSTTime(v.created_at || matter.created_at || new Date()),
      related_matter: matter.title
    });
  });

  const docs = Array.isArray(matter.documents) ? matter.documents : [];
  docs.forEach((d, idx) => {
    // Do not disclose internal documents on the client timeline
    if (user?.role === 'client' && d.visibility !== 'client_shared' && d.visibility !== 'client_visible') return;

    timelineItems.push({
      id: `synth_doc_${d.id || idx}`,
      module: 'Documents',
      icon: '📄',
      action: 'document_uploaded',
      title: 'Document Uploaded',
      description: `Uploaded document "${d.original_name}" under category "${d.category || 'General'}"`,
      user_name: d.uploader?.full_name || 'System User',
      created_at: d.created_at ? new Date(d.created_at) : new Date(matter.created_at || new Date()),
      date: formatPSTDate(d.created_at || matter.created_at || new Date()),
      time: formatPSTTime(d.created_at || matter.created_at || new Date()),
      related_matter: matter.title
    });
  });

  let filtered = [...timelineItems];
  if (moduleFilter && moduleFilter !== 'All') {
    const mf = moduleFilter.toLowerCase();
    filtered = filtered.filter(item => (item.module || '').toLowerCase().includes(mf) || mf.includes((item.module || '').toLowerCase()));
  }

  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    filtered = filtered.filter(item =>
      (item.title || '').toLowerCase().includes(s) ||
      (item.description || '').toLowerCase().includes(s) ||
      (item.user_name || '').toLowerCase().includes(s) ||
      (item.module || '').toLowerCase().includes(s) ||
      (item.related_party || '').toLowerCase().includes(s)
    );
  }

  if (sort === 'oldest') {
    filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (sort === 'module') {
    filtered.sort((a, b) => (a.module || '').localeCompare(b.module || ''));
  } else {
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return {
    timeline_events: filtered,
    total_count: filtered.length,
    matter_id: parseInt(id, 10),
    matter_title: matter.title
  };
}

async function addMatterTimelineEvent(id, payload, user) {
  if (!payload.title || !payload.title.trim()) {
    throw Object.assign(new Error('Timeline event title is required'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const mod = payload.module || 'Matter';
  const descObj = {
    title: payload.title.trim(),
    description: payload.description || '',
    related_party: payload.related_party || '',
    icon: payload.icon || '📌',
    module: mod
  };

  const activity = await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      actor_user_id: user?.id || null,
      entity_type: mod,
      entity_id: parseInt(id, 10),
      action: 'timeline_manual_entry',
      description: JSON.stringify(descObj)
    },
    include: {
      actor: { select: { id: true, full_name: true, email: true } }
    }
  });

  return {
    id: activity.id,
    module: mod,
    icon: payload.icon || '📌',
    action: 'timeline_manual_entry',
    title: payload.title.trim(),
    description: payload.description || '',
    user_name: activity.actor?.full_name || user?.full_name || 'System User',
    created_at: activity.created_at,
    date: formatPSTDate(activity.created_at),
    time: formatPSTTime(activity.created_at),
    related_matter: matter.title,
    related_party: payload.related_party || null
  };
}

async function updateMatterTimelineEvent(id, eventId, payload, user) {
  const activityId = parseInt(eventId, 10);
  if (isNaN(activityId)) {
    throw Object.assign(new Error('Invalid timeline event ID'), { statusCode: 400 });
  }

  const existing = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!existing || existing.matter_id !== parseInt(id, 10)) {
    throw Object.assign(new Error('Timeline event not found for this matter'), { statusCode: 404 });
  }

  let descObj = {};
  if (existing.description && existing.description.startsWith('{')) {
    try { descObj = JSON.parse(existing.description); } catch (e) { }
  } else {
    descObj = { description: existing.description || '' };
  }

  if (payload.title) descObj.title = payload.title.trim();
  if (payload.description !== undefined) descObj.description = payload.description;
  if (payload.module) descObj.module = payload.module;
  if (payload.icon) descObj.icon = payload.icon;
  if (payload.related_party !== undefined) descObj.related_party = payload.related_party;

  const updated = await prisma.activity.update({
    where: { id: activityId },
    data: {
      entity_type: payload.module || existing.entity_type,
      description: JSON.stringify(descObj)
    },
    include: {
      actor: { select: { id: true, full_name: true, email: true } }
    }
  });

  return {
    id: updated.id,
    module: descObj.module || updated.entity_type,
    icon: descObj.icon || '📌',
    title: descObj.title || updated.action,
    description: descObj.description || '',
    user_name: updated.actor?.full_name || 'System User',
    created_at: updated.created_at,
    date: formatPSTDate(updated.created_at),
    time: formatPSTTime(updated.created_at),
    related_party: descObj.related_party || null
  };
}

async function deleteMatterTimelineEvent(id, eventId, user) {
  const activityId = parseInt(eventId, 10);
  if (isNaN(activityId)) {
    throw Object.assign(new Error('Invalid timeline event ID'), { statusCode: 400 });
  }

  const existing = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!existing || existing.matter_id !== parseInt(id, 10)) {
    throw Object.assign(new Error('Timeline event not found for this matter'), { statusCode: 404 });
  }

  await prisma.activity.delete({ where: { id: activityId } });
  return { success: true, event_id: activityId };
}

// ============================================================
// ENTERPRISE PASSENGER MODULE — matters.service.js
// ============================================================

function normalizePassengerProfile(p) {
  const passengerProfile = p.role_data?.Passenger || p.passenger_profile || {};

  return {
    seat_position: passengerProfile.seat_position || p.seat_position || 'Front Right',
    seatbelt_used: passengerProfile.seatbelt_used || p.seatbelt_used || 'Unknown',
    airbag_deployed: passengerProfile.airbag_deployed || p.airbag_deployed || 'Unknown',
    injury_status: passengerProfile.injury_status || p.injury_status || 'None',
    transported_by: passengerProfile.transported_by || p.transported_by || 'Unknown',
    hospital: passengerProfile.hospital || p.hospital || '',
    hospital_address: passengerProfile.hospital_address || p.hospital_address || '',
    medical_notes: passengerProfile.medical_notes || p.medical_notes || '',
    claim_number: passengerProfile.claim_number || p.claim_number || '',
    insurance_company: passengerProfile.insurance_company || p.insurance_company || '',
    policy_number: passengerProfile.policy_number || p.policy_number || '',
    emergency_contact_name: passengerProfile.emergency_contact_name || p.emergency_contact_name || '',
    emergency_contact_phone: passengerProfile.emergency_contact_phone || p.emergency_contact_phone || '',
    relationship: passengerProfile.relationship || p.relationship || '',
    passenger_notes: passengerProfile.passenger_notes || p.passenger_notes || p.notes || '',
    assigned_vehicle_id: passengerProfile.assigned_vehicle_id || p.assigned_vehicle_id || null,
    assigned_driver_party_id: passengerProfile.assigned_driver_party_id || p.assigned_driver_party_id || null
  };
}

async function getMatterPassengers(id, query, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  const vehicles = Array.isArray(matter.vehicles_data) ? matter.vehicles_data : [];

  let passengers = parties.filter(p => (p.party_roles || [p.party_role]).includes('Passenger'));

  passengers = passengers.map(p => {
    const profile = normalizePassengerProfile(p);
    const linkedVehicle = vehicles.find(v => (v.vehicle_id || v.id) === profile.assigned_vehicle_id || (Array.isArray(v.passenger_party_ids) && v.passenger_party_ids.includes(p.id)));
    const linkedDriver = parties.find(dp => (dp.id === profile.assigned_driver_party_id || dp.id === String(profile.assigned_driver_party_id)) && (dp.party_roles || [dp.party_role]).includes('Driver'));

    const roleData = {
      ...(p.role_data || {}),
      Passenger: profile
    };

    return {
      party_id: p.id,
      full_name: p.full_name || p.company_name || '',
      email: p.email || '',
      phone: p.phone || '',
      party_type: p.party_type || 'Person',
      party_roles: p.party_roles || [p.party_role],
      role_data: roleData,
      passenger_profile: profile,
      assigned_vehicle: linkedVehicle ? {
        vehicle_id: linkedVehicle.vehicle_id || linkedVehicle.id,
        year: linkedVehicle.year,
        make: linkedVehicle.make,
        model: linkedVehicle.model,
        license_plate: linkedVehicle.license_plate
      } : null,
      assigned_driver: linkedDriver ? {
        party_id: linkedDriver.id,
        full_name: linkedDriver.full_name
      } : null
    };
  });

  const {
    search, seat_position, seatbelt_used, hospital, injury_status, insurance_company,
    vehicle_assigned, driver_assigned, sort = 'name', page = 1, pageSize = 50
  } = query;

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    passengers = passengers.filter(p => {
      const pp = p.role_data.Passenger;
      const v = p.assigned_vehicle;
      const d = p.assigned_driver;
      return (
        p.full_name?.toLowerCase().includes(term) ||
        pp.hospital?.toLowerCase().includes(term) ||
        pp.claim_number?.toLowerCase().includes(term) ||
        pp.insurance_company?.toLowerCase().includes(term) ||
        d?.full_name?.toLowerCase().includes(term) ||
        v?.make?.toLowerCase().includes(term) ||
        v?.model?.toLowerCase().includes(term) ||
        v?.license_plate?.toLowerCase().includes(term)
      );
    });
  }

  if (seat_position) passengers = passengers.filter(p => p.role_data.Passenger.seat_position === seat_position);
  if (seatbelt_used) passengers = passengers.filter(p => p.role_data.Passenger.seatbelt_used === seatbelt_used);
  if (hospital) passengers = passengers.filter(p => p.role_data.Passenger.hospital?.toLowerCase().includes(hospital.toLowerCase()));
  if (injury_status) passengers = passengers.filter(p => p.role_data.Passenger.injury_status === injury_status);
  if (insurance_company) passengers = passengers.filter(p => p.role_data.Passenger.insurance_company?.toLowerCase().includes(insurance_company.toLowerCase()));
  if (vehicle_assigned !== undefined) {
    const wantAssigned = String(vehicle_assigned) === 'true';
    passengers = passengers.filter(p => wantAssigned ? Boolean(p.assigned_vehicle) : !p.assigned_vehicle);
  }
  if (driver_assigned !== undefined) {
    const wantDriver = String(driver_assigned) === 'true';
    passengers = passengers.filter(p => wantDriver ? Boolean(p.assigned_driver) : !p.assigned_driver);
  }

  if (sort === 'name') passengers.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  else if (sort === 'vehicle') passengers.sort((a, b) => (a.assigned_vehicle?.make || '').localeCompare(b.assigned_vehicle?.make || ''));
  else if (sort === 'driver') passengers.sort((a, b) => (a.assigned_driver?.full_name || '').localeCompare(b.assigned_driver?.full_name || ''));
  else if (sort === 'hospital') passengers.sort((a, b) => (a.role_data.Passenger.hospital || '').localeCompare(b.role_data.Passenger.hospital || ''));
  else if (sort === 'recent') passengers.reverse();

  const rawPassengers = parties.filter(p => (p.party_roles || [p.party_role]).includes('Passenger'));
  const counts = {
    total_passengers: rawPassengers.length,
    injured_passengers: rawPassengers.filter(p => {
      const st = (p.role_data?.Passenger || p.passenger_profile || {}).injury_status;
      return st && st !== 'None' && st !== 'Uninjured';
    }).length,
    hospitalized_passengers: rawPassengers.filter(p => Boolean((p.role_data?.Passenger || p.passenger_profile || {}).hospital)).length,
    seatbelt_used_count: rawPassengers.filter(p => (p.role_data?.Passenger || p.passenger_profile || {}).seatbelt_used === 'Yes').length,
    without_vehicle_count: rawPassengers.filter(p => {
      const pp = p.role_data?.Passenger || p.passenger_profile || {};
      const linkedVeh = vehicles.find(v => (v.vehicle_id || v.id) === pp.assigned_vehicle_id || (Array.isArray(v.passenger_party_ids) && v.passenger_party_ids.includes(p.id)));
      return !linkedVeh;
    }).length,
    without_driver_count: rawPassengers.filter(p => {
      const pp = p.role_data?.Passenger || p.passenger_profile || {};
      const linkedDriver = parties.find(dp => (dp.id === pp.assigned_driver_party_id || dp.id === String(pp.assigned_driver_party_id)) && (dp.party_roles || [dp.party_role]).includes('Driver'));
      return !linkedDriver;
    }).length
  };

  const pNum = Math.max(1, parseInt(page, 10) || 1);
  const pSize = Math.max(1, Math.min(parseInt(pageSize, 10) || 50, 1000));
  const total = passengers.length;
  const totalPages = Math.ceil(total / pSize);

  return {
    passengers: passengers.slice((pNum - 1) * pSize, pNum * pSize),
    total,
    page: pNum,
    pageSize: pSize,
    totalPages,
    counts
  };
}

async function updatePassengerProfile(id, partyId, profileData, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];
  const vehicles = Array.isArray(matter.vehicles_data) ? [...matter.vehicles_data] : [];

  const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
  if (idx === -1) throw Object.assign(new Error('Passenger party not found'), { statusCode: 404 });

  const party = parties[idx];
  const roles = party.party_roles || [party.party_role];
  if (!roles.includes('Passenger')) {
    throw Object.assign(new Error('Party does not have Passenger role'), { statusCode: 400 });
  }

  if (profileData.assigned_vehicle_id) {
    const vExists = vehicles.some(v => (v.vehicle_id || v.id) === profileData.assigned_vehicle_id);
    if (!vExists) {
      throw Object.assign(new Error(`Assigned vehicle ID "${profileData.assigned_vehicle_id}" does not exist in this matter.`), { statusCode: 400 });
    }
  }

  if (profileData.assigned_driver_party_id) {
    const driverParty = parties.find(p => (p.id === profileData.assigned_driver_party_id || p.id === String(profileData.assigned_driver_party_id)));
    if (!driverParty) {
      throw Object.assign(new Error(`Assigned driver party ID "${profileData.assigned_driver_party_id}" not found.`), { statusCode: 400 });
    }
    const isDriverRole = (driverParty.party_roles || [driverParty.party_role]).includes('Driver');
    if (!isDriverRole) {
      throw Object.assign(new Error(`Party "${driverParty.full_name}" does not have the Driver role.`), { statusCode: 400 });
    }
  }

  const existingProfile = normalizePassengerProfile(party);
  const updatedProfile = {
    ...existingProfile,
    ...profileData
  };

  party.role_data = {
    ...(party.role_data || {}),
    Passenger: updatedProfile
  };
  party.passenger_profile = updatedProfile;
  parties[idx] = party;

  if (updatedProfile.assigned_vehicle_id) {
    const targetVId = updatedProfile.assigned_vehicle_id;
    vehicles.forEach(v => {
      const vid = v.vehicle_id || v.id;
      let passList = Array.isArray(v.passenger_party_ids) ? [...v.passenger_party_ids] : [];
      if (vid === targetVId) {
        if (!passList.includes(partyId)) passList.push(partyId);
      } else {
        passList = passList.filter(pid => pid !== partyId);
      }
      v.passenger_party_ids = passList;
    });
  }

  await update(id, { parties_data: parties, vehicles_data: vehicles }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'passenger_profile_updated',
      description: `Passenger profile updated for ${party.full_name} (Seat: ${updatedProfile.seat_position})`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    party_id: party.id,
    full_name: party.full_name,
    passenger_profile: updatedProfile
  };
}

async function bulkUpdatePassengers(id, payload, user) {
  const { action, party_ids, data } = payload;
  if (!Array.isArray(party_ids) || party_ids.length === 0) {
    throw Object.assign(new Error('No passenger party_ids provided for bulk update'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];
  const vehicles = Array.isArray(matter.vehicles_data) ? [...matter.vehicles_data] : [];

  let updatedCount = 0;

  for (const partyId of party_ids) {
    const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
    if (idx === -1) continue;
    const p = parties[idx];
    if (!(p.party_roles || [p.party_role]).includes('Passenger')) continue;

    const existingProfile = normalizePassengerProfile(p);
    let newProfile = { ...existingProfile };

    if (action === 'bulk_assign_vehicle' && data?.vehicle_id) {
      newProfile.assigned_vehicle_id = data.vehicle_id;
      const targetVehIdx = vehicles.findIndex(v => (v.vehicle_id || v.id) === data.vehicle_id);
      if (targetVehIdx !== -1) {
        const passList = Array.isArray(vehicles[targetVehIdx].passenger_party_ids) ? [...vehicles[targetVehIdx].passenger_party_ids] : [];
        if (!passList.includes(p.id)) passList.push(p.id);
        vehicles[targetVehIdx].passenger_party_ids = passList;
      }
    } else if (action === 'bulk_assign_driver' && data?.driver_party_id) {
      newProfile.assigned_driver_party_id = data.driver_party_id;
    } else if (action === 'bulk_remove_vehicle') {
      newProfile.assigned_vehicle_id = null;
      vehicles.forEach(v => {
        if (Array.isArray(v.passenger_party_ids)) v.passenger_party_ids = v.passenger_party_ids.filter(id => id !== p.id);
      });
    } else if (action === 'bulk_update_hospital' && data?.hospital) {
      newProfile.hospital = data.hospital;
      if (data.hospital_address) newProfile.hospital_address = data.hospital_address;
    } else if (action === 'bulk_delete_profile') {
      if (p.role_data) delete p.role_data.Passenger;
      delete p.passenger_profile;
      vehicles.forEach(v => {
        if (Array.isArray(v.passenger_party_ids)) v.passenger_party_ids = v.passenger_party_ids.filter(id => id !== p.id);
      });
      updatedCount++;
      continue;
    }

    p.role_data = { ...(p.role_data || {}), Passenger: newProfile };
    p.passenger_profile = newProfile;
    parties[idx] = p;
    updatedCount++;
  }

  await update(id, { parties_data: parties, vehicles_data: vehicles }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'passengers_bulk_updated',
      description: `Bulk operation "${action}" completed for ${updatedCount} passengers`,
      actor_user_id: user?.id || null,
    }
  });

  return { success: true, action, updated_count: updatedCount };
}

async function exportMatterPassengers(id, format = 'csv', user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  const passengers = parties.filter(p => (p.party_roles || [p.party_role]).includes('Passenger')).map(p => ({
    party_id: p.id,
    full_name: p.full_name || p.company_name || '',
    email: p.email || '',
    phone: p.phone || '',
    ...normalizePassengerProfile(p)
  }));

  if (format === 'json') return passengers;

  const headers = ['Party ID', 'Full Name', 'Email', 'Phone', 'Seat Position', 'Seatbelt Used', 'Airbag Deployed', 'Injury Status', 'Transported By', 'Hospital', 'Hospital Address', 'Claim #', 'Insurance Co', 'Policy #', 'Emergency Contact', 'Emergency Phone', 'Relationship', 'Assigned Vehicle ID', 'Assigned Driver ID', 'Notes'];
  const rows = passengers.map(p => [
    `"${p.party_id || ''}"`, `"${(p.full_name || '').replace(/"/g, '""')}"`, `"${p.email || ''}"`, `"${p.phone || ''}"`,
    `"${p.seat_position || ''}"`, `"${p.seatbelt_used || ''}"`, `"${p.airbag_deployed || ''}"`, `"${p.injury_status || ''}"`,
    `"${p.transported_by || ''}"`, `"${(p.hospital || '').replace(/"/g, '""')}"`, `"${(p.hospital_address || '').replace(/"/g, '""')}"`,
    `"${p.claim_number || ''}"`, `"${(p.insurance_company || '').replace(/"/g, '""')}"`, `"${p.policy_number || ''}"`,
    `"${(p.emergency_contact_name || '').replace(/"/g, '""')}"`, `"${p.emergency_contact_phone || ''}"`, `"${p.relationship || ''}"`,
    `"${p.assigned_vehicle_id || ''}"`, `"${p.assigned_driver_party_id || ''}"`, `"${(p.passenger_notes || '').replace(/"/g, '""')}"`
  ]);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'passenger_exported',
      description: `Exported ${passengers.length} passengers in ${format.toUpperCase()} format`,
      actor_user_id: user?.id || null,
    }
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function importMatterPassengers(id, passengerRecords, user) {
  if (!Array.isArray(passengerRecords) || passengerRecords.length === 0) {
    throw Object.assign(new Error('No passenger records provided for import'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (let i = 0; i < passengerRecords.length; i++) {
    const rec = passengerRecords[i];
    const name = (rec.full_name || rec.name || '').trim();

    if (!name) {
      errors.push(`Record #${i + 1}: Missing passenger name`);
      skippedCount++;
      continue;
    }

    const existingIdx = parties.findIndex(p =>
      (p.full_name || '').trim().toLowerCase() === name.toLowerCase() &&
      (p.party_roles || [p.party_role]).includes('Passenger')
    );

    const passengerProfile = {
      seat_position: rec.seat_position || 'Front Right',
      seatbelt_used: rec.seatbelt_used || 'Unknown',
      airbag_deployed: rec.airbag_deployed || 'Unknown',
      injury_status: rec.injury_status || 'None',
      transported_by: rec.transported_by || 'Unknown',
      hospital: rec.hospital || '',
      hospital_address: rec.hospital_address || '',
      medical_notes: rec.medical_notes || '',
      claim_number: rec.claim_number || '',
      insurance_company: rec.insurance_company || '',
      policy_number: rec.policy_number || '',
      emergency_contact_name: rec.emergency_contact_name || '',
      emergency_contact_phone: rec.emergency_contact_phone || '',
      relationship: rec.relationship || '',
      passenger_notes: rec.passenger_notes || rec.notes || '',
      assigned_vehicle_id: rec.assigned_vehicle_id || null,
      assigned_driver_party_id: rec.assigned_driver_party_id || null
    };

    if (existingIdx !== -1) {
      const p = parties[existingIdx];
      p.role_data = { ...(p.role_data || {}), Passenger: { ...(p.role_data?.Passenger || {}), ...passengerProfile } };
      p.passenger_profile = p.role_data.Passenger;
      parties[existingIdx] = p;
      updatedCount++;
    } else {
      const newParty = {
        id: `party_imp_pas_${Date.now()}_${i}`,
        full_name: name,
        email: rec.email || '',
        phone: rec.phone || '',
        party_role: 'Passenger',
        party_roles: ['Passenger'],
        primary_party_role: 'Passenger',
        party_type: 'Person',
        role_data: { Passenger: passengerProfile },
        passenger_profile: passengerProfile
      };
      parties.push(newParty);
      addedCount++;
    }
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'passenger_imported',
      description: `Imported passengers: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    success: true,
    added_count: addedCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    errors
  };
}
// ============================================================
// ENTERPRISE WITNESS MODULE — matters.service.js
// ============================================================

function normalizeWitnessProfile(p) {
  const witnessProfile = p.role_data?.Witness || p.witness_profile || {};

  return {
    witness_type: witnessProfile.witness_type || 'Bystander',
    statement_status: witnessProfile.statement_status || 'Pending',
    vantage_point: witnessProfile.vantage_point || '',
    statement_date: witnessProfile.statement_date || '',
    reliability: witnessProfile.reliability || 'Unknown',
    relationship_to_parties: witnessProfile.relationship_to_parties || '',
    witness_notes: witnessProfile.witness_notes || p.witness_notes || p.notes || ''
  };
}

async function getMatterWitnesses(id, query, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];

  let witnesses = parties.filter(p => (p.party_roles || [p.party_role]).includes('Witness'));

  witnesses = witnesses.map(p => {
    const profile = normalizeWitnessProfile(p);
    const roleData = {
      ...(p.role_data || {}),
      Witness: profile
    };

    return {
      party_id: p.id,
      full_name: p.full_name || p.company_name || '',
      email: p.email || '',
      phone: p.phone || '',
      party_type: p.party_type || 'Person',
      party_roles: p.party_roles || [p.party_role],
      role_data: roleData,
      witness_profile: profile
    };
  });

  const {
    search, witness_type, statement_status, sort = 'name', page = 1, pageSize = 50
  } = query;

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    witnesses = witnesses.filter(p => {
      const wp = p.role_data.Witness;
      return (
        p.full_name?.toLowerCase().includes(term) ||
        wp.vantage_point?.toLowerCase().includes(term) ||
        wp.witness_notes?.toLowerCase().includes(term)
      );
    });
  }

  if (witness_type) witnesses = witnesses.filter(p => p.role_data.Witness.witness_type === witness_type);
  if (statement_status) witnesses = witnesses.filter(p => p.role_data.Witness.statement_status === statement_status);

  if (sort === 'name') witnesses.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  else if (sort === 'recent') witnesses.reverse();

  const rawWitnesses = parties.filter(p => (p.party_roles || [p.party_role]).includes('Witness'));
  const counts = {
    total_witnesses: rawWitnesses.length,
    statements_obtained: rawWitnesses.filter(p => {
      const st = (p.role_data?.Witness || p.witness_profile || {}).statement_status;
      return st && st !== 'Pending';
    }).length
  };

  const pNum = Math.max(1, parseInt(page, 10) || 1);
  const pSize = Math.max(1, Math.min(parseInt(pageSize, 10) || 50, 1000));
  const total = witnesses.length;
  const totalPages = Math.ceil(total / pSize);

  return {
    witnesses: witnesses.slice((pNum - 1) * pSize, pNum * pSize),
    total,
    page: pNum,
    pageSize: pSize,
    totalPages,
    counts
  };
}

async function updateWitnessProfile(id, partyId, profileData, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
  if (idx === -1) throw Object.assign(new Error('Witness party not found'), { statusCode: 404 });

  const party = parties[idx];
  const roles = party.party_roles || [party.party_role];
  if (!roles.includes('Witness')) {
    throw Object.assign(new Error('Party does not have Witness role'), { statusCode: 400 });
  }

  const existingProfile = normalizeWitnessProfile(party);
  const updatedProfile = {
    ...existingProfile,
    ...profileData
  };

  party.role_data = {
    ...(party.role_data || {}),
    Witness: updatedProfile
  };
  party.witness_profile = updatedProfile;
  parties[idx] = party;

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'witness_profile_updated',
      description: `Witness profile updated for ${party.full_name} (${updatedProfile.statement_status})`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    party_id: party.id,
    full_name: party.full_name,
    witness_profile: updatedProfile
  };
}

async function bulkUpdateWitnesses(id, payload, user) {
  const { action, party_ids, data } = payload;
  if (!Array.isArray(party_ids) || party_ids.length === 0) {
    throw Object.assign(new Error('No witness party_ids provided for bulk update'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let updatedCount = 0;

  for (const partyId of party_ids) {
    const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
    if (idx === -1) continue;
    const p = parties[idx];
    if (!(p.party_roles || [p.party_role]).includes('Witness')) continue;

    const existingProfile = normalizeWitnessProfile(p);
    let newProfile = { ...existingProfile };

    if (action === 'bulk_update_status' && data?.statement_status) {
      newProfile.statement_status = data.statement_status;
      if (data.statement_date) newProfile.statement_date = data.statement_date;
    } else if (action === 'bulk_delete_profile') {
      if (p.role_data) delete p.role_data.Witness;
      delete p.witness_profile;
      updatedCount++;
      continue;
    }

    p.role_data = { ...(p.role_data || {}), Witness: newProfile };
    p.witness_profile = newProfile;
    parties[idx] = p;
    updatedCount++;
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'witnesses_bulk_updated',
      description: `Bulk operation "${action}" completed for ${updatedCount} witnesses`,
      actor_user_id: user?.id || null,
    }
  });

  return { success: true, action, updated_count: updatedCount };
}

async function exportMatterWitnesses(id, format = 'csv', user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  const witnesses = parties.filter(p => (p.party_roles || [p.party_role]).includes('Witness')).map(p => ({
    party_id: p.id,
    full_name: p.full_name || p.company_name || '',
    email: p.email || '',
    phone: p.phone || '',
    ...normalizeWitnessProfile(p)
  }));

  if (format === 'json') return witnesses;

  const headers = ['Party ID', 'Full Name', 'Email', 'Phone', 'Witness Type', 'Statement Status', 'Vantage Point', 'Statement Date', 'Credibility', 'Relationship', 'Notes'];
  const rows = witnesses.map(p => [
    `"${p.party_id || ''}"`, `"${(p.full_name || '').replace(/"/g, '""')}"`, `"${p.email || ''}"`, `"${p.phone || ''}"`,
    `"${p.witness_type || ''}"`, `"${p.statement_status || ''}"`, `"${(p.vantage_point || '').replace(/"/g, '""')}"`, `"${p.statement_date || ''}"`,
    `"${p.reliability || ''}"`, `"${(p.relationship_to_parties || '').replace(/"/g, '""')}"`, `"${(p.witness_notes || '').replace(/"/g, '""')}"`
  ]);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'witness_exported',
      description: `Exported ${witnesses.length} witnesses in ${format.toUpperCase()} format`,
      actor_user_id: user?.id || null,
    }
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function importMatterWitnesses(id, witnessRecords, user) {
  if (!Array.isArray(witnessRecords) || witnessRecords.length === 0) {
    throw Object.assign(new Error('No witness records provided for import'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (let i = 0; i < witnessRecords.length; i++) {
    const rec = witnessRecords[i];
    const name = (rec.full_name || rec.name || '').trim();

    if (!name) {
      errors.push(`Record #${i + 1}: Missing witness name`);
      skippedCount++;
      continue;
    }

    const existingIdx = parties.findIndex(p =>
      (p.full_name || '').trim().toLowerCase() === name.toLowerCase() &&
      (p.party_roles || [p.party_role]).includes('Witness')
    );

    const witnessProfile = {
      witness_type: rec.witness_type || 'Bystander',
      statement_status: rec.statement_status || 'Pending',
      vantage_point: rec.vantage_point || '',
      statement_date: rec.statement_date || '',
      reliability: rec.reliability || 'Unknown',
      relationship_to_parties: rec.relationship_to_parties || '',
      witness_notes: rec.witness_notes || rec.notes || ''
    };

    if (existingIdx !== -1) {
      const p = parties[existingIdx];
      p.role_data = { ...(p.role_data || {}), Witness: { ...(p.role_data?.Witness || {}), ...witnessProfile } };
      p.witness_profile = p.role_data.Witness;
      parties[existingIdx] = p;
      updatedCount++;
    } else {
      const newParty = {
        id: `party_imp_wit_${Date.now()}_${i}`,
        full_name: name,
        email: rec.email || '',
        phone: rec.phone || '',
        party_role: 'Witness',
        party_roles: ['Witness'],
        primary_party_role: 'Witness',
        party_type: 'Person',
        role_data: { Witness: witnessProfile },
        witness_profile: witnessProfile
      };
      parties.push(newParty);
      addedCount++;
    }
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'witness_imported',
      description: `Imported witnesses: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    success: true,
    added_count: addedCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    errors
  };
}

// ============================================================
// ENTERPRISE INSURANCE MODULE — matters.service.js
// ============================================================

function normalizeInsuranceProfile(p) {
  const insProfile = p.role_data?.Insurance || p.insurance_profile || {};

  return {
    insurance_type: insProfile.insurance_type || 'Liability',
    company_name: insProfile.company_name || p.company_name || p.full_name || '',
    policy_number: insProfile.policy_number || p.insurance_number || '',
    claim_number: insProfile.claim_number || '',
    adjuster_name: insProfile.adjuster_name || '',
    adjuster_phone: insProfile.adjuster_phone || p.phone || '',
    adjuster_email: insProfile.adjuster_email || p.email || '',
    coverage_limit: insProfile.coverage_limit || '',
    deductible: insProfile.deductible || '',
    claim_status: insProfile.claim_status || 'Open',
    claim_date: insProfile.claim_date || '',
    claim_amount: insProfile.claim_amount || '',
    settlement_offer: insProfile.settlement_offer || '',
    payment_received: insProfile.payment_received || 'No',
    payment_date: insProfile.payment_date || '',
    policy_holder: insProfile.policy_holder || '',
    insured_party: insProfile.insured_party || '',
    assigned_vehicle_id: insProfile.assigned_vehicle_id || '',
    assigned_driver_party_id: insProfile.assigned_driver_party_id || '',
    notes: insProfile.notes || insProfile.insurance_notes || p.notes || ''
  };
}

async function getMatterInsurance(id, query, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];

  let insParties = parties.filter(p => {
    const roles = p.party_roles || [p.party_role];
    return roles.includes('Insurance Company') || roles.includes('Insurance Adjuster') || roles.includes('Insurance');
  });

  insParties = insParties.map(p => {
    const profile = normalizeInsuranceProfile(p);
    const roleData = {
      ...(p.role_data || {}),
      Insurance: profile
    };

    return {
      party_id: p.id,
      full_name: p.full_name || p.company_name || '',
      company_name: profile.company_name,
      email: p.email || profile.adjuster_email || '',
      phone: p.phone || profile.adjuster_phone || '',
      party_type: p.party_type || 'Organization',
      party_roles: p.party_roles || [p.party_role],
      role_data: roleData,
      insurance_profile: profile
    };
  });

  const {
    search, insurance_type, claim_status, company, adjuster, sort = 'company', page = 1, pageSize = 50
  } = query;

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    insParties = insParties.filter(p => {
      const ip = p.role_data.Insurance;
      return (
        p.full_name?.toLowerCase().includes(term) ||
        ip.company_name?.toLowerCase().includes(term) ||
        ip.policy_number?.toLowerCase().includes(term) ||
        ip.claim_number?.toLowerCase().includes(term) ||
        ip.adjuster_name?.toLowerCase().includes(term) ||
        ip.policy_holder?.toLowerCase().includes(term)
      );
    });
  }

  if (insurance_type) insParties = insParties.filter(p => p.role_data.Insurance.insurance_type === insurance_type);
  if (claim_status) insParties = insParties.filter(p => p.role_data.Insurance.claim_status === claim_status);
  if (company) insParties = insParties.filter(p => p.role_data.Insurance.company_name?.toLowerCase().includes(company.toLowerCase()));
  if (adjuster) insParties = insParties.filter(p => p.role_data.Insurance.adjuster_name?.toLowerCase().includes(adjuster.toLowerCase()));

  if (sort === 'company') insParties.sort((a, b) => (a.insurance_profile.company_name || '').localeCompare(b.insurance_profile.company_name || ''));
  else if (sort === 'claim_date') insParties.sort((a, b) => (a.insurance_profile.claim_date || '').localeCompare(b.insurance_profile.claim_date || ''));
  else if (sort === 'status') insParties.sort((a, b) => (a.insurance_profile.claim_status || '').localeCompare(b.insurance_profile.claim_status || ''));
  else if (sort === 'recent') insParties.reverse();

  const rawIns = parties.filter(p => {
    const roles = p.party_roles || [p.party_role];
    return roles.includes('Insurance Company') || roles.includes('Insurance Adjuster') || roles.includes('Insurance');
  });

  let totalClaimed = 0;
  let totalSettlement = 0;
  const statusCounts = { Open: 0, Pending: 0, 'Under Investigation': 0, Approved: 0, Denied: 0, Closed: 0 };

  rawIns.forEach(p => {
    const prof = normalizeInsuranceProfile(p);
    const cAmt = parseFloat(prof.claim_amount) || 0;
    const sAmt = parseFloat(prof.settlement_offer) || 0;
    totalClaimed += cAmt;
    totalSettlement += sAmt;
    if (statusCounts[prof.claim_status] !== undefined) {
      statusCounts[prof.claim_status]++;
    }
  });

  const counts = {
    total_claims: rawIns.length,
    open_claims: statusCounts.Open + statusCounts['Under Investigation'] + statusCounts.Pending,
    closed_claims: statusCounts.Closed,
    approved_claims: statusCounts.Approved,
    denied_claims: statusCounts.Denied,
    pending_claims: statusCounts.Pending,
    status_counts: statusCounts,
    total_claimed_amount: totalClaimed,
    total_settlement_amount: totalSettlement
  };

  const pNum = Math.max(1, parseInt(page, 10) || 1);
  const pSize = Math.max(1, Math.min(parseInt(pageSize, 10) || 50, 1000));
  const total = insParties.length;
  const totalPages = Math.ceil(total / pSize);

  return {
    insurance_records: insParties.slice((pNum - 1) * pSize, pNum * pSize),
    total,
    page: pNum,
    pageSize: pSize,
    totalPages,
    summary: counts
  };
}

async function updateInsuranceProfile(id, partyId, profileData, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
  if (idx === -1) throw Object.assign(new Error('Insurance party not found'), { statusCode: 404 });

  const party = parties[idx];
  const existingProfile = normalizeInsuranceProfile(party);
  const updatedProfile = {
    ...existingProfile,
    ...profileData
  };

  // Validation
  if (updatedProfile.settlement_offer && updatedProfile.claim_amount) {
    if (parseFloat(updatedProfile.settlement_offer) > parseFloat(updatedProfile.claim_amount)) {
      throw Object.assign(new Error('Settlement offer cannot exceed claim amount'), { statusCode: 400 });
    }
  }

  party.role_data = {
    ...(party.role_data || {}),
    Insurance: updatedProfile
  };
  party.insurance_profile = updatedProfile;
  parties[idx] = party;

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'insurance_profile_updated',
      description: `Insurance profile updated for ${updatedProfile.company_name || party.full_name} (${updatedProfile.claim_status})`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    party_id: party.id,
    company_name: updatedProfile.company_name,
    insurance_profile: updatedProfile
  };
}

async function bulkUpdateInsurance(id, payload, user) {
  const { action, party_ids, data } = payload;
  if (!Array.isArray(party_ids) || party_ids.length === 0) {
    throw Object.assign(new Error('No insurance party_ids provided for bulk update'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let updatedCount = 0;

  for (const partyId of party_ids) {
    const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
    if (idx === -1) continue;
    const p = parties[idx];

    const existingProfile = normalizeInsuranceProfile(p);
    let newProfile = { ...existingProfile };

    if (action === 'bulk_update_status' && data?.claim_status) {
      newProfile.claim_status = data.claim_status;
    } else if (action === 'bulk_delete_profile') {
      if (p.role_data) delete p.role_data.Insurance;
      delete p.insurance_profile;
      updatedCount++;
      continue;
    }

    p.role_data = { ...(p.role_data || {}), Insurance: newProfile };
    p.insurance_profile = newProfile;
    parties[idx] = p;
    updatedCount++;
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'insurance_bulk_updated',
      description: `Bulk operation "${action}" completed for ${updatedCount} insurance records`,
      actor_user_id: user?.id || null,
    }
  });

  return { success: true, action, updated_count: updatedCount };
}

async function exportMatterInsurance(id, format = 'csv', user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  const records = parties.filter(p => {
    const roles = p.party_roles || [p.party_role];
    return roles.includes('Insurance Company') || roles.includes('Insurance Adjuster') || roles.includes('Insurance');
  }).map(p => ({
    party_id: p.id,
    full_name: p.full_name || p.company_name || '',
    ...normalizeInsuranceProfile(p)
  }));

  if (format === 'json') return records;

  const headers = ['Party ID', 'Company Name', 'Insurance Type', 'Policy Holder', 'Policy Number', 'Claim Number', 'Claim Status', 'Claim Date', 'Claim Amount', 'Adjuster Name', 'Adjuster Phone', 'Adjuster Email', 'Coverage Limit', 'Deductible', 'Settlement Offer', 'Payment Received', 'Notes'];
  const rows = records.map(p => [
    `"${p.party_id || ''}"`, `"${(p.company_name || '').replace(/"/g, '""')}"`, `"${p.insurance_type || ''}"`, `"${(p.policy_holder || '').replace(/"/g, '""')}"`,
    `"${p.policy_number || ''}"`, `"${p.claim_number || ''}"`, `"${p.claim_status || ''}"`, `"${p.claim_date || ''}"`,
    `"${p.claim_amount || ''}"`, `"${(p.adjuster_name || '').replace(/"/g, '""')}"`, `"${p.adjuster_phone || ''}"`, `"${p.adjuster_email || ''}"`,
    `"${p.coverage_limit || ''}"`, `"${p.deductible || ''}"`, `"${p.settlement_offer || ''}"`, `"${p.payment_received || ''}"`, `"${(p.notes || '').replace(/"/g, '""')}"`
  ]);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'insurance_exported',
      description: `Exported ${records.length} insurance records in ${format.toUpperCase()} format`,
      actor_user_id: user?.id || null,
    }
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function importMatterInsurance(id, insuranceRecords, user) {
  if (!Array.isArray(insuranceRecords) || insuranceRecords.length === 0) {
    throw Object.assign(new Error('No insurance records provided for import'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (let i = 0; i < insuranceRecords.length; i++) {
    const rec = insuranceRecords[i];
    const companyName = (rec.company_name || rec.company || rec.full_name || '').trim();

    if (!companyName) {
      errors.push(`Record #${i + 1}: Missing insurance company name`);
      skippedCount++;
      continue;
    }

    const existingIdx = parties.findIndex(p => {
      const pComp = (p.role_data?.Insurance?.company_name || p.company_name || p.full_name || '').trim().toLowerCase();
      const pPol = (p.role_data?.Insurance?.policy_number || p.policy_number || '').trim();
      return pComp === companyName.toLowerCase() || (rec.policy_number && pPol && pPol === rec.policy_number);
    });

    const insProfile = {
      insurance_type: rec.insurance_type || 'Liability',
      company_name: companyName,
      policy_number: rec.policy_number || '',
      claim_number: rec.claim_number || '',
      adjuster_name: rec.adjuster_name || '',
      adjuster_phone: rec.adjuster_phone || rec.phone || '',
      adjuster_email: rec.adjuster_email || rec.email || '',
      coverage_limit: rec.coverage_limit || '',
      deductible: rec.deductible || '',
      claim_status: rec.claim_status || 'Open',
      claim_date: rec.claim_date || '',
      claim_amount: rec.claim_amount || '',
      settlement_offer: rec.settlement_offer || '',
      payment_received: rec.payment_received || 'No',
      payment_date: rec.payment_date || '',
      policy_holder: rec.policy_holder || '',
      notes: rec.notes || rec.insurance_notes || ''
    };

    if (existingIdx !== -1) {
      const p = parties[existingIdx];
      p.role_data = { ...(p.role_data || {}), Insurance: { ...(p.role_data?.Insurance || {}), ...insProfile } };
      p.insurance_profile = p.role_data.Insurance;
      parties[existingIdx] = p;
      updatedCount++;
    } else {
      const newParty = {
        id: `party_imp_ins_${Date.now()}_${i}`,
        full_name: companyName,
        company_name: companyName,
        email: rec.adjuster_email || rec.email || '',
        phone: rec.adjuster_phone || rec.phone || '',
        party_role: 'Insurance Company',
        party_roles: ['Insurance Company'],
        primary_party_role: 'Insurance Company',
        party_type: 'Organization',
        role_data: { Insurance: insProfile },
        insurance_profile: insProfile
      };
      parties.push(newParty);
      addedCount++;
    }
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'insurance_imported',
      description: `Imported insurance records: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    success: true,
    added_count: addedCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    errors
  };
}

// ============================================================
// ENTERPRISE MEDICAL PROVIDER MODULE — matters.service.js
// ============================================================

function normalizeMedicalProviderProfile(p) {
  const mp = p.role_data?.MedicalProvider || p.medical_provider_profile || {};

  const est = parseFloat(mp.estimated_medical_cost || p.total_bill) || 0;
  const paid = parseFloat(mp.paid_amount) || 0;
  const bal = est - paid;

  return {
    provider_type: mp.provider_type || 'Doctor',
    provider_name: mp.provider_name || p.full_name || p.company_name || '',
    facility_name: mp.facility_name || p.company_name || '',
    license_number: mp.license_number || '',
    specialization: mp.specialization || p.medical_specialty || '',
    phone: mp.phone || p.phone || '',
    email: mp.email || p.email || '',
    website: mp.website || p.website || '',
    address: mp.address || p.address || '',
    city: mp.city || '',
    state: mp.state || '',
    zip_code: mp.zip_code || '',
    contact_person: mp.contact_person || p.contact_person || '',
    patient_name: mp.patient_name || '',
    patient_party_id: mp.patient_party_id || '',
    assigned_driver_party_id: mp.assigned_driver_party_id || '',
    assigned_passenger_party_id: mp.assigned_passenger_party_id || '',
    date_of_first_visit: mp.date_of_first_visit || '',
    date_of_last_visit: mp.date_of_last_visit || '',
    diagnosis: mp.diagnosis || '',
    treatment_status: mp.treatment_status || 'Active',
    follow_up_required: mp.follow_up_required || 'No',
    follow_up_date: mp.follow_up_date || '',
    estimated_medical_cost: est.toFixed(2),
    paid_amount: paid.toFixed(2),
    balance_amount: bal.toFixed(2),
    insurance_claim_number: mp.insurance_claim_number || '',
    notes: mp.notes || mp.medical_notes || p.notes || ''
  };
}

async function getMatterMedicalProviders(id, query, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];

  let medParties = parties.filter(p => (p.party_roles || [p.party_role]).includes('Medical Provider'));

  medParties = medParties.map(p => {
    const profile = normalizeMedicalProviderProfile(p);
    const roleData = {
      ...(p.role_data || {}),
      MedicalProvider: profile
    };

    return {
      party_id: p.id,
      full_name: profile.provider_name || p.full_name || p.company_name || '',
      facility_name: profile.facility_name,
      email: p.email || profile.email || '',
      phone: p.phone || profile.phone || '',
      party_type: p.party_type || 'Organization',
      party_roles: p.party_roles || [p.party_role],
      role_data: roleData,
      medical_provider_profile: profile
    };
  });

  const {
    search, provider_type, treatment_status, specialization, city, state, sort = 'provider', page = 1, pageSize = 50
  } = query;

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    medParties = medParties.filter(p => {
      const mp = p.role_data.MedicalProvider;
      return (
        p.full_name?.toLowerCase().includes(term) ||
        mp.facility_name?.toLowerCase().includes(term) ||
        mp.patient_name?.toLowerCase().includes(term) ||
        mp.diagnosis?.toLowerCase().includes(term) ||
        mp.specialization?.toLowerCase().includes(term)
      );
    });
  }

  if (provider_type) medParties = medParties.filter(p => p.role_data.MedicalProvider.provider_type === provider_type);
  if (treatment_status) medParties = medParties.filter(p => p.role_data.MedicalProvider.treatment_status === treatment_status);
  if (specialization) medParties = medParties.filter(p => p.role_data.MedicalProvider.specialization?.toLowerCase().includes(specialization.toLowerCase()));
  if (city) medParties = medParties.filter(p => p.role_data.MedicalProvider.city?.toLowerCase().includes(city.toLowerCase()));
  if (state) medParties = medParties.filter(p => p.role_data.MedicalProvider.state?.toLowerCase().includes(state.toLowerCase()));

  if (sort === 'provider') medParties.sort((a, b) => (a.medical_provider_profile.provider_name || '').localeCompare(b.medical_provider_profile.provider_name || ''));
  else if (sort === 'facility') medParties.sort((a, b) => (a.medical_provider_profile.facility_name || '').localeCompare(b.medical_provider_profile.facility_name || ''));
  else if (sort === 'first_visit') medParties.sort((a, b) => (a.medical_provider_profile.date_of_first_visit || '').localeCompare(b.medical_provider_profile.date_of_first_visit || ''));
  else if (sort === 'recent') medParties.reverse();

  const rawMed = parties.filter(p => (p.party_roles || [p.party_role]).includes('Medical Provider'));

  let totalEst = 0;
  let totalPaid = 0;
  let totalBal = 0;
  const statusCounts = { Scheduled: 0, Active: 0, Completed: 0, Cancelled: 0 };

  rawMed.forEach(p => {
    const prof = normalizeMedicalProviderProfile(p);
    const est = parseFloat(prof.estimated_medical_cost) || 0;
    const paid = parseFloat(prof.paid_amount) || 0;
    const bal = parseFloat(prof.balance_amount) || 0;
    totalEst += est;
    totalPaid += paid;
    totalBal += bal;
    if (statusCounts[prof.treatment_status] !== undefined) {
      statusCounts[prof.treatment_status]++;
    }
  });

  const counts = {
    total_providers: rawMed.length,
    active_treatments: statusCounts.Active,
    completed_treatments: statusCounts.Completed,
    scheduled_visits: statusCounts.Scheduled,
    status_counts: statusCounts,
    total_estimated_cost: totalEst,
    total_paid: totalPaid,
    outstanding_balance: totalBal
  };

  const pNum = Math.max(1, parseInt(page, 10) || 1);
  const pSize = Math.max(1, Math.min(parseInt(pageSize, 10) || 50, 1000));
  const total = medParties.length;
  const totalPages = Math.ceil(total / pSize);

  return {
    medical_providers: medParties.slice((pNum - 1) * pSize, pNum * pSize),
    total,
    page: pNum,
    pageSize: pSize,
    totalPages,
    summary: counts
  };
}

async function updateMedicalProviderProfile(id, partyId, profileData, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
  if (idx === -1) throw Object.assign(new Error('Medical provider party not found'), { statusCode: 404 });

  const party = parties[idx];
  const existingProfile = normalizeMedicalProviderProfile(party);
  const updatedProfile = {
    ...existingProfile,
    ...profileData
  };

  const est = parseFloat(updatedProfile.estimated_medical_cost) || 0;
  const paid = parseFloat(updatedProfile.paid_amount) || 0;

  if (paid > est && est > 0) {
    throw Object.assign(new Error('Paid amount cannot exceed estimated medical cost'), { statusCode: 400 });
  }

  updatedProfile.balance_amount = (est - paid).toFixed(2);

  party.role_data = {
    ...(party.role_data || {}),
    MedicalProvider: updatedProfile
  };
  party.medical_provider_profile = updatedProfile;
  parties[idx] = party;

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'medical_provider_updated',
      description: `Medical Provider updated for ${updatedProfile.provider_name} (${updatedProfile.treatment_status})`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    party_id: party.id,
    provider_name: updatedProfile.provider_name,
    medical_provider_profile: updatedProfile
  };
}

async function bulkUpdateMedicalProviders(id, payload, user) {
  const { action, party_ids, data } = payload;
  if (!Array.isArray(party_ids) || party_ids.length === 0) {
    throw Object.assign(new Error('No medical provider party_ids provided for bulk update'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let updatedCount = 0;

  for (const partyId of party_ids) {
    const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
    if (idx === -1) continue;
    const p = parties[idx];

    const existingProfile = normalizeMedicalProviderProfile(p);
    let newProfile = { ...existingProfile };

    if (action === 'bulk_update_status' && data?.treatment_status) {
      newProfile.treatment_status = data.treatment_status;
    } else if (action === 'bulk_delete_profile') {
      if (p.role_data) delete p.role_data.MedicalProvider;
      delete p.medical_provider_profile;
      updatedCount++;
      continue;
    }

    p.role_data = { ...(p.role_data || {}), MedicalProvider: newProfile };
    p.medical_provider_profile = newProfile;
    parties[idx] = p;
    updatedCount++;
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'medical_providers_bulk_updated',
      description: `Bulk operation "${action}" completed for ${updatedCount} medical providers`,
      actor_user_id: user?.id || null,
    }
  });

  return { success: true, action, updated_count: updatedCount };
}

async function exportMatterMedicalProviders(id, format = 'csv', user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  const records = parties.filter(p => (p.party_roles || [p.party_role]).includes('Medical Provider')).map(p => ({
    party_id: p.id,
    full_name: p.full_name || p.company_name || '',
    ...normalizeMedicalProviderProfile(p)
  }));

  if (format === 'json') return records;

  const headers = ['Party ID', 'Provider Name', 'Provider Type', 'Facility Name', 'Specialization', 'Phone', 'Email', 'Patient Name', 'Diagnosis', 'Treatment Status', 'First Visit', 'Last Visit', 'Estimated Cost', 'Paid Amount', 'Balance Amount', 'Claim Number', 'Notes'];
  const rows = records.map(p => [
    `"${p.party_id || ''}"`, `"${(p.provider_name || '').replace(/"/g, '""')}"`, `"${p.provider_type || ''}"`, `"${(p.facility_name || '').replace(/"/g, '""')}"`,
    `"${(p.specialization || '').replace(/"/g, '""')}"`, `"${p.phone || ''}"`, `"${p.email || ''}"`, `"${(p.patient_name || '').replace(/"/g, '""')}"`,
    `"${(p.diagnosis || '').replace(/"/g, '""')}"`, `"${p.treatment_status || ''}"`, `"${p.date_of_first_visit || ''}"`, `"${p.date_of_last_visit || ''}"`,
    `"${p.estimated_medical_cost || ''}"`, `"${p.paid_amount || ''}"`, `"${p.balance_amount || ''}"`, `"${p.insurance_claim_number || ''}"`, `"${(p.notes || '').replace(/"/g, '""')}"`
  ]);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'medical_providers_exported',
      description: `Exported ${records.length} medical providers in ${format.toUpperCase()} format`,
      actor_user_id: user?.id || null,
    }
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function importMatterMedicalProviders(id, records, user) {
  if (!Array.isArray(records) || records.length === 0) {
    throw Object.assign(new Error('No medical provider records provided for import'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const pName = (rec.provider_name || rec.name || rec.full_name || '').trim();

    if (!pName) {
      errors.push(`Record #${i + 1}: Missing provider name`);
      skippedCount++;
      continue;
    }

    const existingIdx = parties.findIndex(p => {
      const existingName = (p.role_data?.MedicalProvider?.provider_name || p.full_name || p.company_name || '').trim().toLowerCase();
      return (p.party_roles || [p.party_role]).includes('Medical Provider') && existingName === pName.toLowerCase();
    });

    const est = parseFloat(rec.estimated_medical_cost) || 0;
    const paid = parseFloat(rec.paid_amount) || 0;

    const medProfile = {
      provider_type: rec.provider_type || 'Doctor',
      provider_name: pName,
      facility_name: rec.facility_name || '',
      license_number: rec.license_number || '',
      specialization: rec.specialization || '',
      phone: rec.phone || '',
      email: rec.email || '',
      website: rec.website || '',
      address: rec.address || '',
      city: rec.city || '',
      state: rec.state || '',
      zip_code: rec.zip_code || '',
      contact_person: rec.contact_person || '',
      patient_name: rec.patient_name || '',
      patient_party_id: rec.patient_party_id || '',
      assigned_driver_party_id: rec.assigned_driver_party_id || '',
      assigned_passenger_party_id: rec.assigned_passenger_party_id || '',
      date_of_first_visit: rec.date_of_first_visit || '',
      date_of_last_visit: rec.date_of_last_visit || '',
      diagnosis: rec.diagnosis || '',
      treatment_status: rec.treatment_status || 'Active',
      follow_up_required: rec.follow_up_required || 'No',
      follow_up_date: rec.follow_up_date || '',
      estimated_medical_cost: est.toFixed(2),
      paid_amount: paid.toFixed(2),
      balance_amount: (est - paid).toFixed(2),
      insurance_claim_number: rec.insurance_claim_number || '',
      notes: rec.notes || rec.medical_notes || ''
    };

    if (existingIdx !== -1) {
      const p = parties[existingIdx];
      p.role_data = { ...(p.role_data || {}), MedicalProvider: { ...(p.role_data?.MedicalProvider || {}), ...medProfile } };
      p.medical_provider_profile = p.role_data.MedicalProvider;
      parties[existingIdx] = p;
      updatedCount++;
    } else {
      const newParty = {
        id: `party_imp_med_${Date.now()}_${i}`,
        full_name: pName,
        company_name: rec.facility_name || pName,
        email: rec.email || '',
        phone: rec.phone || '',
        party_role: 'Medical Provider',
        party_roles: ['Medical Provider'],
        primary_party_role: 'Medical Provider',
        party_type: 'Organization',
        role_data: { MedicalProvider: medProfile },
        medical_provider_profile: medProfile
      };
      parties.push(newParty);
      addedCount++;
    }
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'medical_providers_imported',
      description: `Imported medical providers: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    success: true,
    added_count: addedCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    errors
  };
}

// ============================================================
// ENTERPRISE EMPLOYER MODULE — matters.service.js
// ============================================================

function normalizeEmployerProfile(p) {
  const ep = p.role_data?.Employer || p.employer_profile || {};

  const lw = parseFloat(ep.lost_wages) || 0;

  return {
    employer_name: ep.employer_name || p.company_name || p.full_name || '',
    employer_type: ep.employer_type || 'Corporation',
    occupation: ep.occupation || '',
    employment_status: ep.employment_status || 'Full Time',
    employer_phone: ep.employer_phone || p.phone || '',
    employer_email: ep.employer_email || p.email || '',
    employer_address: ep.employer_address || p.address || '',
    supervisor_name: ep.supervisor_name || '',
    date_hired: ep.date_hired || '',
    last_working_date: ep.last_working_date || '',
    currently_working: ep.currently_working || 'Yes',
    work_restrictions: ep.work_restrictions || 'No',
    return_to_work_date: ep.return_to_work_date || '',
    lost_wages: lw >= 0 ? lw.toFixed(2) : '0.00',
    lost_wage_notes: ep.lost_wage_notes || '',
    employer_notes: ep.employer_notes || ep.notes || p.notes || '',
    assigned_driver_party_id: ep.assigned_driver_party_id || '',
    assigned_passenger_party_id: ep.assigned_passenger_party_id || ''
  };
}

async function getMatterEmployers(id, query, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];

  let empParties = parties.filter(p => (p.party_roles || [p.party_role]).includes('Employer'));

  empParties = empParties.map(p => {
    const profile = normalizeEmployerProfile(p);
    const roleData = {
      ...(p.role_data || {}),
      Employer: profile
    };

    return {
      party_id: p.id,
      full_name: profile.employer_name || p.full_name || p.company_name || '',
      company_name: profile.employer_name,
      email: p.email || profile.employer_email || '',
      phone: p.phone || profile.employer_phone || '',
      party_type: p.party_type || 'Organization',
      party_roles: p.party_roles || [p.party_role],
      role_data: roleData,
      employer_profile: profile
    };
  });

  const {
    search, employment_status, employer_type, currently_working, work_restrictions, sort = 'employer', page = 1, pageSize = 50
  } = query;

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    empParties = empParties.filter(p => {
      const ep = p.role_data.Employer;
      return (
        p.full_name?.toLowerCase().includes(term) ||
        ep.employer_name?.toLowerCase().includes(term) ||
        ep.occupation?.toLowerCase().includes(term) ||
        ep.supervisor_name?.toLowerCase().includes(term) ||
        ep.employer_phone?.toLowerCase().includes(term)
      );
    });
  }

  if (employment_status) empParties = empParties.filter(p => p.role_data.Employer.employment_status === employment_status);
  if (employer_type) empParties = empParties.filter(p => p.role_data.Employer.employer_type === employer_type);
  if (currently_working) empParties = empParties.filter(p => p.role_data.Employer.currently_working === currently_working);
  if (work_restrictions) empParties = empParties.filter(p => p.role_data.Employer.work_restrictions === work_restrictions);

  if (sort === 'employer') empParties.sort((a, b) => (a.employer_profile.employer_name || '').localeCompare(b.employer_profile.employer_name || ''));
  else if (sort === 'occupation') empParties.sort((a, b) => (a.employer_profile.occupation || '').localeCompare(b.employer_profile.occupation || ''));
  else if (sort === 'recent') empParties.reverse();

  const rawEmp = parties.filter(p => (p.party_roles || [p.party_role]).includes('Employer'));

  let totalLostWages = 0;
  let workingCount = 0;
  let notWorkingCount = 0;
  let restrictedCount = 0;
  let returnPendingCount = 0;

  rawEmp.forEach(p => {
    const prof = normalizeEmployerProfile(p);
    const lw = parseFloat(prof.lost_wages) || 0;
    totalLostWages += lw;

    if (prof.currently_working === 'Yes') workingCount++;
    else notWorkingCount++;

    if (prof.work_restrictions === 'Yes') restrictedCount++;
    if (prof.return_to_work_date && prof.currently_working === 'No') returnPendingCount++;
  });

  const counts = {
    total_employers: rawEmp.length,
    working: workingCount,
    not_working: notWorkingCount,
    restricted_duty: restrictedCount,
    return_to_work_pending: returnPendingCount,
    total_lost_wages: totalLostWages
  };

  const pNum = Math.max(1, parseInt(page, 10) || 1);
  const pSize = Math.max(1, Math.min(parseInt(pageSize, 10) || 50, 1000));
  const total = empParties.length;
  const totalPages = Math.ceil(total / pSize);

  return {
    employers: empParties.slice((pNum - 1) * pSize, pNum * pSize),
    total,
    page: pNum,
    pageSize: pSize,
    totalPages,
    summary: counts
  };
}

async function updateEmployerProfile(id, partyId, profileData, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
  if (idx === -1) throw Object.assign(new Error('Employer party not found'), { statusCode: 404 });

  const party = parties[idx];
  const existingProfile = normalizeEmployerProfile(party);
  const updatedProfile = {
    ...existingProfile,
    ...profileData
  };

  // Validations
  if (updatedProfile.lost_wages && parseFloat(updatedProfile.lost_wages) < 0) {
    throw Object.assign(new Error('Lost wages cannot be negative'), { statusCode: 400 });
  }

  if (updatedProfile.return_to_work_date && updatedProfile.last_working_date) {
    if (new Date(updatedProfile.return_to_work_date) <= new Date(updatedProfile.last_working_date)) {
      throw Object.assign(new Error('Return to work date must be after last working date'), { statusCode: 400 });
    }
  }

  party.role_data = {
    ...(party.role_data || {}),
    Employer: updatedProfile
  };
  party.employer_profile = updatedProfile;
  parties[idx] = party;

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'employer_updated',
      description: `Employer profile updated for ${updatedProfile.employer_name} (${updatedProfile.employment_status})`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    party_id: party.id,
    employer_name: updatedProfile.employer_name,
    employer_profile: updatedProfile
  };
}

async function bulkUpdateEmployers(id, payload, user) {
  const { action, party_ids, data } = payload;
  if (!Array.isArray(party_ids) || party_ids.length === 0) {
    throw Object.assign(new Error('No employer party_ids provided for bulk update'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let updatedCount = 0;

  for (const partyId of party_ids) {
    const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
    if (idx === -1) continue;
    const p = parties[idx];

    const existingProfile = normalizeEmployerProfile(p);
    let newProfile = { ...existingProfile };

    if (action === 'bulk_update_status' && data?.employment_status) {
      newProfile.employment_status = data.employment_status;
    } else if (action === 'bulk_delete_profile') {
      if (p.role_data) delete p.role_data.Employer;
      delete p.employer_profile;
      updatedCount++;
      continue;
    }

    p.role_data = { ...(p.role_data || {}), Employer: newProfile };
    p.employer_profile = newProfile;
    parties[idx] = p;
    updatedCount++;
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'employers_bulk_updated',
      description: `Bulk operation "${action}" completed for ${updatedCount} employers`,
      actor_user_id: user?.id || null,
    }
  });

  return { success: true, action, updated_count: updatedCount };
}

async function exportMatterEmployers(id, format = 'csv', user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  const records = parties.filter(p => (p.party_roles || [p.party_role]).includes('Employer')).map(p => ({
    party_id: p.id,
    full_name: p.full_name || p.company_name || '',
    ...normalizeEmployerProfile(p)
  }));

  if (format === 'json') return records;

  const headers = ['Party ID', 'Employer Name', 'Employer Type', 'Occupation', 'Employment Status', 'Phone', 'Email', 'Supervisor Name', 'Date Hired', 'Last Working Date', 'Currently Working', 'Work Restrictions', 'Return To Work Date', 'Lost Wages', 'Notes'];
  const rows = records.map(p => [
    `"${p.party_id || ''}"`, `"${(p.employer_name || '').replace(/"/g, '""')}"`, `"${p.employer_type || ''}"`, `"${(p.occupation || '').replace(/"/g, '""')}"`,
    `"${p.employment_status || ''}"`, `"${p.employer_phone || ''}"`, `"${p.employer_email || ''}"`, `"${(p.supervisor_name || '').replace(/"/g, '""')}"`,
    `"${p.date_hired || ''}"`, `"${p.last_working_date || ''}"`, `"${p.currently_working || ''}"`, `"${p.work_restrictions || ''}"`,
    `"${p.return_to_work_date || ''}"`, `"${p.lost_wages || ''}"`, `"${(p.employer_notes || '').replace(/"/g, '""')}"`
  ]);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'employers_exported',
      description: `Exported ${records.length} employers in ${format.toUpperCase()} format`,
      actor_user_id: user?.id || null,
    }
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function importMatterEmployers(id, records, user) {
  if (!Array.isArray(records) || records.length === 0) {
    throw Object.assign(new Error('No employer records provided for import'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const empName = (rec.employer_name || rec.company_name || rec.name || rec.full_name || '').trim();

    if (!empName) {
      errors.push(`Record #${i + 1}: Missing employer name`);
      skippedCount++;
      continue;
    }

    const existingIdx = parties.findIndex(p => {
      const existingName = (p.role_data?.Employer?.employer_name || p.company_name || p.full_name || '').trim().toLowerCase();
      return (p.party_roles || [p.party_role]).includes('Employer') && existingName === empName.toLowerCase();
    });

    const empProfile = {
      employer_name: empName,
      employer_type: rec.employer_type || 'Corporation',
      occupation: rec.occupation || '',
      employment_status: rec.employment_status || 'Full Time',
      employer_phone: rec.employer_phone || rec.phone || '',
      employer_email: rec.employer_email || rec.email || '',
      employer_address: rec.employer_address || rec.address || '',
      supervisor_name: rec.supervisor_name || '',
      date_hired: rec.date_hired || '',
      last_working_date: rec.last_working_date || '',
      currently_working: rec.currently_working || 'Yes',
      work_restrictions: rec.work_restrictions || 'No',
      return_to_work_date: rec.return_to_work_date || '',
      lost_wages: rec.lost_wages || '0.00',
      lost_wage_notes: rec.lost_wage_notes || '',
      employer_notes: rec.employer_notes || rec.notes || ''
    };

    if (existingIdx !== -1) {
      const p = parties[existingIdx];
      p.role_data = { ...(p.role_data || {}), Employer: { ...(p.role_data?.Employer || {}), ...empProfile } };
      p.employer_profile = p.role_data.Employer;
      parties[existingIdx] = p;
      updatedCount++;
    } else {
      const newParty = {
        id: `party_imp_emp_${Date.now()}_${i}`,
        full_name: empName,
        company_name: empName,
        email: rec.employer_email || rec.email || '',
        phone: rec.employer_phone || rec.phone || '',
        party_role: 'Employer',
        party_roles: ['Employer'],
        primary_party_role: 'Employer',
        party_type: 'Organization',
        role_data: { Employer: empProfile },
        employer_profile: empProfile
      };
      parties.push(newParty);
      addedCount++;
    }
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'employers_imported',
      description: `Imported employers: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    success: true,
    added_count: addedCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    errors
  };
}

// ============================================================
// ENTERPRISE PROPERTY DAMAGE MODULE — matters.service.js
// ============================================================

function normalizePropertyDamageProfile(p) {
  const pd = p.role_data?.PropertyDamage || p.property_damage_profile || {};

  const est = parseFloat(pd.estimated_repair_cost) || 0;
  const act = parseFloat(pd.actual_repair_cost) || 0;

  return {
    property_type: pd.property_type || 'Vehicle',
    owner_name: pd.owner_name || p.full_name || p.company_name || '',
    owner_contact: pd.owner_contact || p.phone || p.email || '',
    damage_description: pd.damage_description || '',
    damage_severity: pd.damage_severity || 'Minor',
    repair_status: pd.repair_status || 'Not Started',
    repair_shop: pd.repair_shop || '',
    estimated_repair_cost: est.toFixed(2),
    actual_repair_cost: act.toFixed(2),
    insurance_claim_number: pd.insurance_claim_number || '',
    assigned_vehicle_id: pd.assigned_vehicle_id || '',
    assigned_insurance_party_id: pd.assigned_insurance_party_id || '',
    notes: pd.notes || pd.property_notes || p.notes || ''
  };
}

async function getMatterPropertyDamage(id, query, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];

  let pdParties = parties.filter(p => {
    const roles = p.party_roles || [p.party_role];
    return roles.includes('Property Damage') || roles.includes('Property Owner');
  });

  pdParties = pdParties.map(p => {
    const profile = normalizePropertyDamageProfile(p);
    const roleData = {
      ...(p.role_data || {}),
      PropertyDamage: profile
    };

    return {
      party_id: p.id,
      full_name: profile.owner_name || p.full_name || p.company_name || '',
      owner_name: profile.owner_name,
      email: p.email || '',
      phone: p.phone || profile.owner_contact || '',
      party_type: p.party_type || 'Person',
      party_roles: p.party_roles || [p.party_role],
      role_data: roleData,
      property_damage_profile: profile
    };
  });

  const {
    search, damage_severity, repair_status, property_type, sort = 'owner', page = 1, pageSize = 50
  } = query;

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    pdParties = pdParties.filter(p => {
      const pd = p.role_data.PropertyDamage;
      return (
        p.full_name?.toLowerCase().includes(term) ||
        pd.owner_name?.toLowerCase().includes(term) ||
        pd.repair_shop?.toLowerCase().includes(term) ||
        pd.insurance_claim_number?.toLowerCase().includes(term) ||
        pd.damage_description?.toLowerCase().includes(term)
      );
    });
  }

  if (damage_severity) pdParties = pdParties.filter(p => p.role_data.PropertyDamage.damage_severity === damage_severity);
  if (repair_status) pdParties = pdParties.filter(p => p.role_data.PropertyDamage.repair_status === repair_status);
  if (property_type) pdParties = pdParties.filter(p => p.role_data.PropertyDamage.property_type === property_type);

  if (sort === 'owner') pdParties.sort((a, b) => (a.property_damage_profile.owner_name || '').localeCompare(b.property_damage_profile.owner_name || ''));
  else if (sort === 'repair_cost') pdParties.sort((a, b) => (parseFloat(b.property_damage_profile.estimated_repair_cost) || 0) - (parseFloat(a.property_damage_profile.estimated_repair_cost) || 0));
  else if (sort === 'severity') pdParties.sort((a, b) => (a.property_damage_profile.damage_severity || '').localeCompare(b.property_damage_profile.damage_severity || ''));
  else if (sort === 'recent') pdParties.reverse();

  const rawPd = parties.filter(p => {
    const roles = p.party_roles || [p.party_role];
    return roles.includes('Property Damage') || roles.includes('Property Owner');
  });

  let totalEstCost = 0;
  let totalActCost = 0;
  const severityCounts = { Minor: 0, Moderate: 0, Major: 0, 'Total Loss': 0 };
  const statusCounts = { 'Not Started': 0, 'Estimate Pending': 0, 'In Progress': 0, Completed: 0 };

  rawPd.forEach(p => {
    const prof = normalizePropertyDamageProfile(p);
    const est = parseFloat(prof.estimated_repair_cost) || 0;
    const act = parseFloat(prof.actual_repair_cost) || 0;
    totalEstCost += est;
    totalActCost += act;

    if (severityCounts[prof.damage_severity] !== undefined) severityCounts[prof.damage_severity]++;
    if (statusCounts[prof.repair_status] !== undefined) statusCounts[prof.repair_status]++;
  });

  const counts = {
    total_records: rawPd.length,
    severity_counts: severityCounts,
    status_counts: statusCounts,
    total_estimated_repair_cost: totalEstCost,
    total_actual_repair_cost: totalActCost
  };

  const pNum = Math.max(1, parseInt(page, 10) || 1);
  const pSize = Math.max(1, Math.min(parseInt(pageSize, 10) || 50, 1000));
  const total = pdParties.length;
  const totalPages = Math.ceil(total / pSize);

  return {
    property_damage_records: pdParties.slice((pNum - 1) * pSize, pNum * pSize),
    total,
    page: pNum,
    pageSize: pSize,
    totalPages,
    summary: counts
  };
}

async function updatePropertyDamageProfile(id, partyId, profileData, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
  if (idx === -1) throw Object.assign(new Error('Property damage party not found'), { statusCode: 404 });

  const party = parties[idx];
  const existingProfile = normalizePropertyDamageProfile(party);
  const updatedProfile = {
    ...existingProfile,
    ...profileData
  };

  const est = parseFloat(updatedProfile.estimated_repair_cost) || 0;
  const act = parseFloat(updatedProfile.actual_repair_cost) || 0;

  if (act > est && est > 0 && !profileData.allow_cost_override) {
    throw Object.assign(new Error('Actual repair cost cannot exceed estimated repair cost unless overridden'), { statusCode: 400 });
  }

  party.role_data = {
    ...(party.role_data || {}),
    PropertyDamage: updatedProfile
  };
  party.property_damage_profile = updatedProfile;
  parties[idx] = party;

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'property_damage_updated',
      description: `Property damage updated for ${updatedProfile.owner_name} (${updatedProfile.damage_severity})`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    party_id: party.id,
    owner_name: updatedProfile.owner_name,
    property_damage_profile: updatedProfile
  };
}

async function bulkUpdatePropertyDamage(id, payload, user) {
  const { action, party_ids, data } = payload;
  if (!Array.isArray(party_ids) || party_ids.length === 0) {
    throw Object.assign(new Error('No property damage party_ids provided for bulk update'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let updatedCount = 0;

  for (const partyId of party_ids) {
    const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
    if (idx === -1) continue;
    const p = parties[idx];

    const existingProfile = normalizePropertyDamageProfile(p);
    let newProfile = { ...existingProfile };

    if (action === 'bulk_update_status' && data?.repair_status) {
      newProfile.repair_status = data.repair_status;
    } else if (action === 'bulk_delete_profile') {
      if (p.role_data) delete p.role_data.PropertyDamage;
      delete p.property_damage_profile;
      updatedCount++;
      continue;
    }

    p.role_data = { ...(p.role_data || {}), PropertyDamage: newProfile };
    p.property_damage_profile = newProfile;
    parties[idx] = p;
    updatedCount++;
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'property_damage_bulk_updated',
      description: `Bulk operation "${action}" completed for ${updatedCount} property damage records`,
      actor_user_id: user?.id || null,
    }
  });

  return { success: true, action, updated_count: updatedCount };
}

async function exportMatterPropertyDamage(id, format = 'csv', user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  const records = parties.filter(p => {
    const roles = p.party_roles || [p.party_role];
    return roles.includes('Property Damage') || roles.includes('Property Owner');
  }).map(p => ({
    party_id: p.id,
    full_name: p.full_name || p.company_name || '',
    ...normalizePropertyDamageProfile(p)
  }));

  if (format === 'json') return records;

  const headers = ['Party ID', 'Owner Name', 'Property Type', 'Owner Contact', 'Damage Severity', 'Damage Description', 'Repair Status', 'Repair Shop', 'Estimated Repair Cost', 'Actual Repair Cost', 'Claim Number', 'Notes'];
  const rows = records.map(p => [
    `"${p.party_id || ''}"`, `"${(p.owner_name || '').replace(/"/g, '""')}"`, `"${p.property_type || ''}"`, `"${(p.owner_contact || '').replace(/"/g, '""')}"`,
    `"${p.damage_severity || ''}"`, `"${(p.damage_description || '').replace(/"/g, '""')}"`, `"${p.repair_status || ''}"`, `"${(p.repair_shop || '').replace(/"/g, '""')}"`,
    `"${p.estimated_repair_cost || ''}"`, `"${p.actual_repair_cost || ''}"`, `"${p.insurance_claim_number || ''}"`, `"${(p.notes || '').replace(/"/g, '""')}"`
  ]);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'property_damage_exported',
      description: `Exported ${records.length} property damage records in ${format.toUpperCase()} format`,
      actor_user_id: user?.id || null,
    }
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function importMatterPropertyDamage(id, records, user) {
  if (!Array.isArray(records) || records.length === 0) {
    throw Object.assign(new Error('No property damage records provided for import'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const ownerName = (rec.owner_name || rec.name || rec.full_name || '').trim();

    if (!ownerName) {
      errors.push(`Record #${i + 1}: Missing owner name`);
      skippedCount++;
      continue;
    }

    const existingIdx = parties.findIndex(p => {
      const existingName = (p.role_data?.PropertyDamage?.owner_name || p.full_name || p.company_name || '').trim().toLowerCase();
      const roles = p.party_roles || [p.party_role];
      return (roles.includes('Property Damage') || roles.includes('Property Owner')) && existingName === ownerName.toLowerCase();
    });

    const est = parseFloat(rec.estimated_repair_cost) || 0;
    const act = parseFloat(rec.actual_repair_cost) || 0;

    const pdProfile = {
      property_type: rec.property_type || 'Vehicle',
      owner_name: ownerName,
      owner_contact: rec.owner_contact || rec.phone || rec.email || '',
      damage_description: rec.damage_description || '',
      damage_severity: rec.damage_severity || 'Minor',
      repair_status: rec.repair_status || 'Not Started',
      repair_shop: rec.repair_shop || '',
      estimated_repair_cost: est.toFixed(2),
      actual_repair_cost: act.toFixed(2),
      insurance_claim_number: rec.insurance_claim_number || '',
      assigned_vehicle_id: rec.assigned_vehicle_id || '',
      assigned_insurance_party_id: rec.assigned_insurance_party_id || '',
      notes: rec.notes || rec.property_notes || ''
    };

    if (existingIdx !== -1) {
      const p = parties[existingIdx];
      p.role_data = { ...(p.role_data || {}), PropertyDamage: { ...(p.role_data?.PropertyDamage || {}), ...pdProfile } };
      p.property_damage_profile = p.role_data.PropertyDamage;
      parties[existingIdx] = p;
      updatedCount++;
    } else {
      const newParty = {
        id: `party_imp_pd_${Date.now()}_${i}`,
        full_name: ownerName,
        company_name: ownerName,
        email: rec.email || '',
        phone: rec.phone || rec.owner_contact || '',
        party_role: 'Property Damage',
        party_roles: ['Property Damage'],
        primary_party_role: 'Property Damage',
        party_type: 'Person',
        role_data: { PropertyDamage: pdProfile },
        property_damage_profile: pdProfile
      };
      parties.push(newParty);
      addedCount++;
    }
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'property_damage_imported',
      description: `Imported property damage records: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    success: true,
    added_count: addedCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    errors
  };
}

// ============================================================
// ENTERPRISE POLICE & INVESTIGATION MODULE — matters.service.js
// ============================================================

function normalizePoliceProfile(p) {
  const pol = p.role_data?.Police || p.police_profile || {};

  return {
    report_number: pol.report_number || '',
    case_number: pol.case_number || '',
    report_date: pol.report_date || '',
    reporting_agency: pol.reporting_agency || p.company_name || p.full_name || '',
    officer_name: pol.officer_name || p.full_name || '',
    badge_number: pol.badge_number || '',
    department: pol.department || '',
    officer_phone: pol.officer_phone || p.phone || '',
    officer_email: pol.officer_email || p.email || '',
    investigation_status: pol.investigation_status || 'Open',
    citation_issued: pol.citation_issued || 'No',
    citation_number: pol.citation_number || '',
    assigned_vehicle_id: pol.assigned_vehicle_id || '',
    assigned_driver_party_id: pol.assigned_driver_party_id || '',
    assigned_witness_party_id: pol.assigned_witness_party_id || '',
    photos_available: pol.photos_available || 'No',
    body_camera: pol.body_camera || 'No',
    dash_camera: pol.dash_camera || 'No',
    evidence_collected: pol.evidence_collected || '',
    police_notes: pol.police_notes || pol.notes || p.notes || ''
  };
}

async function getMatterPolice(id, query, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];

  let polParties = parties.filter(p => {
    const roles = p.party_roles || [p.party_role];
    return roles.includes('Police') || roles.includes('Police Officer') || roles.includes('Investigating Agency');
  });

  polParties = polParties.map(p => {
    const profile = normalizePoliceProfile(p);
    const roleData = {
      ...(p.role_data || {}),
      Police: profile
    };

    return {
      party_id: p.id,
      full_name: profile.officer_name || p.full_name || '',
      officer_name: profile.officer_name,
      reporting_agency: profile.reporting_agency,
      email: p.email || profile.officer_email || '',
      phone: p.phone || profile.officer_phone || '',
      party_type: p.party_type || 'Person',
      party_roles: p.party_roles || [p.party_role],
      role_data: roleData,
      police_profile: profile
    };
  });

  const {
    search, reporting_agency, investigation_status, citation_issued, sort = 'officer', page = 1, pageSize = 50
  } = query;

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    polParties = polParties.filter(p => {
      const pol = p.role_data.Police;
      return (
        p.full_name?.toLowerCase().includes(term) ||
        pol.officer_name?.toLowerCase().includes(term) ||
        pol.report_number?.toLowerCase().includes(term) ||
        pol.reporting_agency?.toLowerCase().includes(term) ||
        pol.citation_number?.toLowerCase().includes(term) ||
        pol.badge_number?.toLowerCase().includes(term)
      );
    });
  }

  if (reporting_agency) polParties = polParties.filter(p => p.role_data.Police.reporting_agency === reporting_agency);
  if (investigation_status) polParties = polParties.filter(p => p.role_data.Police.investigation_status === investigation_status);
  if (citation_issued) polParties = polParties.filter(p => p.role_data.Police.citation_issued === citation_issued);

  if (sort === 'officer') polParties.sort((a, b) => (a.police_profile.officer_name || '').localeCompare(b.police_profile.officer_name || ''));
  else if (sort === 'agency') polParties.sort((a, b) => (a.police_profile.reporting_agency || '').localeCompare(b.police_profile.reporting_agency || ''));
  else if (sort === 'report_date') polParties.sort((a, b) => (a.police_profile.report_date || '').localeCompare(b.police_profile.report_date || ''));
  else if (sort === 'recent') polParties.reverse();

  const rawPol = parties.filter(p => {
    const roles = p.party_roles || [p.party_role];
    return roles.includes('Police') || roles.includes('Police Officer') || roles.includes('Investigating Agency');
  });

  let openInvestigations = 0;
  let closedInvestigations = 0;
  let citationsIssued = 0;
  let evidenceCount = 0;

  rawPol.forEach(p => {
    const prof = normalizePoliceProfile(p);
    if (prof.investigation_status === 'Closed') closedInvestigations++;
    else openInvestigations++;

    if (prof.citation_issued === 'Yes') citationsIssued++;
    if (prof.photos_available === 'Yes' || prof.body_camera === 'Yes' || prof.dash_camera === 'Yes' || prof.evidence_collected) evidenceCount++;
  });

  const counts = {
    total_reports: rawPol.length,
    open_investigations: openInvestigations,
    closed_investigations: closedInvestigations,
    citations_issued: citationsIssued,
    evidence_collected_count: evidenceCount
  };

  const pNum = Math.max(1, parseInt(page, 10) || 1);
  const pSize = Math.max(1, Math.min(parseInt(pageSize, 10) || 50, 1000));
  const total = polParties.length;
  const totalPages = Math.ceil(total / pSize);

  return {
    police_records: polParties.slice((pNum - 1) * pSize, pNum * pSize),
    total,
    page: pNum,
    pageSize: pSize,
    totalPages,
    summary: counts
  };
}

async function updatePoliceProfile(id, partyId, profileData, user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
  if (idx === -1) throw Object.assign(new Error('Police record party not found'), { statusCode: 404 });

  const party = parties[idx];
  const existingProfile = normalizePoliceProfile(party);
  const updatedProfile = {
    ...existingProfile,
    ...profileData
  };

  if (!updatedProfile.report_number || !updatedProfile.report_number.trim()) {
    throw Object.assign(new Error('Report Number is required for Police records'), { statusCode: 400 });
  }
  if (!updatedProfile.officer_name || !updatedProfile.officer_name.trim()) {
    throw Object.assign(new Error('Officer Name is required for Police records'), { statusCode: 400 });
  }
  if (!updatedProfile.reporting_agency || !updatedProfile.reporting_agency.trim()) {
    throw Object.assign(new Error('Reporting Agency is required for Police records'), { statusCode: 400 });
  }
  if (updatedProfile.citation_issued === 'Yes' && (!updatedProfile.citation_number || !updatedProfile.citation_number.trim())) {
    throw Object.assign(new Error('Citation Number is required when Citation Issued is Yes'), { statusCode: 400 });
  }
  if (updatedProfile.report_date) {
    const rDate = new Date(updatedProfile.report_date);
    if (rDate > new Date()) {
      throw Object.assign(new Error('Report Date cannot be in the future'), { statusCode: 400 });
    }
  }

  party.role_data = {
    ...(party.role_data || {}),
    Police: updatedProfile
  };
  party.police_profile = updatedProfile;
  parties[idx] = party;

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'police_profile_updated',
      description: `Police record updated for ${updatedProfile.officer_name} (${updatedProfile.reporting_agency}, Report #${updatedProfile.report_number})`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    party_id: party.id,
    officer_name: updatedProfile.officer_name,
    police_profile: updatedProfile
  };
}

async function bulkUpdatePolice(id, payload, user) {
  const { action, party_ids, data } = payload;
  if (!Array.isArray(party_ids) || party_ids.length === 0) {
    throw Object.assign(new Error('No police party_ids provided for bulk update'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let updatedCount = 0;

  for (const partyId of party_ids) {
    const idx = parties.findIndex(p => p.id === partyId || p.id === String(partyId));
    if (idx === -1) continue;
    const p = parties[idx];

    const existingProfile = normalizePoliceProfile(p);
    let newProfile = { ...existingProfile };

    if (action === 'bulk_update_status' && data?.investigation_status) {
      newProfile.investigation_status = data.investigation_status;
    } else if (action === 'bulk_delete_profile') {
      if (p.role_data) delete p.role_data.Police;
      delete p.police_profile;
      updatedCount++;
      continue;
    }

    p.role_data = { ...(p.role_data || {}), Police: newProfile };
    p.police_profile = newProfile;
    parties[idx] = p;
    updatedCount++;
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'police_bulk_updated',
      description: `Bulk operation "${action}" completed for ${updatedCount} police records`,
      actor_user_id: user?.id || null,
    }
  });

  return { success: true, action, updated_count: updatedCount };
}

async function exportMatterPolice(id, format = 'csv', user) {
  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  const records = parties.filter(p => {
    const roles = p.party_roles || [p.party_role];
    return roles.includes('Police') || roles.includes('Police Officer') || roles.includes('Investigating Agency');
  }).map(p => ({
    party_id: p.id,
    full_name: p.full_name || '',
    ...normalizePoliceProfile(p)
  }));

  if (format === 'json') return records;

  const headers = ['Party ID', 'Report Number', 'Case Number', 'Report Date', 'Agency', 'Officer Name', 'Badge Number', 'Department', 'Phone', 'Status', 'Citation Issued', 'Citation Number', 'Notes'];
  const rows = records.map(p => [
    `"${p.party_id || ''}"`, `"${p.report_number || ''}"`, `"${p.case_number || ''}"`, `"${p.report_date || ''}"`,
    `"${(p.reporting_agency || '').replace(/"/g, '""')}"`, `"${(p.officer_name || '').replace(/"/g, '""')}"`, `"${p.badge_number || ''}"`,
    `"${(p.department || '').replace(/"/g, '""')}"`, `"${p.officer_phone || ''}"`, `"${p.investigation_status || ''}"`,
    `"${p.citation_issued || ''}"`, `"${p.citation_number || ''}"`, `"${(p.police_notes || '').replace(/"/g, '""')}"`
  ]);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'police_exported',
      description: `Exported ${records.length} police records in ${format.toUpperCase()} format`,
      actor_user_id: user?.id || null,
    }
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

async function importMatterPolice(id, records, user) {
  if (!Array.isArray(records) || records.length === 0) {
    throw Object.assign(new Error('No police records provided for import'), { statusCode: 400 });
  }

  const matter = await getById(id, user);
  const parties = Array.isArray(matter.parties_data) ? [...matter.parties_data] : [];

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const reportNum = (rec.report_number || rec.report_num || '').trim();
    const officerName = (rec.officer_name || rec.name || rec.full_name || '').trim();

    if (!reportNum || !officerName) {
      errors.push(`Record #${i + 1}: Missing report number or officer name`);
      skippedCount++;
      continue;
    }

    const existingIdx = parties.findIndex(p => {
      const existingReport = (p.role_data?.Police?.report_number || '').trim().toLowerCase();
      const roles = p.party_roles || [p.party_role];
      return (roles.includes('Police') || roles.includes('Police Officer')) && existingReport === reportNum.toLowerCase();
    });

    const polProfile = {
      report_number: reportNum,
      case_number: rec.case_number || '',
      report_date: rec.report_date || '',
      reporting_agency: rec.reporting_agency || rec.agency || '',
      officer_name: officerName,
      badge_number: rec.badge_number || '',
      department: rec.department || '',
      officer_phone: rec.officer_phone || rec.phone || '',
      officer_email: rec.officer_email || rec.email || '',
      investigation_status: rec.investigation_status || 'Open',
      citation_issued: rec.citation_issued || 'No',
      citation_number: rec.citation_number || '',
      assigned_vehicle_id: rec.assigned_vehicle_id || '',
      assigned_driver_party_id: rec.assigned_driver_party_id || '',
      assigned_witness_party_id: rec.assigned_witness_party_id || '',
      photos_available: rec.photos_available || 'No',
      body_camera: rec.body_camera || 'No',
      dash_camera: rec.dash_camera || 'No',
      evidence_collected: rec.evidence_collected || '',
      police_notes: rec.police_notes || rec.notes || ''
    };

    if (existingIdx !== -1) {
      const p = parties[existingIdx];
      p.role_data = { ...(p.role_data || {}), Police: { ...(p.role_data?.Police || {}), ...polProfile } };
      p.police_profile = p.role_data.Police;
      parties[existingIdx] = p;
      updatedCount++;
    } else {
      const newParty = {
        id: `party_imp_pol_${Date.now()}_${i}`,
        full_name: officerName,
        company_name: rec.reporting_agency || rec.agency || '',
        email: rec.email || rec.officer_email || '',
        phone: rec.phone || rec.officer_phone || '',
        party_role: 'Police',
        party_roles: ['Police'],
        primary_party_role: 'Police',
        party_type: 'Person',
        role_data: { Police: polProfile },
        police_profile: polProfile
      };
      parties.push(newParty);
      addedCount++;
    }
  }

  await update(id, { parties_data: parties }, user);

  await prisma.activity.create({
    data: {
      matter_id: parseInt(id, 10),
      entity_type: 'party',
      entity_id: parseInt(id, 10),
      action: 'police_imported',
      description: `Imported police records: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`,
      actor_user_id: user?.id || null,
    }
  });

  return {
    success: true,
    added_count: addedCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    errors
  };
}
