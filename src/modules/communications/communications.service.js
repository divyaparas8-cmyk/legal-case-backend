const prisma = require('../../config/db');

/**
 * Initialize dedicated MySQL table `matter_communications` if it does not already exist.
 */
let dbInitialized = false;
async function ensureTableExists() {
  if (dbInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS matter_communications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        matter_id INT NOT NULL,
        type VARCHAR(50) DEFAULT 'Note',
        subject VARCHAR(255) NOT NULL,
        description LONGTEXT,
        communication_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        contact_id INT,
        document_ids JSON,
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_matter (matter_id),
        INDEX idx_type (type),
        INDEX idx_contact (contact_id),
        INDEX idx_comm_date (communication_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Recover/Sync legacy communication records into matter_communications
    try {
      const oldComms = await prisma.communication.findMany({
        select: {
          id: true,
          matter_id: true,
          subject: true,
          message_body: true,
          communication_type: true,
          sender_user_id: true,
          created_at: true,
          updated_at: true
        }
      });

      if (Array.isArray(oldComms) && oldComms.length > 0) {
        for (const c of oldComms) {
          if (!c.matter_id) continue;

          let mappedType = 'Note';
          const ct = (c.communication_type || '').toLowerCase();
          if (ct.includes('call')) mappedType = 'Call';
          else if (ct.includes('email')) mappedType = 'Email';
          else if (ct.includes('sms')) mappedType = 'SMS';
          else if (ct.includes('meeting')) mappedType = 'Meeting';

          const rawSubj = (c.subject || 'Untitled Communication').trim();
          const cleanSubj = rawSubj.replace(/'/g, "''");
          const cleanDesc = (c.message_body || '').trim().replace(/'/g, "''");
          const cDate = c.created_at
            ? `'${new Date(c.created_at).toISOString().slice(0, 19).replace('T', ' ')}'`
            : 'NOW()';
          const uId = c.sender_user_id ? parseInt(c.sender_user_id, 10) : 'NULL';

          const exists = await prisma.$queryRawUnsafe(`
            SELECT id FROM matter_communications 
            WHERE matter_id = ${c.matter_id} AND subject = '${cleanSubj}' AND type = '${mappedType}'
            LIMIT 1
          `);

          if (!Array.isArray(exists) || exists.length === 0) {
            await prisma.$executeRawUnsafe(`
              INSERT INTO matter_communications (
                matter_id, type, subject, description, communication_date, created_by, created_at, updated_at
              ) VALUES (
                ${c.matter_id}, '${mappedType}', '${cleanSubj}', '${cleanDesc}', ${cDate}, ${uId}, ${cDate}, NOW()
              )
            `);
          }
        }
      }
    } catch (syncErr) {
      console.warn('Communication legacy data sync notice:', syncErr.message);
    }

    dbInitialized = true;
  } catch (err) {
    console.error('Failed to initialize matter_communications table:', err);
  }
}

/**
 * Helper to fetch contact info from prisma.client
 */
async function getContactInfo(contactId) {
  if (!contactId) return null;
  try {
    const contact = await prisma.client.findUnique({
      where: { id: parseInt(contactId, 10) },
      select: { id: true, first_name: true, last_name: true, email: true, phone: true, company: true }
    });
    return contact;
  } catch (e) {
    return null;
  }
}

/**
 * Helper to fetch user info from prisma.user
 */
async function getUserInfo(userId) {
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      select: { id: true, full_name: true, email: true }
    });
    return user;
  } catch (e) {
    return null;
  }
}

/**
 * Helper to fetch attached documents info from prisma.document
 */
async function getAttachedDocuments(docIdsRaw) {
  if (!docIdsRaw) return [];
  try {
    let ids = [];
    if (typeof docIdsRaw === 'string') ids = JSON.parse(docIdsRaw);
    else if (Array.isArray(docIdsRaw)) ids = docIdsRaw;
    
    if (!Array.isArray(ids) || ids.length === 0) return [];

    const numericIds = ids.map(i => parseInt(i, 10)).filter(Boolean);
    if (numericIds.length === 0) return [];

    const docs = await prisma.document.findMany({
      where: { id: { in: numericIds } },
      select: { id: true, file_name: true, original_name: true, category: true, file_path: true }
    });
    return docs;
  } catch (e) {
    return [];
  }
}

