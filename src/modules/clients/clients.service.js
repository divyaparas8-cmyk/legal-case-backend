const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');
const { findDuplicateContact } = require('../contacts/contacts.service');

const getAll = async (query, user) => {
  const { page = 1, limit = 10 } = query;
  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;

  const where = {};
  if (user?.role === 'lawyer') {
    where.matters = {
      some: { assigned_lawyer_id: user.id },
    };
  }
  if (user?.role === 'client') {
    where.user_id = user.id;
  }
  return await prisma.client.findMany({
    where,
    skip,
    take,
    include: {
      _count: {
        select: { matters: true }
      }
    },
    orderBy: { created_at: 'desc' },
  });
};

const getById = async (id, user) => {
  const client = await prisma.client.findUnique({ 
    where: { id: parseInt(id) },
    include: {
      matters: true,
      user: {
        select: { id: true, email: true, role: true, is_active: true }
      }
    }
  });
  if (!client) return null;
  if (user?.role === 'client' && client.user_id !== user.id) {
    const err = new Error('Not authorized to access this client profile');
    err.statusCode = 403;
    throw err;
  }
  if (user?.role === 'lawyer') {
    const hasAssigned = (client.matters || []).some((m) => m.assigned_lawyer_id === user.id);
    if (!hasAssigned) {
      const err = new Error('Not authorized to access this client');
      err.statusCode = 403;
      throw err;
    }
  }
  return client;
};

const create = async (data, user) => {
  if (user?.role !== 'admin') {
    const err = new Error('Only admin can create clients');
    err.statusCode = 403;
    throw err;
  }

  const { email, full_name, password, party_type, party_role, organization_name, contact_first_name, contact_last_name, business_address, home_address, date_of_birth, government_id, insurance_number } = data;

  // Duplicate Check Rule (Priority: Phone -> Email -> GovID)
  if (!data.bypass_duplicate) {
    const duplicateMatch = await findDuplicateContact(data);
    if (duplicateMatch) {
      return duplicateMatch;
    }
  }

  // 1. Check if user already exists
  let targetUser = await prisma.user.findUnique({ where: { email } });

  if (!targetUser) {
    // 2. Create new user with provided password or default '1234'
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password || '1234', salt);

    targetUser = await prisma.user.create({
      data: {
        email,
        full_name,
        password_hash,
        role: 'client',
        must_reset_password: true,
      }
    });
  }

  if (data.date_of_birth) {
    data.date_of_birth = new Date(data.date_of_birth);
  } else if (data.date_of_birth === '') {
    data.date_of_birth = null;
  }

  // 3. Create client linked to user
  return await prisma.client.create({
    data: {
      ...data,
      user_id: targetUser.id,
      password: undefined, // ensure password isn't saved in client table
    },
    include: {
      user: {
        select: { id: true, email: true, role: true }
      }
    }
  });
};

const update = async (id, data, user) => {
  const existing = await prisma.client.findUnique({
    where: { id: parseInt(id, 10) },
    include: { matters: true },
  });
  if (!existing) {
    const err = new Error('Client not found');
    err.statusCode = 404;
    throw err;
  }
  if (user?.role === 'lawyer') {
    const hasAssigned = (existing.matters || []).some((m) => m.assigned_lawyer_id === user.id);
    if (!hasAssigned) {
      const err = new Error('Not authorized to update this client');
      err.statusCode = 403;
      throw err;
    }
    delete data.is_portal_enabled;
    delete data.user_id;
  }
  if (user?.role === 'client') {
    if (existing.user_id !== user.id) {
      const err = new Error('Not authorized to update this client profile');
      err.statusCode = 403;
      throw err;
    }
    delete data.is_portal_enabled;
    delete data.user_id;
  }

  if (data.date_of_birth) {
    data.date_of_birth = new Date(data.date_of_birth);
  } else if (data.date_of_birth === '') {
    data.date_of_birth = null;
  }

  return await prisma.client.update({
    where: { id: parseInt(id) },
    data: {
      ...data,
      password: undefined,
    },
  });
};

const isAuthorizedToDelete = (user) => {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  return role === 'admin' || email.includes('kathleen');
};

