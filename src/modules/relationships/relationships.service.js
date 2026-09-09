const prisma = require('../../config/db');

/**
 * Initialize dedicated MySQL table `matter_relationships` if it does not already exist.
 */
let dbInitialized = false;
async function ensureTableExists() {
  if (dbInitialized) return;
  try {
    // Create table with full schema (only creates if not exists)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS matter_relationships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        matter_id INT NOT NULL,
        from_contact_id INT NULL,
        from_contact_name VARCHAR(255) NULL,
        to_contact_id INT NULL,
        to_contact_name VARCHAR(255) NULL,
        relationship_type VARCHAR(100) NOT NULL,
        notes TEXT,
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_matter (matter_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check via INFORMATION_SCHEMA if the new columns exist — add them if not
    const dbName = await prisma.$queryRawUnsafe(`SELECT DATABASE() AS db`);
    const schema = dbName[0]?.db;
    if (schema) {
      const cols = await prisma.$queryRawUnsafe(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${schema}' AND TABLE_NAME = 'matter_relationships'`
      );
      const colNames = cols.map(c => c.COLUMN_NAME);
      if (!colNames.includes('from_contact_name')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE matter_relationships ADD COLUMN from_contact_name VARCHAR(255) NULL`);
      }
      if (!colNames.includes('to_contact_name')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE matter_relationships ADD COLUMN to_contact_name VARCHAR(255) NULL`);
      }
      // Ensure contact IDs are nullable
      if (colNames.includes('from_contact_id')) {
        try { await prisma.$executeRawUnsafe(`ALTER TABLE matter_relationships MODIFY from_contact_id INT NULL`); } catch (_) {}
      }
      if (colNames.includes('to_contact_id')) {
        try { await prisma.$executeRawUnsafe(`ALTER TABLE matter_relationships MODIFY to_contact_id INT NULL`); } catch (_) {}
      }
    }

    dbInitialized = true;
  } catch (err) {
    console.error('Failed to initialize matter_relationships table:', err);
  }
}


/**
 * Helper to fetch client contact object by ID
 */
async function getContactInfo(contactId) {
  if (!contactId) return null;
  const parsed = parseInt(contactId, 10);
  if (isNaN(parsed)) return null;
  const client = await prisma.client.findUnique({
    where: { id: parsed },
    select: {
      id: true,
      full_name: true,
      email: true,
      phone: true,
      party_type: true,
      organization_name: true,
      address_line_1: true
    }
  });
  return client;
}

