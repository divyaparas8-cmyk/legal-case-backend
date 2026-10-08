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
    this._collections = null;
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
   * Discover ALL available CalDAV calendar collections for the account
   */
  async getCalendarCollections(settings) {
    if (this._collections && this._collections.length > 0) {
      return this._collections;
    }

    try {
      const homeSetXml = `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:prop><C:calendar-home-set /></D:prop></D:propfind>`;
      const pRes = await this._httpRequest(settings, {
        path: `/principals/${encodeURIComponent(settings.email)}/`,
        method: 'PROPFIND',
        headers: { 'Depth': '0', 'Content-Type': 'application/xml; charset=utf-8' },
      }, homeSetXml);

      let homePath = `/principals/${settings.email}/calendar`;
      if (pRes.status === 207) {
        const homeMatch = pRes.body.match(/<[^:]*:calendar-home-set[^>]*>[\s\S]*?<[^:]*:href[^>]*>([^<]+)<\/[^:]*:href>/i);
        if (homeMatch) homePath = homeMatch[1].replace(/\/+$/, '');
      }

      const listXml = `<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:A="http://apple.com/ns/ical/"><D:prop><D:resourcetype /><D:displayname /><C:supported-calendar-component-set /><C:calendar-description /><A:calendar-order /></D:prop></D:propfind>`;
      const cRes = await this._httpRequest(settings, {
        path: homePath,
        method: 'PROPFIND',
        headers: { 'Depth': '1', 'Content-Type': 'application/xml; charset=utf-8' },
      }, listXml);

      const collections = [];
      if (cRes.status === 207) {
        const responses = cRes.body.split(/<\/?D:response>/i).filter(s => s.trim().length > 10);
        for (const resp of responses) {
          const isCal = /<C:calendar\s*\/?>|<L:calendar\s*\/?>/i.test(resp);
          const hrefM = resp.match(/<D:href>([^<]+)<\/D:href>/i);
          if (isCal && hrefM) {
            const href = hrefM[1].replace(/\/+$/, '');
            const dispM = resp.match(/<D:displayname>([^<]*)<\/D:displayname>/i);
            const descM = resp.match(/<[^:]*:calendar-description>([^<]*)<\/[^:]*:calendar-description>/i);
            const orderM = resp.match(/<[^:]*:calendar-order>([^<]*)<\/[^:]*:calendar-order>/i);
            const name = dispM ? dispM[1].trim() : '';
            const desc = descM ? descM[1].trim() : '';
            const order = orderM ? parseInt(orderM[1], 10) : 999;
            const isPrimary = name === settings.email || desc.includes('Home Calendar') || href.endsWith('8748091');
            collections.push({
              path: href,
              displayName: name || href.split('/').pop(),
              description: desc,
              order,
              isPrimary
            });
          }
        }
      }

      if (collections.length === 0) {
        collections.push({
          path: `${homePath}/8748091`,
          displayName: settings.email,
          description: 'Default Calendar',
          order: 1,
          isPrimary: true
        });
      }

      // Sort primary calendar first
      collections.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
      this._collections = collections;
      this._primaryCalendarPath = collections[0].path;
      return collections;
    } catch (err) {
      console.warn('[Titan Calendar] Error discovering collections:', err.message);
      const fallback = `/principals/${settings.email}/calendar/8748091`;
      this._primaryCalendarPath = fallback;
      return [{
        path: fallback,
        displayName: settings.email,
        description: 'Fallback Calendar',
        order: 1,
        isPrimary: true
      }];
    }
  }

  /**
   * Discover primary calendar collection path
   */
  async getPrimaryCalendarPath(settings) {
    if (this._primaryCalendarPath) return this._primaryCalendarPath;
    const cols = await this.getCalendarCollections(settings);
    const primary = cols.find(c => c.isPrimary) || cols[0];
    this._primaryCalendarPath = primary?.path || `/principals/${settings.email}/calendar/8748091`;
    return this._primaryCalendarPath;
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
   * Batch fetch event bodies using RFC 4791 calendar-multiget (with fallback to individual GETs)
   */
  async batchFetchEvents(settings, colPath, itemHrefs) {
    if (!itemHrefs || itemHrefs.length === 0) return [];

    const results = [];
    const chunkSize = 50;

    for (let i = 0; i < itemHrefs.length; i += chunkSize) {
      const chunk = itemHrefs.slice(i, i + chunkSize);
      const multigetXml = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-multiget xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  ${chunk.map(h => `<D:href>${h}</D:href>`).join('\n  ')}
</C:calendar-multiget>`;

      let multigetOk = false;
      try {
        const mgRes = await this._httpRequest(settings, {
          path: colPath,
          method: 'REPORT',
          headers: { 'Depth': '1', 'Content-Type': 'application/xml; charset=utf-8' }
        }, multigetXml);

        if (mgRes.status === 207) {
          multigetOk = true;
          const itemResps = mgRes.body.split(/<\/?D:response>/i).filter(s => s.trim().length > 10);
          for (const iResp of itemResps) {
            const hrefMatch = iResp.match(/<D:href>([^<]+)<\/D:href>/i);
            const dataMatch = iResp.match(/<[^:]*:calendar-data>([\s\S]*?)<\/[^:]*:calendar-data>/i);
            const etagMatch = iResp.match(/<D:getetag>([^<]+)<\/D:getetag>/i);
            if (hrefMatch && dataMatch) {
              const rawIcs = dataMatch[1]
                .replace(/&#13;/g, '\r')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&');
              const parsed = this.parseIcsEvent(rawIcs);
              if (parsed) {
                parsed.href = hrefMatch[1].trim();
                parsed.etag = etagMatch ? etagMatch[1].trim().replace(/^"|"$/g, '') : null;
                results.push(parsed);
              }
            }
          }
        }
      } catch (e) {
        console.warn(`[Titan CalDAV] Multiget chunk failed, falling back to individual GETs: ${e.message}`);
      }

      // Fallback: if multiget failed, fetch individual items in chunk
      if (!multigetOk) {
        for (const href of chunk) {
          try {
            const getRes = await this._httpRequest(settings, { path: href, method: 'GET' });
            if (getRes.status === 200) {
              const parsed = this.parseIcsEvent(getRes.body);
              if (parsed) {
                parsed.href = href;
                parsed.etag = getRes.headers?.etag ? getRes.headers.etag.replace(/^"|"$/g, '') : null;
                results.push(parsed);
              }
            }
          } catch (itemErr) {
            console.warn(`[Titan CalDAV] Error getting item ${href}: ${itemErr.message}`);
          }
        }
      }
    }

    return results;
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
        const collections = await this.getCalendarCollections(settings);
        const primary = collections.find(c => c.isPrimary) || collections[0];
        const primaryItems = await this.getCalendarItems(settings, primary.path);

        return {
          success: true,
          configured: true,
          status: res.status,
          caldav_host: settings.host,
          principal: principalPath,
          collections: collections.map(c => ({ path: c.path, name: c.displayName, isPrimary: c.isPrimary })),
          primary_calendar: primary.path,
          items_count: primaryItems.length,
          message: `Successfully connected and authenticated with Titan CalDAV (${settings.host}). Discovered ${collections.length} calendar collections.`,
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
    if (!icsData) return null;
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
    const summary = (getProp('SUMMARY') || 'Titan Event').replace(/\\([,;\\])/g, '$1').trim();
    const description = (getProp('DESCRIPTION') || '').replace(/\\n/g, '\n').replace(/\\([,;\\])/g, '$1').trim();
    const location = (getProp('LOCATION') || '').replace(/\\([,;\\])/g, '$1').trim();
    const dtstart = parseCalDavDate(getPropLine('DTSTART') || getProp('DTSTART'));
    const dtend = parseCalDavDate(getPropLine('DTEND') || getProp('DTEND'));
    const status = (getProp('STATUS') || 'CONFIRMED').toLowerCase();
    const rrule = getProp('RRULE');
    const lastModified = parseCalDavDate(getPropLine('LAST-MODIFIED') || getProp('LAST-MODIFIED'));

    // Extract ORGANIZER
    let organizer = null;
    const orgMatch = unfolded.match(/(?:^|\r?\n)(ORGANIZER[^:\r\n]*:[^\r\n]*)/i);
    if (orgMatch) {
      const line = orgMatch[1];
      const mailtoM = line.match(/:mailto:([^\r\n]+)/i) || line.match(/:([^\r\n]+)/i);
      const email = mailtoM ? mailtoM[1].trim() : '';
      const cnM = line.match(/CN=([^;:\"\r\n]+|\"[^\"]+\")/i);
      const name = cnM ? cnM[1].replace(/^\"|\"$/g, '').trim() : email;
      organizer = { email, name };
    }

    // Extract ATTENDEEs
    const attendees = [];
    const attRegex = /(?:^|\r?\n)(ATTENDEE[^:\r\n]*:[^\r\n]*)/gi;
    let attMatch;
    while ((attMatch = attRegex.exec(unfolded)) !== null) {
      const line = attMatch[1];
      const mailtoM = line.match(/:mailto:([^\r\n]+)/i) || line.match(/:([^\r\n]+)/i);
      if (!mailtoM) continue;
      const email = mailtoM[1].trim();
      const cnM = line.match(/CN=([^;:\"\r\n]+|\"[^\"]+\")/i);
      const name = cnM ? cnM[1].replace(/^\"|\"$/g, '').trim() : email;
      const partstatM = line.match(/PARTSTAT=([A-Z\-]+)/i);
      const statusVal = partstatM ? partstatM[1].toLowerCase() : 'needs-action';
      const isOrg = organizer && organizer.email.toLowerCase() === email.toLowerCase();
      attendees.push({
        email,
        name,
        status: statusVal,
        isOrganizer: isOrg
      });
    }

    // In Titan Calendar, if an event has NO guests invited, attendees is empty. The organizer is purely the creator ("Event created by info").
    // We only prepend organizer into attendees if there are actual invited attendees present in the event!
    if (attendees.length > 0 && organizer && !attendees.some(a => a.email.toLowerCase() === organizer.email.toLowerCase())) {
      attendees.unshift({
        email: organizer.email,
        name: organizer.name,
        status: 'accepted',
        isOrganizer: true
      });
    }

    return { uid, summary, description, location, dtstart, dtend, status, rrule, lastModified, organizer, attendees };
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

        if (updateRes.status === 200 || updateRes.status === 201 || updateRes.status === 204) {
          console.log(`[Titan CalDAV] Event #${calendarEvent.id} successfully updated on Titan.`);
          return { success: true, action: 'updated', titan_event_id: calendarEvent.titan_event_id };
        } else {
          console.warn(`[Titan CalDAV] Failed to update event #${calendarEvent.id} on Titan. HTTP ${updateRes.status}`);
          return { success: false, status: updateRes.status };
        }
      }

      // Case 2: New event -> CREATE on Titan in primary calendar collection
      const calPath = await this.getPrimaryCalendarPath(settings);
      const targetPath = `${calPath}/lcm-evt-${calendarEvent.id}.ics`;
      console.log(`[Titan CalDAV] Creating new event #${calendarEvent.id} on Titan CalDAV collection: ${targetPath}`);

      const putRes = await this._httpRequest(settings, {
        path: targetPath,
        method: 'PUT',
        headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
      }, icsData);

      if (putRes.status === 201 || putRes.status === 200 || putRes.status === 204) {
        console.log(`[Titan CalDAV] Event #${calendarEvent.id} successfully created on Titan at ${targetPath}`);

        // Persist real Titan resource ID to DB
        await prisma.calendarEvent.update({
          where: { id: calendarEvent.id },
          data: { titan_event_id: targetPath },
        });

        return { success: true, action: 'created', titan_event_id: targetPath };
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

      const event = await prisma.calendarEvent.findUnique({
        where: { id: parseInt(eventId, 10) },
        select: { id: true, titan_event_id: true },
      });

      const calPath = await this.getPrimaryCalendarPath(settings);
      const targetPath = event?.titan_event_id || `${calPath}/lcm-evt-${eventId}.ics`;
      console.log(`[Titan CalDAV] Deleting event #${eventId} from Titan: ${targetPath}`);

      const delRes = await this._httpRequest(settings, {
        path: targetPath,
        method: 'DELETE',
      });

      if (delRes.status === 200 || delRes.status === 204 || delRes.status === 404) {
        console.log(`[Titan CalDAV] Event #${eventId} successfully removed from Titan (HTTP ${delRes.status}).`);
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
   * Pulls events created, updated, or deleted across ALL Titan calendar collections into Legal Case Management
   */
  async syncFromTitan(userId = 1, options = {}) {
    const forceFull = options.forceFull === true;
    try {
      const settings = await this.getSettings();
      if (!settings.enabled || !settings.email || !settings.password) {
        return { success: false, reason: 'unconfigured' };
      }

      const collections = await this.getCalendarCollections(settings);
      console.log(`[Titan CalDAV] Starting sync across ${collections.length} collections (forceFull: ${forceFull}): ${collections.map(c => c.path).join(', ')}`);

      let totalTitanEvents = 0;
      let createdCount = 0;
      let updatedCount = 0;
      let deletedCount = 0;

      for (const col of collections) {
        try {
          const itemHrefs = await this.getCalendarItems(settings, col.path);
          totalTitanEvents += itemHrefs.length;
          const activeHrefsSet = new Set(itemHrefs);

          // 1. Immediate Deletion Detection:
          // Remove any LCM event previously linked to this collection that is no longer in Titan
          const dbEventsForCol = await prisma.calendarEvent.findMany({
            where: {
              titan_event_id: { startsWith: col.path }
            },
            select: { id: true, titan_event_id: true, title: true }
          });

          const existingDbHrefSet = new Set(dbEventsForCol.map(e => e.titan_event_id));

          for (const dbEvt of dbEventsForCol) {
            if (!activeHrefsSet.has(dbEvt.titan_event_id)) {
              console.log(`[Titan CalDAV] Event #${dbEvt.id} ("${dbEvt.title}") was deleted from Titan collection ${col.path}. Removing from LCM.`);
              try {
                await prisma.calendarEvent.delete({
                  where: { id: dbEvt.id }
                });
                deletedCount++;
              } catch (delErr) {
                console.warn(`[Titan CalDAV] Error deleting #${dbEvt.id}:`, delErr.message);
              }
            }
          }

          // 2. Determine which items need to be fetched:
          const newHrefs = itemHrefs.filter(h => !existingDbHrefSet.has(h));
          const hrefsToFetch = forceFull ? itemHrefs : newHrefs;

          if (hrefsToFetch.length > 0) {
            const parsedEvents = await this.batchFetchEvents(settings, col.path, hrefsToFetch);

            for (const parsed of parsedEvents) {
              try {
                if (!parsed.summary || parsed.status === 'cancelled') {
                  if (parsed.href) {
                    const existingCancelled = await prisma.calendarEvent.findFirst({
                      where: { titan_event_id: parsed.href }
                    });
                    if (existingCancelled) {
                      await prisma.calendarEvent.delete({ where: { id: existingCancelled.id } });
                      deletedCount++;
                    }
                  }
                  continue;
                }

                // 1. Match by titan_event_id
                let existing = await prisma.calendarEvent.findFirst({
                  where: { titan_event_id: parsed.href },
                });

                // 2. Match by LCM UID (lcm-evt-${id}@...)
                if (!existing && parsed.uid && parsed.uid.startsWith('lcm-evt-')) {
                  const lcmMatch = parsed.uid.match(/^lcm-evt-(\d+)/);
                  if (lcmMatch) {
                    const lcmId = parseInt(lcmMatch[1], 10);
                    existing = await prisma.calendarEvent.findUnique({ where: { id: lcmId } });
                  }
                }

                // 3. Match unlinked event with same title and same start time (within 60s)
                if (!existing && parsed.dtstart) {
                  const windowStart = new Date(parsed.dtstart.getTime() - 60000);
                  const windowEnd = new Date(parsed.dtstart.getTime() + 60000);
                  existing = await prisma.calendarEvent.findFirst({
                    where: {
                      title: parsed.summary,
                      titan_event_id: null,
                      event_date: { gte: windowStart, lte: windowEnd },
                    }
                  });
                }

                if (existing) {
                  // Check if any field changed
                  const titleChanged = existing.title !== parsed.summary;
                  const descChanged = parsed.description && existing.description !== parsed.description;
                  const dateChanged = parsed.dtstart && Math.abs(existing.event_date.getTime() - parsed.dtstart.getTime()) > 1000;
                  const endDateChanged = parsed.dtend && (!existing.end_date || Math.abs(existing.end_date.getTime() - parsed.dtend.getTime()) > 1000);
                  const locChanged = parsed.location && existing.location !== parsed.location;
                  const idMissing = existing.titan_event_id !== parsed.href;

                  if (titleChanged || descChanged || dateChanged || endDateChanged || locChanged || idMissing) {
                    await prisma.calendarEvent.update({
                      where: { id: existing.id },
                      data: {
                        title: parsed.summary,
                        description: parsed.description || existing.description,
                        event_date: parsed.dtstart || existing.event_date,
                        end_date: parsed.dtend || existing.end_date,
                        location: parsed.location || existing.location,
                        titan_event_id: parsed.href,
                      },
                    });
                    updatedCount++;
                  }

                  // Sync attendees for existing event
                  if (parsed.attendees && parsed.attendees.length > 0) {
                    try {
                      await prisma.eventAttendee.deleteMany({ where: { event_id: existing.id } });
                      await prisma.eventAttendee.createMany({
                        data: parsed.attendees.map(a => ({
                          event_id: existing.id,
                          email: a.email,
                          status: a.status === 'accepted' ? 'accepted' : 'pending',
                          is_optional: !a.isOrganizer,
                        }))
                      });
                    } catch (attErr) {
                      // Ignore duplicate or constraint warnings
                    }
                  } else {
                    // When Titan event has 0 attendees, ensure DB has 0 attendees for this event
                    try {
                      await prisma.eventAttendee.deleteMany({ where: { event_id: existing.id } });
                    } catch (attErr) {
                      // Ignore
                    }
                  }
                } else {
                  // Create new event imported from Titan into Legal Case Management
                  const created = await prisma.calendarEvent.create({
                    data: {
                      title: parsed.summary,
                      description: parsed.description || null,
                      event_date: parsed.dtstart || new Date(),
                      end_date: parsed.dtend || null,
                      location: parsed.location || null,
                      type: 'general',
                      court_related: false,
                      created_by: userId || 1,
                      titan_event_id: parsed.href,
                      timezone: PACIFIC_TIMEZONE,
                    },
                  });
                  createdCount++;

                  // Sync attendees for new event
                  if (parsed.attendees && parsed.attendees.length > 0) {
                    try {
                      await prisma.eventAttendee.createMany({
                        data: parsed.attendees.map(a => ({
                          event_id: created.id,
                          email: a.email,
                          status: a.status === 'accepted' ? 'accepted' : 'pending',
                          is_optional: !a.isOrganizer,
                        }))
                      });
                    } catch (attErr) {
                      // Ignore duplicate or constraint warnings
                    }
                  }
                }
              } catch (eventErr) {
                console.warn(`[Titan CalDAV] Error syncing event ${parsed.href}:`, eventErr.message);
              }
            }
          }
        } catch (colErr) {
          console.warn(`[Titan CalDAV] Error syncing collection ${col.path}:`, colErr.message);
        }
      }

      return {
        success: true,
        collections_count: collections.length,
        total_titan_events: totalTitanEvents,
        created: createdCount,
        updated: updatedCount,
        deleted: deletedCount,
        message: `Synced with Titan Calendar: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted across ${totalTitanEvents} events in ${collections.length} collections.`,
      };
    } catch (err) {
      console.error('[Titan CalDAV Sync From Titan Error]:', err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new TitanCalendarService();