const remove = async (id, user) => {
  if (!isAuthorizedToDelete(user)) {
    const err = new Error('Forbidden: Only Firm Owner/Admin or Kathleen are authorized to hard-delete records.');
    err.statusCode = 403;
    throw err;
  }

  const clientId = parseInt(id, 10);
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      matters: {
        include: { invoices: true }
      }
    }
  });

  if (!client) {
    const err = new Error('Client not found');
    err.statusCode = 404;
    throw err;
  }

  // Log Audit Entry
  await prisma.activity.create({
    data: {
      entity_type: 'client',
      entity_id: clientId,
      action: 'client_hard_deleted',
      description: `User ${user.full_name || user.email} (#${user.id}) hard-deleted client "${client.full_name}" (#${clientId})`,
      actor_user_id: user.id
    }
  }).catch(() => {});

  return await prisma.$transaction(async (tx) => {
    const matterIds = (client.matters || []).map(m => m.id);
    if (matterIds.length > 0) {
      await tx.payment.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.invoiceItem.deleteMany({ where: { invoice: { matter_id: { in: matterIds } } } }).catch(() => {});
      await tx.invoice.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.timeEntry.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.expense.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.communication.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.document.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.task.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.activity.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.calendarEvent.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.trustTransaction.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.matterStatusHistory.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.matterCustomFieldValue.deleteMany({ where: { matter_id: { in: matterIds } } }).catch(() => {});
      await tx.matter.deleteMany({ where: { id: { in: matterIds } } }).catch(() => {});
    }

    await tx.trustTransaction.deleteMany({ where: { client_id: clientId } }).catch(() => {});
    await tx.trustAccount.deleteMany({ where: { client_id: clientId } }).catch(() => {});
    await tx.lead.updateMany({
      where: { converted_client_id: clientId },
      data: { converted_client_id: null }
    }).catch(() => {});

    if (client.user_id) {
      await tx.communication.deleteMany({ where: { sender_user_id: client.user_id } }).catch(() => {});
      await tx.activity.deleteMany({ where: { actor_user_id: client.user_id } }).catch(() => {});
      await tx.task.deleteMany({ where: { OR: [{ assigned_user_id: client.user_id }, { created_by_user_id: client.user_id }] } }).catch(() => {});
      await tx.document.deleteMany({ where: { uploaded_by_user_id: client.user_id } }).catch(() => {});
      await tx.notification.deleteMany({ where: { user_id: client.user_id } }).catch(() => {});
      await tx.userRole.deleteMany({ where: { user_id: client.user_id } }).catch(() => {});
    }

    const deletedClient = await tx.client.delete({ where: { id: clientId } });

    if (client.user_id) {
      await tx.user.delete({ where: { id: client.user_id } }).catch(() => {});
    }

    return deletedClient;
  });
};

const mergeContacts = async (primaryId, duplicateId, user) => {
  if (user?.role !== 'admin') {
    const err = new Error('Only admin can merge contact records');
    err.statusCode = 403;
    throw err;
  }

  const pId = parseInt(primaryId, 10);
  const dId = parseInt(duplicateId, 10);

  if (pId === dId) {
    const err = new Error('Primary and Duplicate contact IDs cannot be identical.');
    err.statusCode = 400;
    throw err;
  }

  const [primary, duplicate] = await Promise.all([
    prisma.client.findUnique({ where: { id: pId } }),
    prisma.client.findUnique({ where: { id: dId } })
  ]);

  if (!primary || !duplicate) {
    const err = new Error('Primary or Duplicate contact not found');
    err.statusCode = 404;
    throw err;
  }

  // Re-point matters from duplicate to primary contact
  await prisma.matter.updateMany({
    where: { client_id: dId },
    data: { client_id: pId }
  });

  // Log Audit Entry
  await prisma.activity.create({
    data: {
      entity_type: 'client',
      entity_id: pId,
      action: 'contacts_merged',
      description: `Admin ${user.full_name || user.email} merged duplicate contact "${duplicate.full_name}" (#${dId}) into primary contact "${primary.full_name}" (#${pId})`,
      actor_user_id: user.id
    }
  }).catch(() => {});

  // Remove duplicate contact record
  await prisma.client.delete({ where: { id: dId } });

  return { success: true, message: `Merged contact #${dId} into #${pId}` };
};

const sendPortalInvite = async (clientId, user) => {
  if (user?.role !== 'admin' && user?.role !== 'lawyer') {
    const err = new Error('Not authorized to send portal invites');
    err.statusCode = 403;
    throw err;
  }

  const client = await prisma.client.findUnique({
    where: { id: parseInt(clientId) },
    include: { user: true }
  });

  if (!client) {
    const err = new Error('Client profile not found');
    err.statusCode = 404;
    throw err;
  }

  let targetUser = client.user;
  if (!targetUser) {
    // Generate new secure user credentials if not present
    const crypto = require('crypto');
    const password_hash = crypto.randomBytes(32).toString('hex'); // Placeholder hash - passwordless clients will not use it
    targetUser = await prisma.user.create({
      data: {
        email: client.email,
        full_name: client.full_name,
        password_hash,
        role: 'client',
        email_verified: false,
      }
    });
    
    // Update Client reference
    await prisma.client.update({
      where: { id: client.id },
      data: { user_id: targetUser.id }
    });
  }

  // Generate invite token (Option A: Passwordless Verification Flow)
  const crypto = require('crypto');
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7); // 7-day token expiration

  try {
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        invite_token: inviteToken,
        invite_token_expires: expiry,
        invite_sent_at: new Date(),
        invite_send_failed: false,
      }
    });

    // Triggers email dispatch
    console.log(`[Email Dispatch] Transactional Portal Invitation Link: http://localhost:5173/portal-invite?token=${inviteToken}`);

    // Create Audit Activity Timeline record
    await prisma.activity.create({
      data: {
        entity_type: 'client',
        entity_id: client.id,
        action: 'portal_invite_sent',
        actor_user_id: user.id,
        description: `Portal invitation link dispatched to client email: ${client.email}`,
      }
    });

    return { success: true, message: 'Portal invitation link triggered successfully' };
  } catch (err) {
    // Phase 2B Retry Failure Flagging
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { invite_send_failed: true }
    });
    throw err;
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  mergeContacts,
  sendPortalInvite
};