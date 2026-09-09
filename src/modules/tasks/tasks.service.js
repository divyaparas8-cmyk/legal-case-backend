const prisma = require('../../config/db');

/**
 * Initialize dedicated MySQL table `matter_tasks` if it does not already exist.
 */
let dbInitialized = false;
async function ensureTableExists() {
  if (dbInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS matter_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        matter_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_user_id INT,
        due_date DATETIME,
        priority VARCHAR(20) DEFAULT 'Medium',
        status VARCHAR(20) DEFAULT 'Pending',
        recurrence VARCHAR(20) DEFAULT 'One Time',
        depends_on_task_id INT,
        reminder_minutes_before INT DEFAULT 60,
        reminder_type VARCHAR(20) DEFAULT 'System',
        reminder_sent TINYINT(1) DEFAULT 0,
        completed_at DATETIME,
        created_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_matter (matter_id),
        INDEX idx_assigned_user (assigned_user_id),
        INDEX idx_due_date (due_date),
        INDEX idx_status (status),
        INDEX idx_depends_on (depends_on_task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    dbInitialized = true;
  } catch (err) {
    console.error('Failed to initialize matter_tasks table:', err);
  }
}

/**
 * Helper to fetch user details by ID
 */
async function getUserInfo(userId) {
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      select: { id: true, full_name: true, email: true, role: true }
    });
    return user;
  } catch (e) {
    return null;
  }
}

/**
 * Calculate next due date for recurring tasks
 */
function getNextRecurringDueDate(currentDueDate, recurrence) {
  if (!currentDueDate || recurrence === 'One Time') return null;
  const dt = new Date(currentDueDate);
  if (recurrence === 'Daily') dt.setDate(dt.getDate() + 1);
  else if (recurrence === 'Weekly') dt.setDate(dt.getDate() + 7);
  else if (recurrence === 'Monthly') dt.setMonth(dt.getMonth() + 1);
  else if (recurrence === 'Yearly') dt.setFullYear(dt.getFullYear() + 1);
  return dt;
}

const getMatterTasks = async (matterId, query = {}, user) => {
  await ensureTableExists();
  const mId = parseInt(matterId, 10);
  const { q = '', status = 'All', priority = 'All', assigned_user_id = 'All', sort = 'Due Soon' } = query;

  const rows = await prisma.$queryRawUnsafe(`
    SELECT * FROM matter_tasks 
    WHERE matter_id = ${mId}
    ORDER BY due_date ASC
  `);

  if (!Array.isArray(rows)) return [];

  const now = new Date();

  // Map and enrich tasks
  const enriched = await Promise.all(
    rows.map(async t => {
      const assignedUser = await getUserInfo(t.assigned_user_id);
      
      let dependsOnTask = null;
      if (t.depends_on_task_id) {
        const depRows = await prisma.$queryRawUnsafe(`SELECT id, title, status FROM matter_tasks WHERE id = ${t.depends_on_task_id}`);
        if (Array.isArray(depRows) && depRows.length > 0) {
          dependsOnTask = depRows[0];
        }
      }

      const dueDate = t.due_date ? new Date(t.due_date) : null;
      const isCompleted = t.status === 'Completed' || t.status === 'Cancelled';
      const isOverdue = dueDate && dueDate < now && !isCompleted;

      return {
        id: t.id,
        matter_id: t.matter_id,
        title: t.title,
        description: t.description || '',
        assigned_user_id: t.assigned_user_id,
        assigned_user: assignedUser || (t.assigned_user_id ? { id: t.assigned_user_id, full_name: `User #${t.assigned_user_id}` } : null),
        due_date: t.due_date,
        priority: t.priority || 'Medium',
        status: t.status || 'Pending',
        recurrence: t.recurrence || 'One Time',
        depends_on_task_id: t.depends_on_task_id,
        depends_on_task: dependsOnTask,
        reminder_minutes_before: t.reminder_minutes_before || 60,
        reminder_type: t.reminder_type || 'System',
        reminder_sent: Boolean(t.reminder_sent),
        completed_at: t.completed_at,
        is_overdue: isOverdue,
        created_by: t.created_by,
        created_at: t.created_at,
        updated_at: t.updated_at
      };
    })
  );

  // Filter logic
  let filtered = enriched;

  if (status && status !== 'All') {
    if (status === 'Overdue') {
      filtered = filtered.filter(t => t.is_overdue);
    } else {
      filtered = filtered.filter(t => t.status === status);
    }
  }

  if (priority && priority !== 'All') {
    filtered = filtered.filter(t => t.priority === priority);
  }

  if (assigned_user_id && assigned_user_id !== 'All') {
    const uid = parseInt(assigned_user_id, 10);
    filtered = filtered.filter(t => t.assigned_user_id === uid);
  }

  if (q && q.trim()) {
    const s = q.trim().toLowerCase();
    filtered = filtered.filter(t => {
      const titleMatch = (t.title || '').toLowerCase().includes(s);
      const descMatch = (t.description || '').toLowerCase().includes(s);
      const userMatch = (t.assigned_user?.full_name || '').toLowerCase().includes(s);
      return titleMatch || descMatch || userMatch;
    });
  }

  // Sort
  if (sort === 'Due Later') {
    filtered.sort((a, b) => new Date(b.due_date || '9999-12-31') - new Date(a.due_date || '9999-12-31'));
  } else if (sort === 'Priority') {
    const pRank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    filtered.sort((a, b) => (pRank[b.priority] || 0) - (pRank[a.priority] || 0));
  } else {
    filtered.sort((a, b) => new Date(a.due_date || '9999-12-31') - new Date(b.due_date || '9999-12-31'));
  }

  // Compute summary stats
  const pendingCount = enriched.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
  const overdueCount = enriched.filter(t => t.is_overdue).length;
  const completedCount = enriched.filter(t => t.status === 'Completed').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const dueTodayCount = enriched.filter(t => t.due_date && new Date(t.due_date).toISOString().split('T')[0] === todayStr && t.status !== 'Completed').length;

  return {
    tasks: filtered,
    stats: {
      pending: pendingCount,
      overdue: overdueCount,
      completed: completedCount,
      due_today: dueTodayCount,
      total: enriched.length
    }
  };
};

