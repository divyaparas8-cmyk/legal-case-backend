/**
 * Centralized Calendar Timezone Utility using IANA 'America/Los_Angeles'.
 * Strict bidirectional conversions between Pacific local time and UTC.
 * Automatically supports PST (UTC-8) and PDT (UTC-7) Daylight Saving Time transitions.
 * Never uses fixed PST offset or server/client runtime timezone.
 */

const PACIFIC_TIMEZONE = 'America/Los_Angeles';
const PST_TIMEZONE = PACIFIC_TIMEZONE;

// Reusable singleton Intl formatters
const pacificAbbrFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIMEZONE,
  timeZoneName: 'short'
});

const pacificConvergenceFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIMEZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hourCycle: 'h23'
});

const pacificPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'short'
});

const defaultPstDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PACIFIC_TIMEZONE,
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

// Fast LRU/pruning in-memory caches
const utcToPacificCache = new Map();
const pstDateCache = new Map();
const abbrCache = new Map();
const MAX_CACHE_SIZE = 5000;

/**
 * Get dynamic abbreviation for Pacific Time ('PDT' or 'PST')
 */
function getPacificTimezoneAbbr(dateInput) {
  try {
    const d = dateInput instanceof Date ? dateInput : (dateInput ? new Date(dateInput) : new Date());
    const time = d.getTime();
    if (isNaN(time)) return 'PT';
    if (abbrCache.has(time)) return abbrCache.get(time);
    const parts = pacificAbbrFormatter.formatToParts(d);
    const val = parts.find(p => p.type === 'timeZoneName')?.value || 'PT';
    if (abbrCache.size >= MAX_CACHE_SIZE) abbrCache.clear();
    abbrCache.set(time, val);
    return val;
  } catch (err) {
    return 'PT';
  }
}

/**
 * Converts a Pacific local date and time into a UTC Date object.
 * Supports:
 * - dateStr: 'YYYY-MM-DD' and timeStr: 'HH:mm' or 'HH:mm:ss'
 * - dateStr: 'YYYY-MM-DDTHH:mm:ss' (local ISO string without offset)
 * - dateStr: Date object or ISO string
 * Uses a 2-pass convergence algorithm with Intl.DateTimeFormat('America/Los_Angeles')
 * to guarantee mathematical precision across Daylight Saving Time boundaries (PST <-> PDT).
 */
function pacificToUTC(dateStr, timeStr = null) {
  if (!dateStr) return null;
  try {
    let y, m, d, hr = 0, min = 0, sec = 0;

    if (dateStr instanceof Date) {
      if (isNaN(dateStr.getTime())) return null;
      if (timeStr) {
        const pt = utcToPacific(dateStr);
        return pacificToUTC(pt.dateStr, timeStr);
      }
      return dateStr;
    }

    const str = String(dateStr).trim();

    if (str.includes('T')) {
      const [dPart, tPart] = str.split('T');
      const dPieces = dPart.split('-').map(Number);
      y = dPieces[0];
      m = dPieces[1];
      d = dPieces[2];

      const cleanTPart = (timeStr || tPart || '00:00:00').replace(/Z$/i, '').split(/[+-]/)[0];
      const tPieces = cleanTPart.split(':').map(Number);
      hr = tPieces[0] || 0;
      min = tPieces[1] || 0;
      sec = tPieces[2] || 0;
    } else {
      const dPieces = str.split('-').map(Number);
      y = dPieces[0];
      m = dPieces[1];
      d = dPieces[2];

      const tPieces = String(timeStr || '00:00:00').split(':').map(Number);
      hr = tPieces[0] || 0;
      min = tPieces[1] || 0;
      sec = tPieces[2] || 0;
    }

    if (!y || !m || !d) return null;

    // First pass: evaluate initial UTC guess in America/Los_Angeles
    const utcGuess = new Date(Date.UTC(y, m - 1, d, hr, min, sec));
    const parts = pacificConvergenceFormatter.formatToParts(utcGuess);
    const p = {};
    for (const part of parts) p[part.type] = part.value;
    const inTzAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const offset = utcGuess.getTime() - inTzAsUtc;
    const candidate = new Date(utcGuess.getTime() + offset);

    // Second pass: check if candidate in America/Los_Angeles matches requested local time
    const cParts = pacificConvergenceFormatter.formatToParts(candidate);
    const cp = {};
    for (const part of cParts) cp[part.type] = part.value;
    const cInTzAsUtc = Date.UTC(cp.year, cp.month - 1, cp.day, cp.hour, cp.minute, cp.second);
    const desiredUtc = Date.UTC(y, m - 1, d, hr, min, sec);
    const secondPassDiff = desiredUtc - cInTzAsUtc;

    return new Date(candidate.getTime() + secondPassDiff);
  } catch (err) {
    return new Date();
  }
}

