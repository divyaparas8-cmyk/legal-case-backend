const prisma = require('../../config/db');
const https = require('https');
const {
  PACIFIC_TIMEZONE,
  parseCalDavDate,
  formatPacificIcs,
  pacificToUTC,
  utcToPacific,
  getPacificParts
} = require('../../utils/dateUtils');

/**
 * Titan Calendar Service
 * 
 * Provides real, authenticated synchronization with Titan Calendar via CalDAV (RFC 4791)
 * and iCalendar feed export (RFC 5545).
 * 
 * Protocols supported:
 * 1. CalDAV Protocol:
 *    - Server: dav.flockmail.com (Port 443, SSL/TLS)
 *    - Principal: /principals/{email}/
 *    - Home set: /principals/{email}/calendar
 *    - Primary Calendar collection: /principals/{email}/calendar/8748091
 *    - Operations: PROPFIND (discovery), GET (read), PUT (create/update), DELETE (delete)
 * 2. iCalendar (.ics) live subscription feed:
 *    - Public read-only feed at /api/calendar/feed.ics
 */
class TitanCalendarService {
  constructor() {
    this._primaryCalendarPath = null;
  }

  /**
   * Safe helper to get Titan configuration without exposing secrets
   */
  async getSettings() {
    const envEmail = process.env.TITAN_EMAIL;
    const envPassword = process.env.TITAN_CALDAV_PASSWORD || process.env.TITAN_EMAIL_PASSWORD;
    const calDavHost = process.env.TITAN_CALDAV_HOST || 'dav.flockmail.com';
    const calDavPort = parseInt(process.env.TITAN_CALDAV_PORT, 10) || 443;

    if (envEmail && envPassword) {
      return {
        email: envEmail,
        password: envPassword,
        host: calDavHost,
        port: calDavPort,
        enabled: true,
        source: 'env',
      };
    }

    const emailSetting = await prisma.setting.findUnique({ where: { key: 'titan_email' } });
    const passwordSetting = await prisma.setting.findUnique({ where: { key: 'titan_app_password' } });
    const enabledSetting = await prisma.setting.findUnique({ where: { key: 'titan_sync_enabled' } });

    return {
      email: emailSetting?.value || null,
      password: passwordSetting?.value || null,
      host: calDavHost,
      port: calDavPort,
      enabled: enabledSetting?.value === 'true',
      source: 'database',
    };
  }

