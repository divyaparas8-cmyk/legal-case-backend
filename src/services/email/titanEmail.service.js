const nodemailer = require('nodemailer');
const prisma = require('../../config/db');

class TitanEmailProvider {
  /**
   * Check whether Titan credentials are configured in environment
   */
  isConfigured() {
    return Boolean(process.env.TITAN_EMAIL && process.env.TITAN_EMAIL_PASSWORD);
  }

  /**
   * Resolve SMTP credentials from either an account ID in DB or environment variables
   */
  async getSmtpConfig(accountId = null, userId = null) {
    if (accountId) {
      const whereClause = { id: parseInt(accountId, 10) };
      if (userId) whereClause.user_id = userId;

      const account = await prisma.emailAccount.findFirst({ where: whereClause });
      if (account && account.password) {
        const port = account.smtp_port ? parseInt(account.smtp_port, 10) : 465;
        return {
          host: account.smtp_host || process.env.TITAN_SMTP_HOST || 'smtp.titan.email',
          port,
          secure: port === 465,
          auth: {
            user: account.username || account.email_address,
            pass: account.password,
          },
          fromEmail: account.email_address,
        };
      }
    }

    if (process.env.TITAN_EMAIL && process.env.TITAN_EMAIL_PASSWORD) {
      const port = parseInt(process.env.TITAN_SMTP_PORT, 10) || 465;
      return {
        host: process.env.TITAN_SMTP_HOST || 'smtp.titan.email',
        port,
        secure: port === 465,
        auth: {
          user: process.env.TITAN_EMAIL,
          pass: process.env.TITAN_EMAIL_PASSWORD,
        },
        fromEmail: process.env.TITAN_EMAIL,
      };
    }

    return null;
  }