const createTask = async (matterId, data, user) => {
  await ensureTableExists();
  const mId = parseInt(matterId, 10);
  const {
    title,
    description = '',
    assigned_user_id = null,
    due_date = null,
    priority = 'Medium',
    status = 'Pending',
    recurrence = 'One Time',
    depends_on_task_id = null,
    reminder_minutes_before = 60,
    reminder_type = 'System'
  } = data;

  if (!title || !title.trim()) {
    const err = new Error('Task Title is required.');
    err.statusCode = 400;
    throw err;
  }

  const cleanTitle = title.trim();
  const cleanDesc = description ? description.trim() : '';
  const assignUid = assigned_user_id ? parseInt(assigned_user_id, 10) : null;
  const dDate = due_date ? `'${new Date(due_date).toISOString().slice(0, 19).replace('T', ' ')}'` : 'NULL';
  const depId = depends_on_task_id ? parseInt(depends_on_task_id, 10) : null;
  const userId = user?.id ? parseInt(user.id, 10) : null;

  await prisma.$executeRawUnsafe(`
    INSERT INTO matter_tasks (
      matter_id, title, description, assigned_user_id, due_date, priority, status,
      recurrence, depends_on_task_id, reminder_minutes_before, reminder_type, reminder_sent, created_by, created_at, updated_at
    )
    VALUES (
      ${mId}, '${cleanTitle.replace(/'/g, "''")}', ${cleanDesc ? `'${cleanDesc.replace(/'/g, "''")}'` : 'NULL'},
      ${assignUid || 'NULL'}, ${dDate}, '${priority}', '${status}',
      '${recurrence}', ${depId || 'NULL'}, ${parseInt(reminder_minutes_before, 10) || 60}, '${reminder_type}', 0,
      ${userId || 'NULL'}, NOW(), NOW()
    )
  `);

  const assignedUser = assignUid ? await getUserInfo(assignUid) : null;

  // Log Activity to Timeline
  await prisma.activity.create({
    data: {
      matter_id: mId,
      entity_type: 'matter',
      entity_id: mId,
      action: 'task_created',
      description: `Task "${cleanTitle}" created (Priority: ${priority}, Assigned: ${assignedUser?.full_name || 'Unassigned'})`,
      actor_user_id: user?.id || null
    }
  });

  return await getMatterTasks(mId, {}, user);
};

const updateTask = async (id, data, user) => {
  await ensureTableExists();
  const tId = parseInt(id, 10);

  const existingRows = await prisma.$queryRawUnsafe(`SELECT * FROM matter_tasks WHERE id = ${tId}`);
  if (!Array.isArray(existingRows) || existingRows.length === 0) {
    const err = new Error('Task not found.');
    err.statusCode = 404;
    throw err;
  }

  const existing = existingRows[0];
  const {
    title,
    description,
    assigned_user_id,
    due_date,
    priority,
    status,
    recurrence,
    depends_on_task_id,
    reminder_minutes_before,
    reminder_type
  } = data;

  const cleanTitle = (title !== undefined ? title : existing.title).trim();
  const cleanDesc = description !== undefined ? description.trim() : (existing.description || '');
  const assignUid = assigned_user_id !== undefined ? (assigned_user_id ? parseInt(assigned_user_id, 10) : null) : existing.assigned_user_id;
  const newStatus = status !== undefined ? status : existing.status;
  const newPriority = priority !== undefined ? priority : existing.priority;
  const newRecurrence = recurrence !== undefined ? recurrence : existing.recurrence;
  const depId = depends_on_task_id !== undefined ? (depends_on_task_id ? parseInt(depends_on_task_id, 10) : null) : existing.depends_on_task_id;
  const rMin = reminder_minutes_before !== undefined ? parseInt(reminder_minutes_before, 10) : existing.reminder_minutes_before;
  const rType = reminder_type !== undefined ? reminder_type : existing.reminder_type;

  const rawDueDate = due_date !== undefined ? due_date : existing.due_date;
  const dDate = rawDueDate ? `'${new Date(rawDueDate).toISOString().slice(0, 19).replace('T', ' ')}'` : 'NULL';

  let completedAtSql = existing.completed_at ? `'${new Date(existing.completed_at).toISOString().slice(0, 19).replace('T', ' ')}'` : 'NULL';
  if (newStatus === 'Completed' && existing.status !== 'Completed') {
    completedAtSql = 'NOW()';
  } else if (newStatus !== 'Completed' && existing.status === 'Completed') {
    completedAtSql = 'NULL';
  }

  await prisma.$executeRawUnsafe(`
    UPDATE matter_tasks
    SET title = '${cleanTitle.replace(/'/g, "''")}',
        description = ${cleanDesc ? `'${cleanDesc.replace(/'/g, "''")}'` : 'NULL'},
        assigned_user_id = ${assignUid || 'NULL'},
        due_date = ${dDate},
        priority = '${newPriority}',
        status = '${newStatus}',
        recurrence = '${newRecurrence}',
        depends_on_task_id = ${depId || 'NULL'},
        reminder_minutes_before = ${rMin || 60},
        reminder_type = '${rType}',
        completed_at = ${completedAtSql},
        updated_at = NOW()
    WHERE id = ${tId}
  `);

  // Handle Recurring Tasks: If task completed and has recurrence, spawn next task instance!
  if (newStatus === 'Completed' && existing.status !== 'Completed' && newRecurrence && newRecurrence !== 'One Time' && rawDueDate) {
    const nextDueDate = getNextRecurringDueDate(rawDueDate, newRecurrence);
    if (nextDueDate) {
      const nextDateSql = `'${nextDueDate.toISOString().slice(0, 19).replace('T', ' ')}'`;
      await prisma.$executeRawUnsafe(`
        INSERT INTO matter_tasks (
          matter_id, title, description, assigned_user_id, due_date, priority, status,
          recurrence, depends_on_task_id, reminder_minutes_before, reminder_type, reminder_sent, created_by, created_at, updated_at
        )
        VALUES (
          ${existing.matter_id}, '${cleanTitle.replace(/'/g, "''")}', ${cleanDesc ? `'${cleanDesc.replace(/'/g, "''")}'` : 'NULL'},
          ${assignUid || 'NULL'}, ${nextDateSql}, '${newPriority}', 'Pending',
          '${newRecurrence}', ${depId || 'NULL'}, ${rMin || 60}, '${rType}', 0,
          ${user?.id || 'NULL'}, NOW(), NOW()
        )
      `);
    }
  }

  const isCompletedNow = newStatus === 'Completed' && existing.status !== 'Completed';
  const actionType = isCompletedNow ? 'task_completed' : 'task_updated';

  // Log Activity to Timeline
  await prisma.activity.create({
    data: {
      matter_id: existing.matter_id,
      entity_type: 'matter',
      entity_id: existing.matter_id,
      action: actionType,
      description: isCompletedNow ? `Completed task "${cleanTitle}"` : `Updated task "${cleanTitle}" (Status: ${newStatus}, Priority: ${newPriority})`,
      actor_user_id: user?.id || null
    }
  });

  return await getMatterTasks(existing.matter_id, {}, user);
};