const getMatterCommunications = async (matterId, query = {}, user) => {
  await ensureTableExists();
  const mId = parseInt(matterId, 10);
  const { q = '', type = 'All', contact_id = 'All', sort = 'Newest' } = query;

  const rows = await prisma.$queryRawUnsafe(`
    SELECT * FROM matter_communications 
    WHERE matter_id = ${mId}
    ORDER BY communication_date DESC
  `);

  if (!Array.isArray(rows)) return { communications: [], stats: { total: 0, calls: 0, emails: 0, sms: 0, meetings: 0, notes: 0 } };

  // Map and enrich communications
  const enriched = await Promise.all(
    rows.map(async c => {
      const contact = await getContactInfo(c.contact_id);
      const creator = await getUserInfo(c.created_by);
      const documents = await getAttachedDocuments(c.document_ids);

      return {
        id: c.id,
        matter_id: c.matter_id,
        type: c.type || 'Note',
        communication_type: (c.type || 'note').toLowerCase().includes('email') ? 'email_log' : (c.type || '').toLowerCase().includes('call') ? 'call_log' : (c.type || '').toLowerCase(),
        subject: c.subject || 'Untitled Communication',
        description: c.description || '',
        message_body: c.description || '',
        communication_date: c.communication_date || c.created_at,
        created_at: c.communication_date || c.created_at,
        updated_at: c.updated_at || c.created_at,
        contact_id: c.contact_id,
        contact: contact || (c.contact_id ? { id: c.contact_id, first_name: `Contact #${c.contact_id}`, last_name: '' } : null),
        document_ids: c.document_ids,
        documents,
        created_by: c.created_by,
        sender_user_id: c.created_by,
        creator,
        sender: creator || (contact ? { id: contact.id, full_name: `${contact.first_name} ${contact.last_name}`, email: contact.email } : null)
      };
    })
  );

  // Compute stats across all records
  const stats = {
    total: enriched.length,
    calls: enriched.filter(c => (c.type || '').toLowerCase() === 'call').length,
    emails: enriched.filter(c => (c.type || '').toLowerCase() === 'email').length,
    sms: enriched.filter(c => (c.type || '').toLowerCase() === 'sms').length,
    meetings: enriched.filter(c => (c.type || '').toLowerCase() === 'meeting').length,
    notes: enriched.filter(c => (c.type || '').toLowerCase() === 'note').length
  };

  // Filter logic
  let filtered = enriched;

  if (type && type !== 'All') {
    filtered = filtered.filter(c => c.type.toLowerCase() === type.toLowerCase());
  }

  if (contact_id && contact_id !== 'All') {
    const cid = parseInt(contact_id, 10);
    filtered = filtered.filter(c => c.contact_id === cid);
  }

  if (q && q.trim()) {
    const s = q.trim().toLowerCase();
    filtered = filtered.filter(c => {
      const subjectMatch = (c.subject || '').toLowerCase().includes(s);
      const descMatch = (c.description || '').toLowerCase().includes(s);
      const contactName = `${c.contact?.first_name || ''} ${c.contact?.last_name || ''}`.toLowerCase();
      const contactMatch = contactName.includes(s);
      return subjectMatch || descMatch || contactMatch;
    });
  }

  // Sort logic
  if (sort === 'Oldest') {
    filtered.sort((a, b) => new Date(a.communication_date) - new Date(b.communication_date));
  } else {
    filtered.sort((a, b) => new Date(b.communication_date) - new Date(a.communication_date));
  }

  return {
    communications: filtered,
    stats
  };
};

