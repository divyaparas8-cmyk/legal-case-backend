const prisma = require('../../config/db');

/**
 * Get all messages for a channel with user info
 */
const getMessages = async (query = {}) => {
  const { channel = 'general', limit = 100, before_id } = query;
  const take = Math.min(parseInt(limit) || 100, 200);

  const where = {
    channel,
    is_deleted: false,
  };

  if (before_id) {
    where.id = { lt: parseInt(before_id) };
  }

  const messages = await prisma.teamChatMessage.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take,
  });

  // Fetch user info for all unique user_ids
  const userIds = [...new Set(messages.map(m => m.user_id))];
  const users = userIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, full_name: true, email: true, role: true }
  }) : [];

  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  const enriched = messages.map(m => ({
    id: m.id,
    message: m.message,
    channel: m.channel,
    created_at: m.created_at,
    updated_at: m.updated_at,
    user: userMap[m.user_id] || { id: m.user_id, full_name: 'Unknown User', email: '', role: 'client' }
  }));

  // Return in chronological order (oldest first)
  return enriched.reverse();
};

/**
 * Send a new chat message
 */
const sendMessage = async (data, user) => {
  const { message, channel = 'general' } = data;

  if (!message || !message.trim()) {
    const err = new Error('Message cannot be empty');
    err.statusCode = 400;
    throw err;
  }

  const newMsg = await prisma.teamChatMessage.create({
    data: {
      user_id: user.id,
      channel: channel.trim(),
      message: message.trim()
    }
  });

  return {
    id: newMsg.id,
    message: newMsg.message,
    channel: newMsg.channel,
    created_at: newMsg.created_at,
    updated_at: newMsg.updated_at,
    user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role }
  };
};

/**
 * Delete (soft-delete) a message — only the sender or admin can delete
 */
const deleteMessage = async (id, user) => {
  const msgId = parseInt(id, 10);
  const msg = await prisma.teamChatMessage.findUnique({ where: { id: msgId } });

  if (!msg) {
    const err = new Error('Message not found');
    err.statusCode = 404;
    throw err;
  }

  // Only sender or admin can delete
  if (msg.user_id !== user.id && user.role !== 'admin') {
    const err = new Error('Not authorized to delete this message');
    err.statusCode = 403;
    throw err;
  }

  await prisma.teamChatMessage.update({
    where: { id: msgId },
    data: { is_deleted: true }
  });

  return { deleted: true };
};

/**
 * Get available channels
 */
const getChannels = async () => {
  const results = await prisma.teamChatMessage.groupBy({
    by: ['channel'],
    _count: { id: true },
    where: { is_deleted: false }
  });

  const defaultChannels = [
    { name: 'general', label: '💬 General', description: 'Firm-wide announcements & general discussion' },
    { name: 'case-updates', label: '📋 Case Updates', description: 'Matter-related updates & discussions' },
    { name: 'urgent', label: '🚨 Urgent', description: 'Time-sensitive & urgent messages' },
  ];

  const channelMap = {};
  results.forEach(r => { channelMap[r.channel] = r._count.id; });

  return defaultChannels.map(ch => ({
    ...ch,
    message_count: channelMap[ch.name] || 0
  }));
};

/**
 * Get online team members (users active in the last 15 minutes)
 */
const getOnlineMembers = async (currentUser) => {
  if (currentUser?.id) {
    // Touch last_login_at for active user
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { last_login_at: new Date() }
    }).catch(() => {});
  }

  const cutoff = new Date(Date.now() - 15 * 60 * 1000); // active in last 15 mins
  const users = await prisma.user.findMany({
    where: {
      is_active: true,
      role: { not: 'client' },
    },
    select: { id: true, full_name: true, email: true, role: true, last_login_at: true }
  });

  return users.map(u => ({
    ...u,
    is_online: u.last_login_at && new Date(u.last_login_at) > cutoff
  }));
};

module.exports = { getMessages, sendMessage, deleteMessage, getChannels, getOnlineMembers };