const deleteTask = async (id, user) => {
  await ensureTableExists();
  const tId = parseInt(id, 10);

  const existingRows = await prisma.$queryRawUnsafe(`SELECT * FROM matter_tasks WHERE id = ${tId}`);
  if (!Array.isArray(existingRows) || existingRows.length === 0) {
    const err = new Error('Task not found.');
    err.statusCode = 404;
    throw err;
  }

  const existing = existingRows[0];

  await prisma.$executeRawUnsafe(`DELETE FROM matter_tasks WHERE id = ${tId}`);

  // Log Activity to Timeline
  await prisma.activity.create({
    data: {
      matter_id: existing.matter_id,
      entity_type: 'matter',
      entity_id: existing.matter_id,
      action: 'task_deleted',
      description: `Deleted task "${existing.title}"`,
      actor_user_id: user?.id || null
    }
  });

  return { success: true, deleted_id: tId };
};

const getAllTasks = async (query = {}, user) => {
  await ensureTableExists();
  const { q = '', status = 'All', priority = 'All' } = query;

  let whereSql = '';
  if (user?.role === 'client') {
    const clientMatters = await prisma.matter.findMany({
      where: {
        OR: [
          { client: { user_id: user.id } },
          { parties: { some: { user_id: user.id } } }
        ]
      },
      select: { id: true }
    });
    const matterIds = clientMatters.map(m => m.id);
    if (matterIds.length === 0) return [];
    whereSql = `WHERE matter_id IN (${matterIds.join(',')})`;
  }

  const rows = await prisma.$queryRawUnsafe(`
    SELECT * FROM matter_tasks 
    ${whereSql}
    ORDER BY due_date ASC
  `);

  if (!Array.isArray(rows)) return [];

  const now = new Date();

  const enriched = await Promise.all(
    rows.map(async t => {
      const assignedUser = await getUserInfo(t.assigned_user_id);
      const dueDate = t.due_date ? new Date(t.due_date) : null;
      const isCompleted = t.status === 'Completed' || t.status === 'completed' || t.status === 'Cancelled';
      const isOverdue = dueDate && dueDate < now && !isCompleted;

      return {
        id: t.id,
        matter_id: t.matter_id,
        title: t.title,
        description: t.description || '',
        assigned_user_id: t.assigned_user_id,
        assigned_user: assignedUser || (t.assigned_user_id ? { id: t.assigned_user_id, full_name: `User #${t.assigned_user_id}` } : null),
        due_date: t.due_date,
        priority: t.priority || 'Medium',
        status: t.status || 'Pending',
        recurrence: t.recurrence || 'One Time',
        completed_at: t.completed_at,
        is_overdue: isOverdue,
        created_at: t.created_at,
        updated_at: t.updated_at
      };
    })
  );

  let filtered = enriched;
  if (status && status !== 'All') {
    filtered = filtered.filter(t => (t.status || '').toLowerCase() === status.toLowerCase());
  }

  if (priority && priority !== 'All') {
    filtered = filtered.filter(t => (t.priority || '').toLowerCase() === priority.toLowerCase());
  }

  if (q && q.trim()) {
    const s = q.trim().toLowerCase();
    filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(s) || (t.description || '').toLowerCase().includes(s));
  }

  return filtered;
};

const completeTask = async (taskId, user) => {
  return updateTask(taskId, { status: 'completed', completed_at: new Date().toISOString() }, user);
};

module.exports = {
  getMatterTasks,
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask
};