const createCommunication = async (matterId, data, user) => {
  await ensureTableExists();
  let mId = 0;
  let payload = data;
  let currentUser = user;

  if (typeof matterId === 'object' && matterId !== null) {
    currentUser = data;
    payload = matterId;
    mId = payload.matter_id || payload.matterId ? parseInt(payload.matter_id || payload.matterId, 10) : 0;
  } else {
    const rawId = matterId || data?.matter_id || data?.matterId;
    mId = rawId ? parseInt(rawId, 10) : 0;
  }
  if (isNaN(mId)) mId = 0;

  const {
    type = 'Email',
    subject,
    title,
    description = '',
    message_body = '',
    body = '',
    communication_date = null,
    contact_id = null,
    document_ids = []
  } = payload || {};

  const resolvedSubject = (subject || title || 'Email Communication').trim();
  const resolvedDesc = (message_body || description || body || '').trim();

  if (!resolvedSubject) {
    const err = new Error('Communication Subject is required.');
    err.statusCode = 400;
    throw err;
  }

  const cleanType = (type || 'Email').trim();
  const cleanSubject = resolvedSubject;
  const cleanDesc = resolvedDesc;
  const cid = contact_id && !isNaN(parseInt(contact_id, 10)) ? parseInt(contact_id, 10) : null;
  const userId = user?.id && !isNaN(parseInt(user.id, 10)) ? parseInt(user.id, 10) : null;

  const cDate = communication_date
    ? `'${new Date(communication_date).toISOString().slice(0, 19).replace('T', ' ')}'`
    : 'NOW()';

  let docIdsSql = 'NULL';
  if (Array.isArray(document_ids) && document_ids.length > 0) {
    const numericDocIds = document_ids.map(id => parseInt(id, 10)).filter(Boolean);
    docIdsSql = `'${JSON.stringify(numericDocIds)}'`;
  }

  await prisma.$executeRawUnsafe(`
    INSERT INTO matter_communications (
      matter_id, type, subject, description, communication_date, contact_id, document_ids, created_by, created_at, updated_at
    )
    VALUES (
      ${mId}, '${cleanType.replace(/'/g, "''")}', '${cleanSubject.replace(/'/g, "''")}', ${cleanDesc ? `'${cleanDesc.replace(/'/g, "''")}'` : 'NULL'},
      ${cDate}, ${cid ? cid : 'NULL'}, ${docIdsSql}, ${userId ? userId : 'NULL'}, NOW(), NOW()
    )
  `);

  if (mId > 0) {
    try {
      const matterExists = await prisma.matter.findUnique({ where: { id: mId }, select: { id: true } });
      if (matterExists) {
        const contact = cid ? await getContactInfo(cid) : null;
        const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unlinked';

        await prisma.activity.create({
          data: {
            matter_id: mId,
            entity_type: 'matter',
            entity_id: mId,
            action: 'communication_created',
            description: `Logged ${cleanType} communication "${cleanSubject}" (Contact: ${contactName})`,
            actor_user_id: user?.id || null
          }
        }).catch(() => {});
      }
    } catch (e) {}

    return await getMatterCommunications(mId, {}, user);
  }

  return { success: true, message: 'Communication logged successfully' };
};

const updateCommunication = async (id, data, user) => {
  await ensureTableExists();
  const commId = parseInt(id, 10);

  const existingRows = await prisma.$queryRawUnsafe(`SELECT * FROM matter_communications WHERE id = ${commId}`);
  if (!Array.isArray(existingRows) || existingRows.length === 0) {
    const err = new Error('Communication record not found.');
    err.statusCode = 404;
    throw err;
  }

  const existing = existingRows[0];
  const {
    type,
    subject,
    title,
    description,
    message_body,
    body,
    communication_date,
    contact_id,
    document_ids
  } = data || {};

  const cleanType = (type !== undefined ? type : existing.type).trim();
  const cleanSubject = (subject !== undefined ? subject : (title !== undefined ? title : existing.subject)).trim();
  
  let cleanDesc = existing.description || '';
  if (message_body !== undefined && message_body !== null) cleanDesc = String(message_body).trim();
  else if (description !== undefined && description !== null) cleanDesc = String(description).trim();
  else if (body !== undefined && body !== null) cleanDesc = String(body).trim();

  const cid = contact_id !== undefined ? (contact_id ? parseInt(contact_id, 10) : null) : existing.contact_id;

  const rawDate = communication_date !== undefined ? communication_date : existing.communication_date;
  const cDate = rawDate ? `'${new Date(rawDate).toISOString().slice(0, 19).replace('T', ' ')}'` : 'NOW()';

  let docIdsSql = existing.document_ids ? `'${typeof existing.document_ids === 'string' ? existing.document_ids : JSON.stringify(existing.document_ids)}'` : 'NULL';
  if (document_ids !== undefined) {
    if (Array.isArray(document_ids) && document_ids.length > 0) {
      const numericDocIds = document_ids.map(dId => parseInt(dId, 10)).filter(Boolean);
      docIdsSql = `'${JSON.stringify(numericDocIds)}'`;
    } else {
      docIdsSql = 'NULL';
    }
  }

  await prisma.$executeRawUnsafe(`
    UPDATE matter_communications
    SET type = '${cleanType.replace(/'/g, "''")}',
        subject = '${cleanSubject.replace(/'/g, "''")}',
        description = ${cleanDesc ? `'${cleanDesc.replace(/'/g, "''")}'` : 'NULL'},
        communication_date = ${cDate},
        contact_id = ${cid || 'NULL'},
        document_ids = ${docIdsSql},
        updated_at = NOW()
    WHERE id = ${commId}
  `);

  const mId = existing.matter_id ? parseInt(existing.matter_id, 10) : 0;

  if (mId > 0) {
    try {
      const matterExists = await prisma.matter.findUnique({ where: { id: mId }, select: { id: true } });
      if (matterExists) {
        await prisma.activity.create({
          data: {
            matter_id: mId,
            entity_type: 'matter',
            entity_id: mId,
            action: 'communication_updated',
            description: `Updated ${cleanType} communication "${cleanSubject}"`,
            actor_user_id: user?.id || null
          }
        }).catch(() => {});
      }
    } catch (e) {}

    return await getMatterCommunications(mId, {}, user);
  }

  return await getAllCommunications({}, user);
};

const deleteCommunication = async (id, user) => {
  await ensureTableExists();
  const commId = parseInt(id, 10);

  const existingRows = await prisma.$queryRawUnsafe(`SELECT * FROM matter_communications WHERE id = ${commId}`);
  if (!Array.isArray(existingRows) || existingRows.length === 0) {
    const err = new Error('Communication record not found.');
    err.statusCode = 404;
    throw err;
  }

  const existing = existingRows[0];

  await prisma.$executeRawUnsafe(`DELETE FROM matter_communications WHERE id = ${commId}`);

  const mId = existing.matter_id ? parseInt(existing.matter_id, 10) : 0;

  if (mId > 0) {
    try {
      const matterExists = await prisma.matter.findUnique({ where: { id: mId }, select: { id: true } });
      if (matterExists) {
        await prisma.activity.create({
          data: {
            matter_id: mId,
            entity_type: 'matter',
            entity_id: mId,
            action: 'communication_deleted',
            description: `Deleted ${existing.type} communication "${existing.subject}"`,
            actor_user_id: user?.id || null
          }
        }).catch(() => {});
      }
    } catch (e) {}
  }

  return { success: true, deleted_id: commId };
};

const getAllCommunications = async (query = {}, user) => {
  await ensureTableExists();
  const { q = '', type = 'All', contact_id = 'All', sort = 'Newest', limit = 500 } = query;

  // ── CLIENT PRIVACY GUARD ──────────────────────────────────────────────────
  // Clients must ONLY see messages from their own matters.
  // Admin and lawyers see everything.
  let matterIdFilter = '';
  if (user?.role === 'client') {
    // Find the client record linked to this user
    const clientRecord = await prisma.client.findFirst({
      where: { user_id: user.id },
      select: { id: true }
    });
    if (clientRecord) {
      // Get matter IDs that belong to this client
      const clientMatters = await prisma.matter.findMany({
        where: { client_id: clientRecord.id },
        select: { id: true }
      });
      const matterIds = clientMatters.map(m => m.id);
      if (matterIds.length === 0) {
        // Client has no matters — return empty
        return { communications: [], stats: { total: 0, calls: 0, emails: 0, sms: 0, meetings: 0, notes: 0 } };
      }
      matterIdFilter = `WHERE matter_id IN (${matterIds.join(',')})`;
    } else {
      // No client record found — return empty for safety
      return { communications: [], stats: { total: 0, calls: 0, emails: 0, sms: 0, meetings: 0, notes: 0 } };
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const rows = await prisma.$queryRawUnsafe(`
    SELECT * FROM matter_communications 
    ${matterIdFilter}
    ORDER BY communication_date DESC
    LIMIT ${parseInt(limit, 10) || 500}
  `);

  if (!Array.isArray(rows)) return { communications: [], stats: { total: 0, calls: 0, emails: 0, sms: 0, meetings: 0, notes: 0 } };

  const enriched = await Promise.all(
    rows.map(async c => {
      const contact = await getContactInfo(c.contact_id);
      const creator = await getUserInfo(c.created_by);
      const documents = await getAttachedDocuments(c.document_ids);

      return {
        id: c.id,
        matter_id: c.matter_id,
        type: c.type || 'Note',
        communication_type: (c.type || 'note').toLowerCase().includes('email') ? 'email_log' : (c.type || '').toLowerCase().includes('call') ? 'call_log' : (c.type || '').toLowerCase(),
        subject: c.subject || 'Untitled Communication',
        description: c.description || '',
        message_body: c.description || '',
        communication_date: c.communication_date || c.created_at,
        created_at: c.communication_date || c.created_at,
        updated_at: c.updated_at || c.created_at,
        contact_id: c.contact_id,
        contact: contact || (c.contact_id ? { id: c.contact_id, first_name: `Contact #${c.contact_id}`, last_name: '' } : null),
        document_ids: c.document_ids,
        documents,
        created_by: c.created_by,
        sender_user_id: c.created_by,
        creator,
        sender: creator || (contact ? { id: contact.id, full_name: `${contact.first_name} ${contact.last_name}`, email: contact.email } : null)
      };
    })
  );

  const stats = {
    total: enriched.length,
    calls: enriched.filter(c => (c.type || '').toLowerCase() === 'call').length,
    emails: enriched.filter(c => (c.type || '').toLowerCase() === 'email').length,
    sms: enriched.filter(c => (c.type || '').toLowerCase() === 'sms').length,
    meetings: enriched.filter(c => (c.type || '').toLowerCase() === 'meeting').length,
    notes: enriched.filter(c => (c.type || '').toLowerCase() === 'note').length
  };

  let filtered = enriched;

  if (type && type !== 'All') {
    filtered = filtered.filter(c => c.type.toLowerCase() === type.toLowerCase());
  }

  if (contact_id && contact_id !== 'All') {
    const cid = parseInt(contact_id, 10);
    filtered = filtered.filter(c => c.contact_id === cid);
  }

  if (q && q.trim()) {
    const s = q.trim().toLowerCase();
    filtered = filtered.filter(c => {
      const subjectMatch = (c.subject || '').toLowerCase().includes(s);
      const descMatch = (c.description || '').toLowerCase().includes(s);
      const contactName = `${c.contact?.first_name || ''} ${c.contact?.last_name || ''}`.toLowerCase();
      return subjectMatch || descMatch || contactName.includes(s);
    });
  }

  if (sort === 'Oldest') {
    filtered.sort((a, b) => new Date(a.communication_date) - new Date(b.communication_date));
  } else {
    filtered.sort((a, b) => new Date(b.communication_date) - new Date(a.communication_date));
  }

  const result = [...filtered];
  result.communications = filtered;
  result.stats = stats;
  return result;
};