const getMatterRelationships = async (matterId, query = {}, user) => {
  await ensureTableExists();
  const mId = parseInt(matterId, 10);
  const { q = '', category = 'All', sort = 'Newest' } = query;

  const rows = await prisma.$queryRawUnsafe(`
    SELECT * FROM matter_relationships 
    WHERE matter_id = ${mId}
    ORDER BY created_at DESC
  `);

  if (!Array.isArray(rows)) return [];

  // Enrich each relationship row with live contact data or fallback to stored name
  const enriched = await Promise.all(
    rows.map(async r => {
      const fromContact = r.from_contact_id ? await getContactInfo(r.from_contact_id) : null;
      const toContact = r.to_contact_id ? await getContactInfo(r.to_contact_id) : null;
      return {
        id: r.id,
        matter_id: r.matter_id,
        from_contact_id: r.from_contact_id,
        from_contact: fromContact || { id: r.from_contact_id || null, full_name: r.from_contact_name || 'Unknown' },
        to_contact_id: r.to_contact_id,
        to_contact: toContact || { id: r.to_contact_id || null, full_name: r.to_contact_name || 'Unknown' },
        relationship_type: r.relationship_type,
        notes: r.notes || '',
        created_by: r.created_by,
        created_at: r.created_at,
        updated_at: r.updated_at
      };
    })
  );

  // Category classification helper
  const getCategory = (type) => {
    const family = ['Spouse', 'Parent', 'Child', 'Guardian', 'Sibling', 'Emergency Contact'];
    const legal = ['Attorney', 'Client', 'Witness', 'Representative'];
    const business = ['Employer', 'Employee', 'Business Partner'];
    if (family.includes(type)) return 'Family';
    if (legal.includes(type)) return 'Legal';
    if (business.includes(type)) return 'Business';
    return 'Other';
  };

  // Filter
  let filtered = enriched;

  if (category && category !== 'All') {
    filtered = filtered.filter(r => getCategory(r.relationship_type) === category);
  }

  if (q && q.trim()) {
    const s = q.trim().toLowerCase();
    filtered = filtered.filter(r => {
      const fromName = (r.from_contact?.full_name || '').toLowerCase();
      const toName = (r.to_contact?.full_name || '').toLowerCase();
      const relType = (r.relationship_type || '').toLowerCase();
      const notes = (r.notes || '').toLowerCase();
      return fromName.includes(s) || toName.includes(s) || relType.includes(s) || notes.includes(s);
    });
  }

  // Sort
  if (sort === 'Oldest') {
    filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (sort === 'Relationship Type') {
    filtered.sort((a, b) => (a.relationship_type || '').localeCompare(b.relationship_type || ''));
  } else {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return filtered;
};

const createRelationship = async (matterId, data, user) => {
  await ensureTableExists();
  const mId = parseInt(matterId, 10);
  const { from_contact_id, from_contact_name, to_contact_id, to_contact_name, relationship_type, notes } = data;

  // Resolve from / to — either a numeric ID or a plain-text name
  const fromName = from_contact_name ? from_contact_name.trim() : '';
  const toName = to_contact_name ? to_contact_name.trim() : '';
  const fromId = from_contact_id && !isNaN(parseInt(from_contact_id, 10)) ? parseInt(from_contact_id, 10) : null;
  const toId = to_contact_id && !isNaN(parseInt(to_contact_id, 10)) ? parseInt(to_contact_id, 10) : null;

  if (!fromName && !fromId) {
    const err = new Error('From Contact is required.');
    err.statusCode = 400;
    throw err;
  }
  if (!toName && !toId) {
    const err = new Error('To Contact is required.');
    err.statusCode = 400;
    throw err;
  }

  if (!relationship_type || !relationship_type.trim()) {
    const err = new Error('Relationship Type is required.');
    err.statusCode = 400;
    throw err;
  }

  // Fetch contact info if IDs provided
  const fromContact = fromId ? await getContactInfo(fromId) : null;
  const toContact = toId ? await getContactInfo(toId) : null;

  const resolvedFromName = fromContact?.full_name || fromName;
  const resolvedToName = toContact?.full_name || toName;

  const cleanType = relationship_type.trim();
  const cleanNotes = notes ? notes.trim() : '';
  const userId = user?.id ? parseInt(user.id, 10) : null;

  const fromIdSQL = fromId ? fromId : 'NULL';
  const toIdSQL = toId ? toId : 'NULL';
  const fromNameSQL = resolvedFromName ? `'${resolvedFromName.replace(/'/g, "''")}'` : 'NULL';
  const toNameSQL = resolvedToName ? `'${resolvedToName.replace(/'/g, "''")}'` : 'NULL';

  await prisma.$executeRawUnsafe(`
    INSERT INTO matter_relationships (matter_id, from_contact_id, from_contact_name, to_contact_id, to_contact_name, relationship_type, notes, created_by, created_at, updated_at)
    VALUES (${mId}, ${fromIdSQL}, ${fromNameSQL}, ${toIdSQL}, ${toNameSQL}, '${cleanType.replace(/'/g, "''")}', ${cleanNotes ? `'${cleanNotes.replace(/'/g, "''")}'` : 'NULL'}, ${userId || 'NULL'}, NOW(), NOW())
  `);

  // Fetch created row
  const createdRows = await prisma.$queryRawUnsafe(`
    SELECT * FROM matter_relationships
    WHERE matter_id = ${mId}
    ORDER BY id DESC LIMIT 1
  `);

  const createdRel = createdRows[0];

  // Audit Log to Activity/Timeline
  await prisma.activity.create({
    data: {
      matter_id: mId,
      entity_type: 'matter',
      entity_id: mId,
      action: 'relationship_created',
      description: `Created ${cleanType} relationship between ${resolvedFromName} and ${resolvedToName}`,
      actor_user_id: user?.id || null
    }
  });

  return {
    ...createdRel,
    from_contact: fromContact || { id: null, full_name: resolvedFromName },
    to_contact: toContact || { id: null, full_name: resolvedToName }
  };
};

const updateRelationship = async (id, data, user) => {
  await ensureTableExists();
  const relId = parseInt(id, 10);

  const existingRows = await prisma.$queryRawUnsafe(`
    SELECT * FROM matter_relationships WHERE id = ${relId}
  `);

  if (!Array.isArray(existingRows) || existingRows.length === 0) {
    const err = new Error('Relationship not found.');
    err.statusCode = 404;
    throw err;
  }

  const existing = existingRows[0];
  const { relationship_type, notes } = data;
  const cleanType = (relationship_type !== undefined ? relationship_type : existing.relationship_type).trim();
  const cleanNotes = notes !== undefined ? notes.trim() : (existing.notes || '');

  await prisma.$executeRawUnsafe(`
    UPDATE matter_relationships
    SET relationship_type = '${cleanType.replace(/'/g, "''")}',
        notes = ${cleanNotes ? `'${cleanNotes.replace(/'/g, "''")}'` : 'NULL'},
        updated_at = NOW()
    WHERE id = ${relId}
  `);

  const fromContact = existing.from_contact_id ? await getContactInfo(existing.from_contact_id) : null;
  const toContact = existing.to_contact_id ? await getContactInfo(existing.to_contact_id) : null;

  // Audit Log to Activity/Timeline
  await prisma.activity.create({
    data: {
      matter_id: existing.matter_id,
      entity_type: 'matter',
      entity_id: existing.matter_id,
      action: 'relationship_updated',
      description: `Updated relationship #${relId} (${cleanType}) between ${fromContact?.full_name || existing.from_contact_name || 'Contact'} and ${toContact?.full_name || existing.to_contact_name || 'Contact'}`,
      actor_user_id: user?.id || null
    }
  });

  return {
    ...existing,
    relationship_type: cleanType,
    notes: cleanNotes,
    from_contact: fromContact || { id: null, full_name: existing.from_contact_name || 'Unknown' },
    to_contact: toContact || { id: null, full_name: existing.to_contact_name || 'Unknown' }
  };
};

