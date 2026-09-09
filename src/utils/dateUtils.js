/**
 * Central Date & Time formatting utility for PST (Pacific Standard Time / America/Los_Angeles) on the Backend.
 * Ensures all generated reports, email templates, and PDF documents strictly render in PST timezone
 * with 12-hour AM/PM format.
 */

const PST_TIMEZONE = 'America/Los_Angeles';

/**
 * Format a date string or Date object into PST date string (e.g. "Aug 5, 2026")
 */
function formatPSTDate(dateInput, options = {}) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      timeZone: PST_TIMEZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
    });
  } catch (err) {
    return '';
  }
}

/**
 * Format a date string or Date object into PST time string (e.g. "02:30 PM")
 */
function formatPSTTime(dateInput, options = {}) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      timeZone: PST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options,
    });
  } catch (err) {
    return '';
  }
}

/**
 * Format a date string or Date object into PST date and time combined (e.g. "Aug 5, 2026 02:30 PM")
 */
function formatPSTDateTime(dateInput) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const dateStr = formatPSTDate(d);
    const timeStr = formatPSTTime(d);
    if (!timeStr) return dateStr;
    return `${dateStr} ${timeStr}`;
  } catch (err) {
    return '';
  }
}

module.exports = {
  PST_TIMEZONE,
  formatPSTDate,
  formatPSTTime,
  formatPSTDateTime,
};
