const prisma = require('../../config/db');
const billingService = require('../billing/billing.service');

/**
 * Get active timer for a user
 */
const getActive = async (userId) => {
  return await prisma.timeEntry.findFirst({
    where: {
      user_id: userId,
      is_running: true,
    },
    include: {
      matter: {
        select: {
          id: true,
          matter_number: true,
          title: true,
        },
      },
    },
  });
};

/**
 * Start a new timer
 */
const start = async (userId, matterId) => {
  const numMatterId = Number(matterId);
  if (!numMatterId || isNaN(numMatterId)) {
    const err = new Error('Valid Matter ID is required.');
    err.statusCode = 400;
    throw err;
  }

  const matter = await prisma.matter.findUnique({
    where: { id: numMatterId },
    select: { id: true },
  });

  if (!matter) {
    const err = new Error('Selected matter does not exist in database.');
    err.statusCode = 404;
    throw err;
  }

  // Check for active timer
  const active = await getActive(userId);
  if (active) {
    if (active.matter_id === numMatterId) {
      return active;
    }
    await stop(userId, active.id);
  }

  return await prisma.timeEntry.create({
    data: {
      user_id: userId,
      matter_id: numMatterId,
      start_time: new Date(),
      is_running: true,
    },
    include: {
      matter: {
        select: {
          id: true,
          matter_number: true,
          title: true,
        },
      },
    },
  });
};

/**
 * Stop a running timer
 */
const stop = async (userId, timerId) => {
  const timer = await prisma.timeEntry.findUnique({
    where: { id: Number(timerId) },
  });

  if (!timer) {
    const err = new Error('Timer entry not found');
    err.statusCode = 404;
    throw err;
  }

  if (timer.user_id !== userId) {
    const err = new Error('Unauthorized');
    err.statusCode = 403;
    throw err;
  }

  if (!timer.is_running) {
    const err = new Error('Timer is already stopped');
    err.statusCode = 400;
    throw err;
  }

  const endTime = new Date();
  const startTime = new Date(timer.start_time);
  const durationMs = endTime - startTime;
  const durationMinutesRaw = Math.max(1, Math.round(durationMs / 60000)); // Minimum 1 minute
  // Round UP to nearest 6-minute interval (0.1 hours)
  const durationMinutes = Math.ceil(durationMinutesRaw / 6) * 6;

  const updatedEntry = await prisma.timeEntry.update({
    where: { id: Number(timerId) },
    data: {
      end_time: endTime,
      duration_minutes: durationMinutes,
      is_running: false,
    },
  });

  // Billing Integration: Create invoice item from time entry
  try {
    await billingService.createFromTimeEntry(updatedEntry);
  } catch (err) {
    console.error('Failed to create billing entry from timer', err);
    // We don't throw here to avoid failing the timer stop if billing fails
  }

  return updatedEntry;
};

/**
 * Get all time entries
 */
const list = async (userId, filters = {}) => {
  const where = {};
  if (filters.matter_id) {
    where.matter_id = Number(filters.matter_id);
    // If filtering by matter, we typically want to see all staff time for that matter
  } else {
    where.user_id = userId;
  }

  return await prisma.timeEntry.findMany({
    where,
    include: {
      matter: {
        select: {
          id: true,
          matter_number: true,
          title: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
};

module.exports = {
  getActive,
  start,
  stop,
  list,
};