const deleteRelationship = async (id, user) => {
  await ensureTableExists();
  const relId = parseInt(id, 10);

  const existingRows = await prisma.$queryRawUnsafe(`
    SELECT * FROM matter_relationships WHERE id = ${relId}
  `);

  if (!Array.isArray(existingRows) || existingRows.length === 0) {
    const err = new Error('Relationship not found.');
    err.statusCode = 404;
    throw err;
  }

  const existing = existingRows[0];
  const fromContact = existing.from_contact_id ? await getContactInfo(existing.from_contact_id) : null;
  const toContact = existing.to_contact_id ? await getContactInfo(existing.to_contact_id) : null;

  await prisma.$executeRawUnsafe(`
    DELETE FROM matter_relationships WHERE id = ${relId}
  `);

  // Audit Log to Activity/Timeline
  await prisma.activity.create({
    data: {
      matter_id: existing.matter_id,
      entity_type: 'matter',
      entity_id: existing.matter_id,
      action: 'relationship_deleted',
      description: `Deleted ${existing.relationship_type} relationship between ${fromContact?.full_name || existing.from_contact_name || 'Contact'} and ${toContact?.full_name || existing.to_contact_name || 'Contact'}`,
      actor_user_id: user?.id || null
    }
  });

  return { success: true, deleted_id: relId };
};

module.exports = {
  getMatterRelationships,
  createRelationship,
  updateRelationship,
  deleteRelationship
};