  /**
   * Internal HTTPS request wrapper for CalDAV
   */
  async _httpRequest(settings, options, body = null) {
    return new Promise((resolve, reject) => {
      const authHeader = 'Basic ' + Buffer.from(`${settings.email}:${settings.password}`).toString('base64');
      const reqOpts = {
        hostname: settings.host,
        port: settings.port || 443,
        servername: 'dav.flockmail.com',
        rejectUnauthorized: false,
        timeout: 15000,
        ...options,
        headers: {
          'Authorization': authHeader,
          'User-Agent': 'Legal-Case-Manager/1.0',
          ...(options.headers || {}),
        },
      };

      if (body) {
        reqOpts.headers['Content-Length'] = Buffer.byteLength(body);
      }

      const req = https.request(reqOpts, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        }));
      });

      req.on('error', (err) => {
        const sanitized = err.message ? err.message.replace(/([pP]assword|[aA]uth)[:=\s]+[^\s,]+/g, '***') : 'Network error';
        reject(new Error(`CalDAV request error: ${sanitized}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('CalDAV request timed out after 15 seconds.'));
      });

      if (body) req.write(body);
      req.end();
    });
  }

  /**
   * Discover primary calendar collection path
   */
  async getPrimaryCalendarPath(settings) {
    if (this._primaryCalendarPath) return this._primaryCalendarPath;

    try {
      const homeSetXml = `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:prop><C:calendar-home-set /></D:prop></D:propfind>`;
      const pRes = await this._httpRequest(settings, {
        path: `/principals/${encodeURIComponent(settings.email)}/`,
        method: 'PROPFIND',
        headers: { 'Depth': '0', 'Content-Type': 'application/xml; charset=utf-8' },
      }, homeSetXml);

      let homePath = `/principals/${settings.email}/calendar`;
      if (pRes.status === 207) {
        const homeMatch = pRes.body.match(/<L:calendar-home-set>[\s\S]*?<D:href>([^<]+)<\/D:href>/) ||
                          pRes.body.match(/<C:calendar-home-set>[\s\S]*?<D:href>([^<]+)<\/D:href>/);
        if (homeMatch) homePath = homeMatch[1].replace(/\/+$/, '');
      }

      const listXml = `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:prop><D:resourcetype /><D:displayname /></D:prop></D:propfind>`;
      const cRes = await this._httpRequest(settings, {
        path: homePath,
        method: 'PROPFIND',
        headers: { 'Depth': '1', 'Content-Type': 'application/xml; charset=utf-8' },
      }, listXml);

      if (cRes.status === 207) {
        const responses = cRes.body.split('</D:response>');
        for (const resp of responses) {
          if (resp.includes('<L:calendar') || resp.includes('<C:calendar')) {
            const hrefMatch = resp.match(/<D:href>([^<]+)<\/D:href>/);
            if (hrefMatch && hrefMatch[1] !== homePath && hrefMatch[1] !== `${homePath}/`) {
              this._primaryCalendarPath = hrefMatch[1].replace(/\/+$/, '');
              return this._primaryCalendarPath;
            }
          }
        }
      }

      this._primaryCalendarPath = `${homePath}/8748091`;
      return this._primaryCalendarPath;
    } catch (err) {
      console.warn('[Titan Calendar] Error discovering primary calendar path, using default:', err.message);
      this._primaryCalendarPath = `/principals/${settings.email}/calendar/8748091`;
      return this._primaryCalendarPath;
    }
  }

  /**
   * List all .ics event resources in a calendar collection
   */
  async getCalendarItems(settings, calPath) {
    const target = calPath.endsWith('/') ? calPath.slice(0, -1) : calPath;
    const propfindXml = `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:"><D:prop><D:getetag /></D:prop></D:propfind>`;
    const res = await this._httpRequest(settings, {
      path: target,
      method: 'PROPFIND',
      headers: { 'Depth': '1', 'Content-Type': 'application/xml; charset=utf-8' },
    }, propfindXml);

    if (res.status !== 207) return [];
    const hrefs = [...res.body.matchAll(/<D:href>([^<]+)<\/D:href>/g)].map(m => m[1]);
    return hrefs.filter(h => h.endsWith('.ics'));
  }

  /**
   * Verify CalDAV connectivity and credentials against Titan
   */
  async verifyCalDavConnection() {
    const settings = await this.getSettings();

    if (!settings.email || !settings.password) {
      return {
        success: false,
        configured: false,
        message: 'Titan CalDAV credentials not configured in environment or settings.',
      };
    }

    try {
      const principalPath = `/principals/${encodeURIComponent(settings.email)}/`;
      const propfindXml = `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:prop><D:current-user-principal/><C:calendar-home-set/></D:prop></D:propfind>`;
      const res = await this._httpRequest(settings, {
        path: principalPath,
        method: 'PROPFIND',
        headers: { 'Depth': '0', 'Content-Type': 'application/xml; charset=utf-8' },
      }, propfindXml);

      if (res.status === 200 || res.status === 207) {
        const calPath = await this.getPrimaryCalendarPath(settings);
        const items = await this.getCalendarItems(settings, calPath);

        return {
          success: true,
          configured: true,
          status: res.status,
          caldav_host: settings.host,
          principal: principalPath,
          primary_calendar: calPath,
          items_count: items.length,
          message: `Successfully connected and authenticated with Titan CalDAV (${settings.host}). Found ${items.length} calendar events.`,
        };
      } else if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          configured: true,
          status: res.status,
          message: 'Titan CalDAV authentication failed. Invalid mailbox email or password.',
        };
      } else {
        return {
          success: false,
          configured: true,
          status: res.status,
          message: `Titan CalDAV endpoint responded with HTTP ${res.status}.`,
        };
      }
    } catch (err) {
      return {
        success: false,
        configured: true,
        message: `Network error connecting to Titan CalDAV (${settings.host}): ${err.message}`,
      };
    }
  }

  /**
   * Build standard RFC 5545 iCalendar string
   */
  buildIcsEvent(uid, event, organizerEmail) {
    const pad = (n) => String(n).padStart(2, '0');
    const formatUtc = (d) => {
      const date = new Date(d);
      return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
    };

    const dtstamp = formatUtc(new Date());
    const dtstart = formatPacificIcs(event.event_date || new Date());
    const dtend = formatPacificIcs(event.end_date || new Date(new Date(event.event_date || new Date()).getTime() + 60 * 60 * 1000));
    const summary = (event.title || 'Legal Event').replace(/[\r\n]+/g, ' ').trim();
    const description = (event.description || '').replace(/\r\n|\r|\n/g, '\\n').trim();
    const location = (event.location || event.court_name || '').replace(/[\r\n]+/g, ' ').trim();

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Victoria Tulsidas Law//Legal Case Management//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VTIMEZONE',
      'TZID:America/Los_Angeles',
      'X-LIC-LOCATION:America/Los_Angeles',
      'BEGIN:DAYLIGHT',
      'TZNAME:PDT',
      'TZOFFSETFROM:-0800',
      'TZOFFSETTO:-0700',
      'DTSTART:19700308T020000',
      'RRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZNAME:PST',
      'TZOFFSETFROM:-0700',
      'TZOFFSETTO:-0800',
      'DTSTART:19701101T020000',
      'RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11',
      'END:STANDARD',
      'END:VTIMEZONE',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=America/Los_Angeles:${dtstart}`,
      `DTEND;TZID=America/Los_Angeles:${dtend}`,
      `SUMMARY:${summary}`,
    ];

    if (description) lines.push(`DESCRIPTION:${description}`);
    if (location) lines.push(`LOCATION:${location}`);
    if (organizerEmail) lines.push(`ORGANIZER;CN=${organizerEmail}:mailto:${organizerEmail}`);
    if (event.is_court_event || event.court_related) lines.push('CATEGORIES:Court,Legal');
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  /**
   * Format a calendar event into standard RFC 5545 iCalendar VEVENT string (for public feed)
   */
  formatVEvent(event) {
    const pad = (n) => String(n).padStart(2, '0');
    const formatUtc = (d) => {
      const date = new Date(d);
      return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
    };

    const uid = event.titan_event_id ? `lcm-evt-${event.id}` : `lcm-evt-${event.id}@vktori.legal`;
    const dtStamp = formatUtc(new Date());
    const dtStart = formatPacificIcs(event.event_date);
    const dtEnd = formatPacificIcs(event.end_date || new Date(new Date(event.event_date).getTime() + 60 * 60 * 1000));
    const summary = (event.title || 'Legal Event').replace(/[\r\n]+/g, ' ');
    const description = (event.description || '').replace(/\r\n|\r|\n/g, '\\n');
    const location = (event.location || event.court_name || '').replace(/[\r\n]+/g, ' ');

    let vevent = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;TZID=America/Los_Angeles:${dtStart}`,
      `DTEND;TZID=America/Los_Angeles:${dtEnd}`,
      `SUMMARY:${summary}`,
    ];

    if (description) vevent.push(`DESCRIPTION:${description}`);
    if (location) vevent.push(`LOCATION:${location}`);
    if (event.is_court_event || event.court_related) vevent.push('CATEGORIES:Court,Legal');
    vevent.push('STATUS:CONFIRMED');
    vevent.push('END:VEVENT');

    return vevent.join('\r\n');
  }

  /**
   * Generate a full RFC 5545 iCalendar (.ics) feed of events
   */
  generateIcsFeed(events = []) {
    const header = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Victoria Tulsidas Law//Legal Case Management//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Legal Case Management Calendar',
      'X-WR-TIMEZONE:America/Los_Angeles',
      'BEGIN:VTIMEZONE',
      'TZID:America/Los_Angeles',
      'X-LIC-LOCATION:America/Los_Angeles',
      'BEGIN:DAYLIGHT',
      'TZNAME:PDT',
      'TZOFFSETFROM:-0800',
      'TZOFFSETTO:-0700',
      'DTSTART:19700308T020000',
      'RRULE:FREQ=YEARLY;BYDAY=2SU;BYMONTH=3',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZNAME:PST',
      'TZOFFSETFROM:-0700',
      'TZOFFSETTO:-0800',
      'DTSTART:19701101T020000',
      'RRULE:FREQ=YEARLY;BYDAY=1SU;BYMONTH=11',
      'END:STANDARD',
      'END:VTIMEZONE',
    ].join('\r\n');

    const vevents = events.map(e => this.formatVEvent(e)).join('\r\n');
    const footer = '\r\nEND:VCALENDAR\r\n';

    return header + '\r\n' + vevents + footer;
  }

  /**
   * Parse a single VEVENT from an iCalendar string
   */
  parseIcsEvent(icsData) {
    const veventMatch = icsData.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/i);
    const eventBlock = veventMatch ? veventMatch[0] : icsData;
    const unfolded = eventBlock.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');

    const getProp = (name) => {
      const regex = new RegExp(`(?:^|\\r?\\n)${name}(?:;[^:]*)?:([^\\r\\n]*)`, 'm');
      const match = unfolded.match(regex);
      return match ? match[1].trim() : null;
    };

    const getPropLine = (name) => {
      const regex = new RegExp(`(?:^|\\r?\\n)(${name}[^:\\r\\n]*:[^\\r\\n]*)`, 'm');
      const match = unfolded.match(regex);
      return match ? match[1].trim() : null;
    };

    const uid = getProp('UID');
    const summary = (getProp('SUMMARY') || 'Titan Event').replace(/\\([,;\\])/g, '$1');
    const description = (getProp('DESCRIPTION') || '').replace(/\\n/g, '\n').replace(/\\([,;\\])/g, '$1');
    const location = (getProp('LOCATION') || '').replace(/\\([,;\\])/g, '$1');
    const dtstart = parseCalDavDate(getPropLine('DTSTART') || getProp('DTSTART'));
    const dtend = parseCalDavDate(getPropLine('DTEND') || getProp('DTEND'));
    const status = (getProp('STATUS') || 'CONFIRMED').toLowerCase();

    return { uid, summary, description, location, dtstart, dtend, status };
  }

  /**
   * Outgoing sync: Legal Case Management -> Titan CalDAV
   * Creates or updates the event on Titan's CalDAV server
   */
  async syncEvent(calendarEvent) {
    try {
      const settings = await this.getSettings();
      if (!settings.enabled || !settings.email || !settings.password) {
        return { success: false, reason: 'unconfigured' };
      }

      const calPath = await this.getPrimaryCalendarPath(settings);
      const uid = `lcm-evt-${calendarEvent.id}@victoriatulsidaslaw.com`;
      const icsData = this.buildIcsEvent(uid, calendarEvent, settings.email);

      // Case 1: Event already has a mapped Titan resource URL -> UPDATE in-place
      if (calendarEvent.titan_event_id && calendarEvent.titan_event_id.startsWith('/')) {
        console.log(`[Titan CalDAV] Updating existing event #${calendarEvent.id} at ${calendarEvent.titan_event_id}`);
        const updateRes = await this._httpRequest(settings, {
          path: calendarEvent.titan_event_id,
          method: 'PUT',
          headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
        }, icsData);

        if (updateRes.status === 200 || updateRes.status === 204) {
          console.log(`[Titan CalDAV] Event #${calendarEvent.id} successfully updated on Titan.`);
          return { success: true, action: 'updated', titan_event_id: calendarEvent.titan_event_id };
        }
      }

      // Case 2: New event -> CREATE on Titan and capture the real Titan resource URL
      console.log(`[Titan CalDAV] Creating new event #${calendarEvent.id} on Titan CalDAV collection: ${calPath}`);
      const itemsBefore = await this.getCalendarItems(settings, calPath);

      const targetPath = `${calPath}/lcm-evt-${calendarEvent.id}.ics`;
      const putRes = await this._httpRequest(settings, {
        path: targetPath,
        method: 'PUT',
        headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
      }, icsData);

      if (putRes.status === 201 || putRes.status === 200 || putRes.status === 204) {
        // Find the created resource path in the collection
        const itemsAfter = await this.getCalendarItems(settings, calPath);
        const newItems = itemsAfter.filter(h => !itemsBefore.includes(h));

        let realHref = null;
        for (const candidate of newItems) {
          try {
            const checkRes = await this._httpRequest(settings, { path: candidate, method: 'GET' });
            if (checkRes.body.includes(uid)) {
              realHref = candidate;
              break;
            }
          } catch (e) {
            // ignore
          }
        }

        if (!realHref && newItems.length > 0) {
          realHref = newItems[newItems.length - 1];
        }

        if (!realHref) {
          realHref = targetPath;
        }

        console.log(`[Titan CalDAV] Event #${calendarEvent.id} created. Titan resource href: ${realHref}`);

        // Persist real Titan resource ID to DB
        await prisma.calendarEvent.update({
          where: { id: calendarEvent.id },
          data: { titan_event_id: realHref },
        });

        return { success: true, action: 'created', titan_event_id: realHref };
      } else {
        console.error(`[Titan CalDAV] Failed to create event #${calendarEvent.id}. HTTP status: ${putRes.status}`);
        return { success: false, status: putRes.status };
      }
    } catch (err) {
      console.error('[Titan CalDAV Sync Error]:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Outgoing deletion: Legal Case Management -> Titan CalDAV
   * Removes the corresponding event from Titan Calendar
   */
  async deleteEvent(eventId) {
    try {
      const settings = await this.getSettings();
      if (!settings.enabled || !settings.email || !settings.password) {
        return { success: false, reason: 'unconfigured' };
      }

      const calPath = await this.getPrimaryCalendarPath(settings);
      const event = await prisma.calendarEvent.findUnique({
        where: { id: parseInt(eventId, 10) },
        select: { id: true, titan_event_id: true },
      });

      const targetPath = event?.titan_event_id || `${calPath}/lcm-evt-${eventId}.ics`;
      console.log(`[Titan CalDAV] Deleting event #${eventId} from Titan: ${targetPath}`);

      const delRes = await this._httpRequest(settings, {
        path: targetPath,
        method: 'DELETE',
      });

      if (delRes.status === 200 || delRes.status === 204 || delRes.status === 404) {
        console.log(`[Titan CalDAV] Event #${eventId} successfully removed from Titan.`);
        return { success: true, status: delRes.status };
      } else {
        console.warn(`[Titan CalDAV] DELETE returned unexpected status: ${delRes.status}`);
        return { success: false, status: delRes.status };
      }
    } catch (err) {
      console.error('[Titan CalDAV Delete Error]:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Incoming sync: Titan Calendar -> Legal Case Management
   * Pulls events created or updated in Titan Calendar into Legal Case Management
   */
  async syncFromTitan(userId = 1) {
    try {
      const settings = await this.getSettings();
      if (!settings.enabled || !settings.email || !settings.password) {
        return { success: false, reason: 'unconfigured' };
      }

      const calPath = await this.getPrimaryCalendarPath(settings);
      const items = await this.getCalendarItems(settings, calPath);

      let createdCount = 0;
      let updatedCount = 0;

      for (const itemHref of items) {
        try {
          const res = await this._httpRequest(settings, { path: itemHref, method: 'GET' });
          if (res.status !== 200) continue;

          const parsed = this.parseIcsEvent(res.body);
          if (!parsed.summary || parsed.status === 'cancelled') continue;

          // Check if already in Legal Case Management by titan_event_id
          const existing = await prisma.calendarEvent.findFirst({
            where: { titan_event_id: itemHref },
          });

          if (existing) {
            // Update if changed
            await prisma.calendarEvent.update({
              where: { id: existing.id },
              data: {
                title: parsed.summary,
                description: parsed.description || existing.description,
                event_date: parsed.dtstart || existing.event_date,
                end_date: parsed.dtend || existing.end_date,
                location: parsed.location || existing.location,
              },
            });
            updatedCount++;
          } else {
            // Don't duplicate if it was created by LCM with UID lcm-evt-
            if (parsed.uid && parsed.uid.startsWith('lcm-evt-')) {
              const lcmIdMatch = parsed.uid.match(/^lcm-evt-(\d+)/);
              if (lcmIdMatch) {
                const lcmId = parseInt(lcmIdMatch[1], 10);
                const localEvent = await prisma.calendarEvent.findUnique({ where: { id: lcmId } });
                if (localEvent) {
                  await prisma.calendarEvent.update({
                    where: { id: lcmId },
                    data: { titan_event_id: itemHref },
                  });
                  continue;
                }
              }
            }

            // Create new imported event from Titan into Legal Case Management
            await prisma.calendarEvent.create({
              data: {
                title: parsed.summary,
                description: parsed.description || null,
                event_date: parsed.dtstart || new Date(),
                end_date: parsed.dtend || null,
                location: parsed.location || null,
                type: 'general',
                court_related: false,
                created_by: userId || 1,
                titan_event_id: itemHref,
              },
            });
            createdCount++;
          }
        } catch (itemErr) {
          console.warn(`[Titan CalDAV] Error processing item ${itemHref}:`, itemErr.message);
        }
      }

      return {
        success: true,
        total_titan_events: items.length,
        created: createdCount,
        updated: updatedCount,
        message: `Synced with Titan Calendar: ${createdCount} imported, ${updatedCount} updated across ${items.length} total events.`,
      };
    } catch (err) {
      console.error('[Titan CalDAV Sync From Titan Error]:', err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new TitanCalendarService();