/**
 * Converts any UTC Date, ISO string, or timestamp into Pacific local representation (America/Los_Angeles).
 * Returns complete decomposed parts and formatted strings:
 * - year, month (1-12), monthIdx (0-11), day
 * - hour (0-23), minute, second
 * - dateStr: 'YYYY-MM-DD'
 * - timeStr: 'HH:mm:ss' (24-hour)
 * - timeStrShort: 'HH:mm'
 * - timeStr12: 'hh:mm A' (12-hour AM/PM)
 * - isoLocal: 'YYYY-MM-DDTHH:mm:ss'
 * - tzName: 'PDT' or 'PST' (dynamic from Intl)
 * - offsetMinutes: -420 (PDT) or -480 (PST)
 * - offsetString: '-07:00' or '-08:00'
 * - isDST: boolean
 */
function utcToPacific(dateInput) {
  if (!dateInput) return null;
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const time = d.getTime();
    if (isNaN(time)) return null;

    if (utcToPacificCache.has(time)) {
      return utcToPacificCache.get(time);
    }

    const parts = pacificPartsFormatter.formatToParts(d);
    const p = {};
    for (const part of parts) p[part.type] = part.value;

    const year = parseInt(p.year, 10);
    const month = parseInt(p.month, 10);
    const monthIdx = month - 1;
    const day = parseInt(p.day, 10);
    const hour = parseInt(p.hour, 10);
    const minute = parseInt(p.minute, 10);
    const second = parseInt(p.second, 10);
    const pad = (n) => String(n).padStart(2, '0');

    // 12-hour format calculation
    const hour12Num = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const timeStr12 = `${pad(hour12Num)}:${pad(minute)} ${ampm}`;

    // Calculate exact offset in minutes and offset string for this specific timestamp
    const inTzUtc = Date.UTC(year, monthIdx, day, hour, minute, second);
    const offsetMinutes = Math.round((inTzUtc - time) / 60000);
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const offsetHours = Math.floor(absOffset / 60);
    const offsetMins = absOffset % 60;
    const offsetString = `${offsetSign}${pad(offsetHours)}:${pad(offsetMins)}`;
    const isDST = p.timeZoneName === 'PDT';

    const result = {
      year,
      month,
      monthIdx,
      day,
      hour,
      minute,
      second,
      dateStr: `${p.year}-${p.month}-${p.day}`,
      timeStr: `${p.hour}:${p.minute}:${p.second}`,
      timeStrShort: `${p.hour}:${p.minute}`,
      timeStr12,
      isoLocal: `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`,
      tzName: p.timeZoneName || (isDST ? 'PDT' : 'PST'),
      offsetMinutes,
      offsetString,
      isDST
    };

    if (utcToPacificCache.size >= MAX_CACHE_SIZE) {
      utcToPacificCache.clear();
    }
    utcToPacificCache.set(time, result);
    return result;
  } catch (err) {
    return null;
  }
}

/**
 * Backward-compatible alias for utcToPacific
 */
