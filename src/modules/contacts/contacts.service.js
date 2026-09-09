const prisma = require('../../config/db');

/**
 * Calculate linked matters count for a given contact/client ID.
 */
async function getLinkedMattersCount(clientId) {
  if (!clientId) return 0;
  const countAsPrimary = await prisma.matter.count({
    where: { client_id: clientId }
  });

  // Also check matters where client is listed in parties_data JSON
  const allMatters = await prisma.matter.findMany({
    select: { id: true, parties_data: true }
  });

  let countInPartiesData = 0;
  allMatters.forEach(m => {
    if (m.parties_data) {
      try {
        const parties = typeof m.parties_data === 'string' ? JSON.parse(m.parties_data) : m.parties_data;
        if (Array.isArray(parties)) {
          const match = parties.some(p => String(p.client_id) === String(clientId) || String(p.contact_id) === String(clientId));
          if (match) countInPartiesData++;
        }
      } catch (e) { /* ignore */ }
    }
  });

  return countAsPrimary + countInPartiesData;
}

function parseContactNotes(notesStr) {
  if (!notesStr) return { notes: '', is_referral_source: false, referral_category: 'attorney', default_fee_terms: '', driver_license: '', alien_registration_number: '', category_type: 'General', department: '', vendor_service: '' };
  try {
    if (typeof notesStr === 'string' && (notesStr.startsWith('{"__meta":') || notesStr.startsWith('{"text":'))) {
      const parsed = JSON.parse(notesStr);
      return {
        notes: parsed.text || '',
        is_referral_source: !!parsed.__meta?.is_referral_source,
        referral_category: parsed.__meta?.referral_category || 'attorney',
        default_fee_terms: parsed.__meta?.default_fee_terms || '',
        driver_license: parsed.__meta?.driver_license || '',
        alien_registration_number: parsed.__meta?.alien_registration_number || '',
        category_type: parsed.__meta?.category_type || 'General',
        department: parsed.__meta?.department || '',
        vendor_service: parsed.__meta?.vendor_service || ''
      };
    }
  } catch (e) {}
  return { notes: notesStr, is_referral_source: false, referral_category: 'attorney', default_fee_terms: '', driver_license: '', alien_registration_number: '', category_type: 'General', department: '', vendor_service: '' };
}

function serializeContactNotes(rawNotes, meta = {}) {
  const isReferral = meta.is_referral_source !== undefined ? !!meta.is_referral_source : false;
  const category = meta.referral_category || 'attorney';
  const feeTerms = meta.default_fee_terms || '';
  const dl = meta.driver_license || '';
  const aNum = meta.alien_registration_number || '';
  const categoryType = meta.category_type || 'General';
  const department = meta.department || '';
  const vendorService = meta.vendor_service || '';

  return JSON.stringify({
    text: rawNotes || '',
    __meta: {
      is_referral_source: isReferral,
      referral_category: category,
      default_fee_terms: feeTerms,
      driver_license: dl,
      alien_registration_number: aNum,
      category_type: categoryType,
      department: department,
      vendor_service: vendorService
    }
  });
}

function enrichContactData(c, linkedCount = 0) {
  const parsed = parseContactNotes(c.notes);
  return {
    ...c,
    notes: parsed.notes,
    is_referral_source: parsed.is_referral_source,
    referral_category: parsed.referral_category,
    default_fee_terms: parsed.default_fee_terms,
    driver_license: parsed.driver_license,
    alien_registration_number: parsed.alien_registration_number,
    category_type: parsed.category_type,
    department: parsed.department,
    vendor_service: parsed.vendor_service,
    linked_matters_count: linkedCount
  };
}

const getAll = async (query = {}, user) => {
  const { page = 1, limit = 50, q = '', party_type = 'All', is_referral_source } = query;
  const take = parseInt(limit, 10);
  const skip = (parseInt(page) - 1) * take;

  const where = {};

  if (party_type && party_type !== 'All') {
    where.party_type = party_type;
  }

  if (q && q.trim()) {
    const s = q.trim();
    where.OR = [
      { full_name: { contains: s } },
      { email: { contains: s } },
      { phone: { contains: s } },
      { organization_name: { contains: s } }
    ];
  }

  const [rawContacts, total] = await Promise.all([
    prisma.client.findMany({
      where,
      take,
      skip,
      orderBy: { updated_at: 'desc' }
    }),
    prisma.client.count({ where })
  ]);

  let contacts = [];
  for (const c of rawContacts) {
    const linkedCount = await getLinkedMattersCount(c.id);
    contacts.push(enrichContactData(c, linkedCount));
  }

  if (is_referral_source === 'true' || is_referral_source === true) {
    contacts = contacts.filter(c => c.is_referral_source);
  }

  return {
    contacts,
    total,
    page: parseInt(page),
    limit: take,
    total_pages: Math.ceil(total / take)
  };
};