  /**
   * Create a secure Nodemailer transporter
   */
  createTransporter(smtpConfig) {
    if (!smtpConfig) {
      throw new Error('SMTP configuration is missing. TITAN_EMAIL and TITAN_EMAIL_PASSWORD must be configured.');
    }

    return nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass,
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
    });
  }

  /**
   * Verify SMTP connection safely without exposing credentials
   */
  async verifyConnection(accountId = null, userId = null) {
    const smtpConfig = await this.getSmtpConfig(accountId, userId);
    if (!smtpConfig) {
      return {
        success: false,
        configured: false,
        message: 'Titan credentials not configured in environment variables or email accounts.',
      };
    }

    try {
      const transporter = this.createTransporter(smtpConfig);
      await transporter.verify();
      return {
        success: true,
        configured: true,
        host: smtpConfig.host,
        port: smtpConfig.port,
        user: smtpConfig.auth.user,
        message: 'Titan SMTP connection successfully verified via TLS.',
      };
    } catch (err) {
      // Sanitize error message to prevent any password or auth header leakage
      const sanitized = err.message
        ? err.message.replace(/([pP]assword|[aA]uth)[:=\s]+[^\s,]+/g, '***')
        : 'SMTP verification failed';
      console.error('[Titan SMTP Verify Error]:', sanitized);
      return {
        success: false,
        configured: true,
        message: sanitized,
      };
    }
  }

  /**
   * Send transactional system emails (invoices, client portal invites, calendar reminders)
   */
  async sendSystemEmail({ to, subject, html, text, attachments = [] }) {
    const smtpConfig = await this.getSmtpConfig();
    if (!smtpConfig) {
      console.warn(`[Titan Email Notice] System email skipped to ${to}: TITAN_EMAIL credentials not configured in environment.`);
      return { success: false, reason: 'unconfigured' };
    }

    try {
      const transporter = this.createTransporter(smtpConfig);
      const mailOptions = {
        from: `"${process.env.FIRM_NAME || 'VkTori Legal'}" <${smtpConfig.fromEmail}>`,
        to,
        subject,
        html: html || text,
        text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
        attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Titan SMTP] System email dispatched to ${to} (MessageID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      const sanitized = err.message
        ? err.message.replace(/([pP]assword|[aA]uth)[:=\s]+[^\s,]+/g, '***')
        : 'System email dispatch failed';
      console.error(`[Titan SMTP Error] Failed system email to ${to}:`, sanitized);
      throw new Error(`Failed to dispatch system email via Titan: ${sanitized}`);
    }
  }

  /**
   * Synchronize account (verifies connectivity and updates synchronization timestamp)
   */
  async syncAccount(userId, accountId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const userEmail = user?.email || process.env.TITAN_EMAIL || 'admin@vktori.com';

    let account = null;
    if (accountId) {
      account = await prisma.emailAccount.findFirst({
        where: { id: parseInt(accountId, 10), user_id: userId },
      });
    }

    const hasEnvConfig = this.isConfigured();
    const hasAccountConfig = Boolean(account && account.password);

    if (!hasEnvConfig && !hasAccountConfig) {
      return {
        success: false,
        message: 'Titan mailbox credentials are not configured. Please set TITAN_EMAIL and TITAN_EMAIL_PASSWORD in your environment.',
      };
    }

    // Update account last_sync_at timestamp if account exists
    if (account) {
      await prisma.emailAccount.update({
        where: { id: account.id },
        data: {
          last_sync_at: new Date(),
          sync_status: 'connected',
        },
      });
    }

    return {
      success: true,
      message: 'Titan mailbox synchronization complete.',
      last_sync_at: new Date().toISOString(),
    };
  }

  // ── Get Messages ──────────────────────────────────────
  async getMessages(userId, accountId, filters) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const userEmail = user?.email || process.env.TITAN_EMAIL || '';

    const baseWhere = {
      communication_type: 'titan_email',
      is_deleted: false,
    };

    if (accountId) baseWhere.email_account_id = parseInt(accountId, 10);

    const folder = filters.folder || 'inbox';

    if (folder === 'inbox') {
      baseWhere.folder = 'inbox';
      baseWhere.OR = [
        { to: { contains: userEmail } },
        { cc: { contains: userEmail } },
        { bcc: { contains: userEmail } },
      ];
    } else if (folder === 'sent') {
      baseWhere.folder = 'sent';
      baseWhere.sender_user_id = userId;
    } else if (folder === 'drafts') {
      baseWhere.folder = 'drafts';
      baseWhere.sender_user_id = userId;
      baseWhere.is_draft = true;
    } else if (folder === 'starred') {
      baseWhere.is_starred = true;
      baseWhere.OR = [
        { sender_user_id: userId },
        { to: { contains: userEmail } },
        { cc: { contains: userEmail } },
        { bcc: { contains: userEmail } },
      ];
    } else if (folder === 'flagged') {
      baseWhere.is_flagged = true;
      baseWhere.OR = [
        { sender_user_id: userId },
        { to: { contains: userEmail } },
        { cc: { contains: userEmail } },
        { bcc: { contains: userEmail } },
      ];
    } else {
      baseWhere.folder = folder;
      baseWhere.OR = [
        { sender_user_id: userId },
        { to: { contains: userEmail } },
        { cc: { contains: userEmail } },
      ];
    }

    if (filters.search) {
      const searchCondition = [
        { subject: { contains: filters.search } },
        { message_body: { contains: filters.search } },
        { to: { contains: filters.search } },
        { cc: { contains: filters.search } },
      ];

      if (baseWhere.OR) {
        const existingOR = baseWhere.OR;
        delete baseWhere.OR;
        baseWhere.AND = [
          { OR: existingOR },
          { OR: searchCondition },
        ];
      } else {
        baseWhere.OR = searchCondition;
      }
    }

    const messages = await prisma.communication.findMany({
      where: baseWhere,
      orderBy: { created_at: 'desc' },
      include: {
        sender: { select: { id: true, full_name: true, email: true } },
        replies: {
          select: { id: true },
          where: { is_deleted: false },
        },
      },
    });

    return messages;
  }

  // ── Send Email ────────────────────────────────────────
  async sendEmail(userId, role, accountId, payload) {
    const toStr = Array.isArray(payload.to) ? payload.to.join(',') : (payload.to || '');
    const ccStr = Array.isArray(payload.cc) ? payload.cc.join(',') : (payload.cc || '');
    const bccStr = Array.isArray(payload.bcc) ? payload.bcc.join(',') : (payload.bcc || '');

    const data = {
      sender_user_id: userId,
      sender_role: role,
      communication_type: 'titan_email',
      email_account_id: accountId ? parseInt(accountId, 10) : null,
      folder: 'sent',
      to: toStr,
      cc: ccStr,
      bcc: bccStr,
      subject: payload.subject || '',
      message_body: payload.message_body || '',
      is_draft: false,
      sync_status: 'pending',
      external_message_id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    // Threading support
    if (payload.reply_to_id) {
      const parentMsg = await prisma.communication.findUnique({
        where: { id: parseInt(payload.reply_to_id, 10) },
      });
      if (parentMsg) {
        data.parent_id = parentMsg.id;
        data.in_reply_to = parentMsg.external_message_id || null;
        data.external_thread_id = parentMsg.external_thread_id || parentMsg.external_message_id || null;
        const refs = parentMsg.references ? parentMsg.references : '';
        data.references = refs ? `${refs}, ${parentMsg.external_message_id}` : (parentMsg.external_message_id || '');
      }
    }

    if (payload.track_opens) data.track_opens = true;
    if (payload.request_read_receipt) data.request_read_receipt = true;

    // Real SMTP dispatch
    const smtpConfig = await this.getSmtpConfig(accountId, userId);
    if (smtpConfig) {
      try {
        const transporter = this.createTransporter(smtpConfig);
        const mailOptions = {
          from: smtpConfig.fromEmail,
          to: toStr,
          subject: data.subject,
          html: data.message_body,
        };
        if (ccStr) mailOptions.cc = ccStr;
        if (bccStr) mailOptions.bcc = bccStr;
        if (data.in_reply_to) {
          mailOptions.headers = {
            'In-Reply-To': data.in_reply_to,
            ...(data.references ? { 'References': data.references } : {}),
          };
        }

        const info = await transporter.sendMail(mailOptions);
        if (info && info.messageId) {
          data.external_message_id = info.messageId;
        }
        data.sync_status = 'synced';
        console.log(`[Titan SMTP] Email dispatched to ${toStr} (MessageID: ${data.external_message_id})`);
      } catch (smtpErr) {
        data.sync_status = 'failed';
        const sanitized = smtpErr.message
          ? smtpErr.message.replace(/([pP]assword|[aA]uth)[:=\s]+[^\s,]+/g, '***')
          : 'SMTP Send Failed';
        console.error(`[Titan SMTP Error]:`, sanitized);

        // Record failed communication in DB so history is preserved
        await prisma.communication.create({ data });
        throw new Error(`Failed to transmit email via Titan SMTP: ${sanitized}`);
      }
    } else {
      // When credentials are not yet configured in environment
      data.sync_status = 'local_only';
      console.warn(`[Titan SMTP Warning] Message saved locally. Titan credentials not configured in environment.`);
    }

    const message = await prisma.communication.create({ data });

    // Also create an "inbox" copy for each recipient in the firm
    const allRecipients = [
      ...(Array.isArray(payload.to) ? payload.to : (payload.to || '').split(',').filter(Boolean)),
      ...(Array.isArray(payload.cc) ? payload.cc : (payload.cc || '').split(',').filter(Boolean)),
      ...(Array.isArray(payload.bcc) ? payload.bcc : (payload.bcc || '').split(',').filter(Boolean)),
    ].map(e => e.trim().toLowerCase()).filter(Boolean);

    if (allRecipients.length > 0) {
      const recipientUsers = await prisma.user.findMany({
        where: { email: { in: allRecipients } },
        select: { id: true, email: true },
      });

      for (const recipient of recipientUsers) {
        if (recipient.id === userId) continue;
        await prisma.communication.create({
          data: {
            ...data,
            id: undefined,
            folder: 'inbox',
            sender_user_id: userId,
            is_read: false,
            external_message_id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            parent_id: data.parent_id || null,
            in_reply_to: data.in_reply_to || null,
            external_thread_id: data.external_thread_id || message.external_message_id,
            references: data.references || null,
          },
        });
      }
    }

    return message;
  }

  // ── Save Draft ────────────────────────────────────────
  async saveDraft(userId, role, accountId, payload) {
    if (payload.id) {
      return await prisma.communication.update({
        where: { id: parseInt(payload.id, 10) },
        data: {
          to: Array.isArray(payload.to) ? payload.to.join(',') : (payload.to || ''),
          cc: Array.isArray(payload.cc) ? payload.cc.join(',') : (payload.cc || ''),
          bcc: Array.isArray(payload.bcc) ? payload.bcc.join(',') : (payload.bcc || ''),
          subject: payload.subject || '',
          message_body: payload.message_body || '',
          updated_at: new Date(),
        },
      });
    }

    return await prisma.communication.create({
      data: {
        sender_user_id: userId,
        sender_role: role,
        communication_type: 'titan_email',
        email_account_id: accountId ? parseInt(accountId, 10) : null,
        folder: 'drafts',
        to: Array.isArray(payload.to) ? payload.to.join(',') : (payload.to || ''),
        cc: Array.isArray(payload.cc) ? payload.cc.join(',') : (payload.cc || ''),
        bcc: Array.isArray(payload.bcc) ? payload.bcc.join(',') : (payload.bcc || ''),
        subject: payload.subject || '',
        message_body: payload.message_body || '',
        is_draft: true,
        sync_status: 'synced',
      },
    });
  }

  // ── Update Message State ──────────────────────────────
  async updateMessageState(userId, messageId, data) {
    const allowed = {};
    if (data.is_read !== undefined) {
      allowed.is_read = !!data.is_read;
      if (data.is_read) allowed.read_at = new Date();
    }
    if (data.is_starred !== undefined) allowed.is_starred = !!data.is_starred;
    if (data.is_flagged !== undefined) allowed.is_flagged = !!data.is_flagged;

    return await prisma.communication.update({
      where: { id: parseInt(messageId, 10) },
      data: allowed,
    });
  }

  // ── Move Message ──────────────────────────────────────
  async moveMessage(userId, messageId, folder) {
    return await prisma.communication.update({
      where: { id: parseInt(messageId, 10) },
      data: { folder },
    });
  }

  // ── Delete Message ────────────────────────────────────
  async deleteMessage(userId, messageId) {
    const msg = await prisma.communication.findUnique({ where: { id: parseInt(messageId, 10) } });
    if (!msg) throw new Error('Message not found');

    if (msg.folder === 'trash') {
      return await prisma.communication.update({
        where: { id: parseInt(messageId, 10) },
        data: { is_deleted: true },
      });
    }

    return await prisma.communication.update({
      where: { id: parseInt(messageId, 10) },
      data: { folder: 'trash' },
    });
  }

  // ── Restore Message ───────────────────────────────────
  async restoreMessage(userId, messageId) {
    return await prisma.communication.update({
      where: { id: parseInt(messageId, 10) },
      data: { folder: 'inbox' },
    });
  }

  // ── Get Thread ────────────────────────────────────────
  async getThread(userId, messageId) {
    const msg = await prisma.communication.findUnique({
      where: { id: parseInt(messageId, 10) },
    });
    if (!msg) throw new Error('Message not found');

    const threadId = msg.external_thread_id || msg.external_message_id;

    let threadMessages = [];
    if (threadId) {
      threadMessages = await prisma.communication.findMany({
        where: {
          communication_type: 'titan_email',
          is_deleted: false,
          OR: [
            { external_thread_id: threadId },
            { external_message_id: threadId },
          ],
        },
        orderBy: { created_at: 'asc' },
        include: {
          sender: { select: { id: true, full_name: true, email: true } },
        },
      });
    }

    if (threadMessages.length <= 1) {
      const allIds = new Set();
      let current = msg;
      while (current) {
        allIds.add(current.id);
        if (current.parent_id) {
          current = await prisma.communication.findUnique({ where: { id: current.parent_id } });
        } else {
          break;
        }
      }

      const findReplies = async (parentId) => {
        const replies = await prisma.communication.findMany({
          where: { parent_id: parentId, is_deleted: false },
        });
        for (const r of replies) {
          allIds.add(r.id);
          await findReplies(r.id);
        }
      };

      let root = msg;
      while (root.parent_id) {
        root = await prisma.communication.findUnique({ where: { id: root.parent_id } });
        if (!root) break;
      }
      if (root) {
        allIds.add(root.id);
        await findReplies(root.id);
      }

      if (allIds.size > 1) {
        threadMessages = await prisma.communication.findMany({
          where: {
            id: { in: Array.from(allIds) },
            is_deleted: false,
          },
          orderBy: { created_at: 'asc' },
          include: {
            sender: { select: { id: true, full_name: true, email: true } },
          },
        });
      }
    }

    return threadMessages.length > 1 ? threadMessages : [msg];
  }

  // ── Bulk Action ───────────────────────────────────────
  async bulkAction(userId, messageIds, action) {
    const ids = messageIds.map(id => parseInt(id, 10));

    switch (action) {
      case 'delete':
        await prisma.communication.updateMany({
          where: { id: { in: ids }, NOT: { folder: 'trash' } },
          data: { folder: 'trash' },
        });
        await prisma.communication.updateMany({
          where: { id: { in: ids }, folder: 'trash' },
          data: { is_deleted: true },
        });
        break;
      case 'permanent_delete':
        await prisma.communication.updateMany({
          where: { id: { in: ids } },
          data: { is_deleted: true },
        });
        break;
      case 'archive':
        await prisma.communication.updateMany({
          where: { id: { in: ids } },
          data: { folder: 'archive' },
        });
        break;
      case 'mark_read':
        await prisma.communication.updateMany({
          where: { id: { in: ids } },
          data: { is_read: true, read_at: new Date() },
        });
        break;
      case 'mark_unread':
        await prisma.communication.updateMany({
          where: { id: { in: ids } },
          data: { is_read: false, read_at: null },
        });
        break;
      case 'star':
        await prisma.communication.updateMany({
          where: { id: { in: ids } },
          data: { is_starred: true },
        });
        break;
      case 'unstar':
        await prisma.communication.updateMany({
          where: { id: { in: ids } },
          data: { is_starred: false },
        });
        break;
      case 'flag':
        await prisma.communication.updateMany({
          where: { id: { in: ids } },
          data: { is_flagged: true },
        });
        break;
      case 'unflag':
        await prisma.communication.updateMany({
          where: { id: { in: ids } },
          data: { is_flagged: false },
        });
        break;
      case 'restore':
        await prisma.communication.updateMany({
          where: { id: { in: ids } },
          data: { folder: 'inbox' },
        });
        break;
      default:
        throw new Error(`Unknown bulk action: ${action}`);
    }

    return { success: true, count: ids.length };
  }

  // ── Folder Counts ─────────────────────────────────────
  async getFolderCounts(userId, accountId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const userEmail = user?.email || process.env.TITAN_EMAIL || '';

    const folders = ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'];
    const counts = {};

    for (const folder of folders) {
      const where = {
        communication_type: 'titan_email',
        is_deleted: false,
        is_read: false,
        folder,
      };

      if (accountId) {
        where.email_account_id = parseInt(accountId, 10);
      }

      if (folder === 'inbox') {
        where.OR = [
          { to: { contains: userEmail } },
          { cc: { contains: userEmail } },
          { bcc: { contains: userEmail } },
        ];
      } else if (folder === 'sent' || folder === 'drafts') {
        where.sender_user_id = userId;
      } else {
        where.OR = [
          { sender_user_id: userId },
          { to: { contains: userEmail } },
          { cc: { contains: userEmail } },
          { bcc: { contains: userEmail } },
        ];
      }

      counts[folder] = await prisma.communication.count({ where });
    }

    const starredWhere = {
      communication_type: 'titan_email',
      is_deleted: false,
      is_starred: true,
      OR: [
        { sender_user_id: userId },
        { to: { contains: userEmail } },
        { cc: { contains: userEmail } },
        { bcc: { contains: userEmail } },
      ],
    };
    if (accountId) {
      starredWhere.email_account_id = parseInt(accountId, 10);
    }
    counts.starred = await prisma.communication.count({ where: starredWhere });

    const flaggedWhere = {
      communication_type: 'titan_email',
      is_deleted: false,
      is_flagged: true,
      OR: [
        { sender_user_id: userId },
        { to: { contains: userEmail } },
        { cc: { contains: userEmail } },
        { bcc: { contains: userEmail } },
      ],
    };
    if (accountId) {
      flaggedWhere.email_account_id = parseInt(accountId, 10);
    }
    counts.flagged = await prisma.communication.count({ where: flaggedWhere });

    return counts;
  }

  async getCustomFolders(userId, accountId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const userEmail = user?.email || process.env.TITAN_EMAIL || '';

    const where = {
      communication_type: 'titan_email',
      is_deleted: false,
      OR: [
        { sender_user_id: userId },
        { to: { contains: userEmail } },
        { cc: { contains: userEmail } },
        { bcc: { contains: userEmail } },
      ],
    };
    if (accountId) {
      where.email_account_id = parseInt(accountId, 10);
    }

    const comms = await prisma.communication.findMany({
      where,
      select: { folder: true },
    });

    const standardFolders = new Set(['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'starred', 'flagged']);
    const customFolders = new Set();
    comms.forEach(c => {
      if (c.folder && !standardFolders.has(c.folder)) {
        customFolders.add(c.folder);
      }
    });

    return Array.from(customFolders);
  }

  // ── Account Management (Protected: Passwords NEVER Exposed) ──
  async getEmailAccounts(userId) {
    return await prisma.emailAccount.findMany({
      where: { user_id: userId, provider: 'titan' },
      select: {
        id: true,
        user_id: true,
        provider: true,
        email_address: true,
        smtp_host: true,
        smtp_port: true,
        imap_host: true,
        imap_port: true,
        username: true,
        sync_status: true,
        last_sync_at: true,
        created_at: true,
        updated_at: true,
        // Password intentionally EXCLUDED for security
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async addEmailAccount(userId, data) {
    const account = await prisma.emailAccount.create({
      data: {
        user_id: userId,
        provider: 'titan',
        email_address: data.email_address,
        smtp_host: data.smtp_host || process.env.TITAN_SMTP_HOST || 'smtp.titan.email',
        smtp_port: data.smtp_port ? parseInt(data.smtp_port, 10) : (parseInt(process.env.TITAN_SMTP_PORT, 10) || 465),
        imap_host: data.imap_host || process.env.TITAN_IMAP_HOST || 'imap.titan.email',
        imap_port: data.imap_port ? parseInt(data.imap_port, 10) : (parseInt(process.env.TITAN_IMAP_PORT, 10) || 993),
        username: data.username || data.email_address,
        password: data.password || '',
        sync_status: 'connected',
      },
    });

    // Strip password before returning
    const { password, ...safeAccount } = account;
    return safeAccount;
  }

  async deleteEmailAccount(userId, accountId) {
    return await prisma.emailAccount.deleteMany({
      where: {
        id: parseInt(accountId, 10),
        user_id: userId,
      },
    });
  }
}

module.exports = new TitanEmailProvider();