function getPacificParts(dateInput) {
  return utcToPacific(dateInput);
}

/**
 * Get current date and time parts in Pacific Time (America/Los_Angeles).
 */
function getPacificToday() {
  return utcToPacific(new Date());
}

/**
 * Checks if two dates/timestamps fall on the same calendar day in America/Los_Angeles.
 */
function isSamePacificDay(d1, d2) {
  const p1 = utcToPacific(d1);
  const p2 = utcToPacific(d2);
  if (!p1 || !p2) return false;
  return p1.year === p2.year && p1.month === p2.month && p1.day === p2.day;
}

/**
 * Format a date string or Date object into PST/PDT date string (e.g. "Oct 8, 2026")
 */
function formatPSTDate(dateInput, options = {}) {
  if (!dateInput) return '';
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const time = d.getTime();
    if (isNaN(time)) return '';

    const isDefault = Object.keys(options).length === 0;
    if (isDefault) {
      if (pstDateCache.has(time)) return pstDateCache.get(time);
      const res = defaultPstDateFormatter.format(d);
      if (pstDateCache.size >= MAX_CACHE_SIZE) pstDateCache.clear();
      pstDateCache.set(time, res);
      return res;
    }

    return d.toLocaleDateString('en-US', {
      timeZone: PACIFIC_TIMEZONE,
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
 * Format a date string or Date object into PST/PDT time string (e.g. "02:30 PM")
 */
function formatPSTTime(dateInput, options = {}) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      timeZone: PACIFIC_TIMEZONE,
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
 * Format a date string or Date object into PST/PDT date and time combined (e.g. "Oct 8, 2026 02:30 PM PDT")
 */
function formatPSTDateTime(dateInput, includeTzSuffix = false) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const dateStr = formatPSTDate(d);
    const timeStr = formatPSTTime(d);
    if (!timeStr) return dateStr;
    const suffix = includeTzSuffix ? ` ${getPacificTimezoneAbbr(d)}` : '';
    return `${dateStr} ${timeStr}${suffix}`;
  } catch (err) {
    return '';
  }
}

/**
 * Parses CalDAV DTSTART / DTEND lines and values from Titan / RFC 5545 iCalendar.
 * Handles:
 * - Full property line: DTSTART;TZID=America/Los_Angeles:YYYYMMDDTHHMMSS
 * - Quoted TZID: DTSTART;TZID="America/Los_Angeles":YYYYMMDDTHHMMSS
 * - Explicit UTC ending in Z: DTSTART:YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSSZ
 * - Floating/local time without Z: YYYYMMDDTHHMMSS (interpreted in America/Los_Angeles)
 * - All-day date: DTSTART;VALUE=DATE:YYYYMMDD or YYYYMMDD (00:00:00 America/Los_Angeles)
 * - Standard ISO strings and Date instances
 */
function parseCalDavDate(rawInput, defaultTz = PACIFIC_TIMEZONE) {
  if (!rawInput) return null;
  if (rawInput instanceof Date) return isNaN(rawInput.getTime()) ? null : rawInput;

  let str = String(rawInput).trim();
  let tzid = null;

  // Extract TZID parameter if present before colon
  if (str.includes(':')) {
    const colonIdx = str.indexOf(':');
    const paramPart = str.slice(0, colonIdx);
    const valuePart = str.slice(colonIdx + 1).trim();

    const tzidMatch = paramPart.match(/TZID=["']?([^"';]+)["']?/i);
    if (tzidMatch) {
      tzid = tzidMatch[1].trim();
    }
    str = valuePart;
  }

  // 1. Explicit UTC ending in Z (e.g. 20261008T090000Z or 2026-10-08T09:00:00.000Z)
  if (/^\d{8}T\d{6}Z$/i.test(str)) {
    const y = parseInt(str.slice(0, 4), 10);
    const m = parseInt(str.slice(4, 6), 10);
    const d = parseInt(str.slice(6, 8), 10);
    const h = parseInt(str.slice(9, 11), 10);
    const min = parseInt(str.slice(11, 13), 10);
    const s = parseInt(str.slice(13, 15), 10);
    return new Date(Date.UTC(y, m - 1, d, h, min, s));
  }
  if (/Z$/i.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. All-day date (YYYYMMDD or YYYY-MM-DD) -> 00:00:00 in America/Los_Angeles
  if (/^\d{8}$/.test(str)) {
    const y = str.slice(0, 4);
    const m = str.slice(4, 6);
    const d = str.slice(6, 8);
    return pacificToUTC(`${y}-${m}-${d}`, '00:00:00');
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return pacificToUTC(str, '00:00:00');
  }

  // 3. Compact local datetime: YYYYMMDDTHHMMSS
  const compactMatch = str.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (compactMatch) {
    const [, y, m, d, h, min, s] = compactMatch;
    return pacificToUTC(`${y}-${m}-${d}`, `${h}:${min}:${s}`);
  }

  // 4. ISO local datetime: YYYY-MM-DDTHH:mm(:ss)?
  const isoLocalMatch = str.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2})?)/);
  if (isoLocalMatch) {
    const [, datePart, timePart] = isoLocalMatch;
    return pacificToUTC(datePart, timePart);
  }

  // Fallback for standard ISO strings
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Central parser for calendar event creation and updates in Legal Case Management.
 * Correctly normalizes all input formats into a UTC Date anchored to America/Los_Angeles.
 */