const markMatterRead = async (matterId, user) => {
  return { matter_id: matterId, read: true };
};

const markRead = async (commId, user) => {
  return { id: commId, read: true };
};

const autoSuggestMatterForEmail = async (senderEmail, recipientEmail) => {
  if (!senderEmail && !recipientEmail) return null;
  const emails = [senderEmail, recipientEmail].filter(Boolean).map(e => e.toLowerCase().trim());

  const matters = await prisma.matter.findMany({
    take: 50,
    include: {
      client: { select: { id: true, email: true, full_name: true } }
    }
  });

  for (const m of matters) {
    if (m.client?.email && emails.includes(m.client.email.toLowerCase().trim())) {
      return { matter: m, matched_by: 'client_email', matched_email: m.client.email };
    }
    if (m.parties_data) {
      try {
        const parties = Array.isArray(m.parties_data) ? m.parties_data : JSON.parse(m.parties_data);
        for (const p of parties) {
          if (p.email && emails.includes(p.email.toLowerCase().trim())) {
            return { matter: m, matched_by: 'party_email', matched_email: p.email };
          }
        }
      } catch (e) {}
    }
  }

  return null;
};

const fileEmailToMatter = async (emailData, matterId, user) => {
  await ensureTableExists();
  const mId = parseInt(matterId, 10);
  const subject = emailData.subject || 'Filed Email Thread';
  const description = emailData.body || emailData.description || emailData.snippet || '';
  const senderEmail = emailData.sender || emailData.from || '';

  const createdComm = await createCommunication({
    matter_id: mId,
    type: 'Email',
    subject,
    description: `From: ${senderEmail}\n\n${description}`,
    communication_date: emailData.date || new Date().toISOString()
  }, user);

  // Copy email attachments into Matter Document repository
  if (Array.isArray(emailData.attachments) && emailData.attachments.length > 0) {
    for (const att of emailData.attachments) {
      const fName = att.filename || att.name || 'Email Attachment.pdf';
      const mType = att.contentType || 'application/pdf';
      const fUrl = att.url || att.path || '/documents/sample.pdf';
      await prisma.document.create({
        data: {
          matter_id: mId,
          file_name: fName,
          original_name: fName,
          mime_type: mType,
          file_path: fUrl,
          file_size: att.size || 1024,
          uploaded_by_user_id: user?.id || 1,
          category: 'Email Attachment'
        }
      }).catch((e) => { console.warn('Attachment copy warning:', e.message); });
    }
  }

  await prisma.activity.create({
    data: {
      matter_id: mId,
      entity_type: 'email',
      entity_id: mId,
      action: 'filed_to_matter',
      description: `Filed email "${subject}" to matter #${mId}`,
      actor_user_id: user?.id || null
    }
  }).catch(() => {});

  return { success: true, communication: createdComm };
};

module.exports = {
  getMatterCommunications,
  getAllCommunications,
  createCommunication,
  updateCommunication,
  deleteCommunication,
  markMatterRead,
  markRead,
  autoSuggestMatterForEmail,
  fileEmailToMatter
};