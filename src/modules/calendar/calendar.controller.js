const calendarService = require('./calendar.service');
const titanCalendarService = require('../settings/titan-calendar.service');

let lastTitanSync = 0;
let isSyncing = false;

exports.getEvents = async (req, res, next) => {
  try {
    const now = Date.now();
    // Fast automatic sync if > 6 seconds since last sync and not already in flight
    if (now - lastTitanSync > 6000 && !isSyncing) {
      isSyncing = true;
      try {
        await titanCalendarService.syncFromTitan(req.user?.id || 1, { forceFull: false });
        lastTitanSync = Date.now();
      } catch (syncErr) {
        console.warn('[Auto-sync from Titan CalDAV]:', syncErr.message);
      } finally {
        isSyncing = false;
      }
    }

    const data = await calendarService.getAllEvents();
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

exports.addEvent = async (req, res, next) => {
  try {
    const data = await calendarService.createEvent(req.user.id, req.body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

exports.acknowledgeEvent = async (req, res, next) => {
  try {
    const data = await calendarService.acknowledgeEvent(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const outlookService = require('./outlook.service');
const prisma = require('../../config/db');

exports.connectOutlook = (req, res, next) => {
  try {
    const authUrl = outlookService.getAuthUrl(req.user.id);
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

exports.callbackOutlook = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).send('Missing code or state');
    }

    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    await outlookService.handleCallback(code, parseInt(userId, 10));

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/admin/settings?tab=Integrations`);
  } catch (error) {
    console.error('Error during Outlook OAuth callback:', error.message);
    res.status(500).send('Authentication failed: ' + error.message);
  }
};

exports.disconnectOutlook = async (req, res, next) => {
  try {
    await outlookService.disconnect(req.user.id);
    res.status(200).json({ success: true, message: 'Outlook Calendar disconnected successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getStatusOutlook = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { outlook_refresh_token: true }
    });
    const connected = !!user?.outlook_refresh_token;
    const configured = outlookService.isConfigured();
    res.status(200).json({ success: true, connected, configured });
  } catch (error) {
    next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const data = await calendarService.updateEvent(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    await calendarService.deleteEvent(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const data = await calendarService.getAllCategories(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const data = await calendarService.createCategory(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const data = await calendarService.updateCategory(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await calendarService.deleteCategory(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const titanCalendarService = require('../settings/titan-calendar.service');

exports.getIcsFeed = async (req, res, next) => {
  try {
    const rawEvents = await prisma.calendarEvent.findMany({
      include: { matter: { select: { matter_number: true, title: true } } },
      orderBy: { event_date: 'asc' }
    });
    const icsContent = titanCalendarService.generateIcsFeed(rawEvents);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="legal-case-calendar.ics"');
    res.status(200).send(icsContent);
  } catch (error) {
    next(error);
  }
};

exports.getTitanCalendarStatus = async (req, res, next) => {
  try {
    const settings = await titanCalendarService.getSettings();
    res.status(200).json({
      success: true,
      configured: Boolean(settings.email && settings.password),
      caldav_host: settings.host,
      caldav_port: settings.port,
      email: settings.email || null,
      supported_methods: ['CalDAV (RFC 4791)', 'iCalendar Subscription (RFC 5545)'],
      feed_url: `${req.protocol}://${req.get('host')}/api/calendar/feed.ics`
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyTitanCalDav = async (req, res, next) => {
  try {
    const result = await titanCalendarService.verifyCalDavConnection();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.syncTitanCalendar = async (req, res, next) => {
  try {
    const result = await titanCalendarService.syncFromTitan(req.user?.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