function parseCalendarEventDate(dateInput, timeInput = null, defaultTime = '00:00:00') {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    if (timeInput) {
      const pt = utcToPacific(dateInput);
      return pacificToUTC(pt.dateStr, timeInput);
    }
    return dateInput;
  }

  const str = String(dateInput).trim();

  // If dateInput is YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return pacificToUTC(str, timeInput || defaultTime);
  }

  // If dateInput is compact CalDAV date YYYYMMDD
  if (/^\d{8}$/.test(str)) {
    const y = str.slice(0, 4);
    const m = str.slice(4, 6);
    const d = str.slice(6, 8);
    return pacificToUTC(`${y}-${m}-${d}`, timeInput || defaultTime);
  }

  // If dateInput contains 'T'
  if (str.includes('T')) {
    // Explicit UTC ending in Z
    if (/Z$/i.test(str)) {
      if (timeInput) {
        const pt = utcToPacific(str);
        return pacificToUTC(pt.dateStr, timeInput);
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    }
    // Timezone offset like +05:30 or -07:00
    if (/[+-]\d{2}:\d{2}$/.test(str)) {
      if (timeInput) {
        const pt = utcToPacific(str);
        return pacificToUTC(pt.dateStr, timeInput);
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    }
    // Local ISO format without timezone: YYYY-MM-DDTHH:mm(:ss)?
    const [dPart, tPart] = str.split('T');
    return pacificToUTC(dPart, timeInput || tPart || defaultTime);
  }

  // Fallback
  return pacificToUTC(str, timeInput || defaultTime);
}

/**
 * Format a UTC date into RFC 5545 iCalendar local string in America/Los_Angeles: YYYYMMDDTHHmmss
 */
function formatPacificIcs(dateInput) {
  const p = utcToPacific(dateInput);
  if (!p) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${p.year}${pad(p.month)}${pad(p.day)}T${pad(p.hour)}${pad(p.minute)}${pad(p.second)}`;
}

module.exports = {
  PACIFIC_TIMEZONE,
  PST_TIMEZONE,
  getPacificTimezoneAbbr,
  pacificToUTC,
  utcToPacific,
  getPacificParts,
  getPacificToday,
  isSamePacificDay,
  formatPSTDate,
  formatPSTTime,
  formatPSTDateTime,
  parseCalDavDate,
  parseCalendarEventDate,
  formatPacificIcs
};
