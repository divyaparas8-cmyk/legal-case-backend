const cron = require('node-cron');
const prisma = require('../../config/db');

// Run every hour
cron.schedule('0 * * * *', async () => {
  await runTaskCronCheck();
});

async function runTaskCronCheck() {
  try {
    const now = new Date();

    // 1. Check official Prisma `Task` model (official schema)
    try {
      const pendingOfficialTasks = await prisma.task.findMany({
        where: {
          status: { notIn: ['completed', 'cancelled', 'Completed', 'Cancelled'] },
          reminder_sent: false,
          OR: [
            { reminder_date: { lte: now } },
            { due_date: { lte: now } }
          ]
        }
      });

      for (const task of pendingOfficialTasks) {
        if (task.assigned_user_id) {
          await prisma.notification.create({
            data: {
              user_id: task.assigned_user_id,
              title: `Reminder: ${task.title}`,
              message: `Task reminder for: ${task.title}`,
              type: 'task_reminder',
              reference_id: task.id
            }
          });
        }

        await prisma.task.update({
          where: { id: task.id },
          data: { reminder_sent: true }
        });
      }
    } catch (prismaErr) {
      console.error('[Task Cron Official Model Error]', prismaErr.message);
    }

    // 2. Check matter_tasks table safely (if present)
    try {
      const pendingReminders = await prisma.$queryRaw`
        SELECT id, title, assigned_user_id 
        FROM matter_tasks 
        WHERE status NOT IN ('Completed', 'Cancelled')
          AND reminder_sent = 0 
          AND due_date IS NOT NULL
          AND DATE_SUB(due_date, INTERVAL reminder_minutes_before MINUTE) <= NOW()
      `;

      if (Array.isArray(pendingReminders)) {
        for (const task of pendingReminders) {
          if (task.assigned_user_id) {
            await prisma.notification.create({
              data: {
                user_id: task.assigned_user_id,
                title: `Reminder: ${task.title}`,
                message: `Task reminder for: ${task.title}`,
                type: 'task_reminder',
                reference_id: task.id
              }
            });
          }

          await prisma.$executeRaw`
            UPDATE matter_tasks 
            SET reminder_sent = 1 
            WHERE id = ${task.id}
          `;
        }
      }
    } catch (rawErr) {
      // Safely ignore if matter_tasks doesn't exist (P2010 / 1146)
      if (rawErr.code !== 'P2010' && !rawErr.message?.includes('matter_tasks')) {
        console.error('[Task Cron matter_tasks Check Error]', rawErr.message);
      }
    }
  } catch (err) {
    console.error('[Task Cron Error]', err);
  }
}

module.exports = { runTaskCronCheck };