const search = async (q = '', user) => {
  const contacts = await prisma.client.findMany({
    where: {
      OR: [
        { full_name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { organization_name: { contains: q } }
      ]
    },
    take: 20,
    orderBy: { updated_at: 'desc' }
  });

  const enriched = [];
  for (const c of contacts) {
    const linkedCount = await getLinkedMattersCount(c.id);
    enriched.push(enrichContactData(c, linkedCount));
  }
  return enriched;
};

const getById = async (id, user) => {
  const contactId = parseInt(id, 10);
  const c = await prisma.client.findUnique({
    where: { id: contactId }
  });
  if (!c) return null;

  const linkedCount = await getLinkedMattersCount(c.id);
  return enrichContactData(c, linkedCount);
};

const findDuplicateContact = async (data = {}) => {
  const { email, phone, government_id, full_name } = data;

  if (phone && phone.trim()) {
    const match = await prisma.client.findFirst({
      where: { phone: phone.trim() }
    });
    if (match) {
      return {
        duplicate: true,
        matchedField: 'Phone Number',
        message: `Existing contact found with phone number ${phone.trim()}`,
        contact: enrichContactData(match, await getLinkedMattersCount(match.id))
      };
    }
  }

  if (email && email.trim()) {
    const match = await prisma.client.findFirst({
      where: { email: email.trim() }
    });
    if (match) {
      return {
        duplicate: true,
        matchedField: 'Email Address',
        message: `Existing contact found with email ${email.trim()}`,
        contact: enrichContactData(match, await getLinkedMattersCount(match.id))
      };
    }
  }

  return null;
};

const create = async (data, user) => {
  const { full_name, email, phone, party_type = 'Person', organization_name, address_line_1, city, state, postal_code, notes, is_referral_source, referral_category, default_fee_terms, government_id, driver_license, alien_registration_number, category_type, department, vendor_service } = data;

  if (!full_name || !full_name.trim()) {
    const err = new Error('Contact Name is required');
    err.statusCode = 400;
    throw err;
  }

  const cleanName = full_name.trim();
  const cleanEmail = email ? email.trim() : '';
  const cleanPhone = phone ? phone.trim() : '';

  // Duplicate Check Rule
  if (!data.bypass_duplicate) {
    const duplicateMatch = await findDuplicateContact(data);
    if (duplicateMatch) {
      return duplicateMatch;
    }
  }

  const encryptedGovId = government_id ? encryptSensitiveValue(government_id.trim()) : null;

  const serializedNotes = serializeContactNotes(notes, {
    is_referral_source,
    referral_category,
    default_fee_terms,
    driver_license: driver_license ? encryptSensitiveValue(driver_license.trim()) : '',
    alien_registration_number: alien_registration_number ? encryptSensitiveValue(alien_registration_number.trim()) : '',
    category_type: category_type || 'General',
    department: department || '',
    vendor_service: vendor_service || ''
  });

  // Create new contact master entry
  const newContact = await prisma.client.create({
    data: {
      full_name: cleanName,
      email: cleanEmail || `contact_${Date.now()}@vktori.internal`,
      phone: cleanPhone || null,
      party_type: party_type || 'Person',
      organization_name: organization_name || (party_type === 'Organization' ? cleanName : null),
      address_line_1: address_line_1 || null,
      city: city || null,
      state: state || null,
      postal_code: postal_code || null,
      government_id: encryptedGovId,
      notes: serializedNotes
    }
  });

  // Log activity
  await prisma.activity.create({
    data: {
      entity_type: 'contact',
      entity_id: newContact.id,
      action: 'contact_created',
      description: `New contact master entry created: ${newContact.full_name}`,
      actor_user_id: user?.id || null
    }
  });

  return enrichContactData(newContact, 0);
};

const update = async (id, data, user) => {
  const contactId = parseInt(id, 10);
  const existing = await prisma.client.findUnique({ where: { id: contactId } });
  if (!existing) {
    const err = new Error('Contact not found');
    err.statusCode = 404;
    throw err;
  }

  const { full_name, email, phone, party_type, organization_name, address_line_1, city, state, postal_code, notes, is_referral_source, referral_category, default_fee_terms, government_id, driver_license, alien_registration_number, category_type, department, vendor_service } = data;

  const existingMeta = parseContactNotes(existing.notes);

  const updateData = {};
  if (full_name !== undefined) updateData.full_name = full_name.trim();
  if (email !== undefined) updateData.email = email.trim();
  if (phone !== undefined) updateData.phone = phone.trim();
  if (party_type !== undefined) updateData.party_type = party_type;
  if (organization_name !== undefined) updateData.organization_name = organization_name;
  if (address_line_1 !== undefined) updateData.address_line_1 = address_line_1;
  if (city !== undefined) updateData.city = city;
  if (state !== undefined) updateData.state = state;
  if (postal_code !== undefined) updateData.postal_code = postal_code;
  if (government_id !== undefined) updateData.government_id = government_id ? encryptSensitiveValue(government_id.trim()) : null;

  const targetNotes = notes !== undefined ? notes : existingMeta.notes;
  const targetIsRef = is_referral_source !== undefined ? is_referral_source : existingMeta.is_referral_source;
  const targetCategory = referral_category !== undefined ? referral_category : existingMeta.referral_category;
  const targetFeeTerms = default_fee_terms !== undefined ? default_fee_terms : existingMeta.default_fee_terms;
  const targetDL = driver_license !== undefined ? (driver_license ? encryptSensitiveValue(driver_license.trim()) : '') : existingMeta.driver_license;
  const targetANum = alien_registration_number !== undefined ? (alien_registration_number ? encryptSensitiveValue(alien_registration_number.trim()) : '') : existingMeta.alien_registration_number;

  const targetCatType = category_type !== undefined ? category_type : existingMeta.category_type;
  const targetDept = department !== undefined ? department : existingMeta.department;
  const targetVendorSvc = vendor_service !== undefined ? vendor_service : existingMeta.vendor_service;

  updateData.notes = serializeContactNotes(targetNotes, {
    is_referral_source: targetIsRef,
    referral_category: targetCategory,
    default_fee_terms: targetFeeTerms,
    driver_license: targetDL,
    alien_registration_number: targetANum,
    category_type: targetCatType || 'General',
    department: targetDept || '',
    vendor_service: targetVendorSvc || ''
  });

  const updated = await prisma.client.update({
    where: { id: contactId },
    data: updateData
  });

  // Log activity
  await prisma.activity.create({
    data: {
      entity_type: 'contact',
      entity_id: updated.id,
      action: 'contact_updated',
      description: `Contact master entry updated: ${updated.full_name}`,
      actor_user_id: user?.id || null
    }
  });

  const linkedCount = await getLinkedMattersCount(updated.id);
  return enrichContactData(updated, linkedCount);
};

const remove = async (id, user) => {
  const contactId = parseInt(id, 10);
  const linkedCount = await getLinkedMattersCount(contactId);

  if (linkedCount > 0) {
    const err = new Error(`Cannot delete contact: Contact is linked to ${linkedCount} active matter(s). Reusable contacts with active matter links are preserved to maintain referential integrity.`);
    err.statusCode = 400;
    throw err;
  }

  await prisma.client.delete({ where: { id: contactId } });
  return { success: true, deleted_id: contactId };
};

const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 chars
const IV_LENGTH = 16;

const encryptSensitiveValue = (text) => {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(String(text));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch(e) {
    return text;
  }
};

const decryptSensitiveValue = (text) => {
  if (!text || !text.includes(':')) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch(e) {
    return text;
  }
};

const revealSensitiveField = async (id, fieldName = 'government_id', user) => {
  const contactId = parseInt(id, 10);
  const contact = await prisma.client.findUnique({ where: { id: contactId } });
  if (!contact) {
    const err = new Error('Contact not found');
    err.statusCode = 404;
    throw err;
  }

  const rawVal = contact[fieldName] || contact.government_id || '';
  const decrypted = decryptSensitiveValue(rawVal) || rawVal;

  // Audit trail log for sensitive field reveal (Point 24)
  await prisma.activity.create({
    data: {
      entity_type: 'contact',
      entity_id: contact.id,
      action: 'viewed_sensitive_field',
      description: `Sensitive field [${fieldName || 'Government ID / SSN'}] click-to-revealed for contact "${contact.full_name}" (ID #${contact.id}) by user ${user?.email || user?.id}`,
      actor_user_id: user?.id || null
    }
  });

  return {
    field: fieldName,
    value: decrypted,
    unmasked: true
  };
};

const maskSensitiveValue = (val) => {
  if (!val) return '';
  const str = String(val);
  if (str.length <= 4) return '••••';
  return `••••-••••-${str.slice(-4)}`;
};

module.exports = {
  getAll,
  search,
  getById,
  create,
  update,
  remove,
  getLinkedMattersCount,
  findDuplicateContact,
  encryptSensitiveValue,
  decryptSensitiveValue,
  maskSensitiveValue,
  revealSensitiveField
};
