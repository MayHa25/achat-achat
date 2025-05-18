// functions/index.js
require("dotenv").config();

const functions   = require("firebase-functions");
const admin       = require("firebase-admin");
const twilio      = require("twilio");
const express     = require("express");
const bodyParser  = require("body-parser");
const path        = require("path");
const { google }  = require("googleapis");

admin.initializeApp();

// =======================
// Twilio setup
// =======================
const accountSid = functions.config()?.twilio?.sid   || process.env.TWILIO_SID;
const authToken  = functions.config()?.twilio?.token || process.env.TWILIO_AUTH_TOKEN;
const fromPhone  = functions.config()?.twilio?.phone || process.env.TWILIO_PHONE;
const client     = twilio(accountSid, authToken);

// =======================
// Nodemailer transporter (lazy init)
// =======================
let transporter;
function getTransporter() {
  if (!transporter) {
    const nodemailer = require("nodemailer");
    const mailConfig = functions.config().mail;
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: mailConfig.user,
        pass: mailConfig.pass,
      },
    });
  }
  return transporter;
}

// =======================
// Google Calendar service account helper
// =======================
async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "calendar-service-account.json"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return auth.getClient();
}

async function addToGoogleCalendar(appointment, calendarId) {
  const authClient = await getAuthClient();
  const calendar   = google.calendar({ version: "v3", auth: authClient });
  const dateObj    = appointment.startTime.toDate();
  const durationMs = (appointment.duration || 30) * 60000;

  const event = {
    summary:     appointment.serviceName || 'תור חדש',
    description: `לקוחה: ${appointment.clientName}\nטלפון: ${appointment.clientPhone}\nהערות: ${appointment.notes || '-'}`,
    start:       { dateTime: dateObj.toISOString(), timeZone: 'Asia/Jerusalem' },
    end:         { dateTime: new Date(dateObj.getTime() + durationMs).toISOString(), timeZone: 'Asia/Jerusalem' },
  };

  return calendar.events.insert({ calendarId, resource: event });
}

// =======================
// Google OAuth2 endpoints
// =======================
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Redirects user to Google for authentication
exports.googleAuth = functions.https.onRequest((req, res) => {
  const stateObj = {
    businessId: req.query.businessId,
    uid:        req.query.uid
  };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt:      'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
    state
  });
  res.redirect(authUrl);
});

// Handles OAuth2 callback from Google
exports.googleCallback = functions.https.onRequest(async (req, res) => {
  try {
    const code = req.query.code;
    const encodedState = req.query.state;
    if (!code || !encodedState) {
      return res.status(400).send('Missing code or state');
    }
    const decoded = Buffer.from(encodedState, 'base64').toString();
    const { businessId } = JSON.parse(decoded);

    const tokenResponse = await oauth2Client.getToken(code);
    const tokens = tokenResponse.tokens;
    oauth2Client.setCredentials(tokens);

    // Save tokens to Firestore under the business document
    await admin.firestore().collection('businesses').doc(businessId).update({
      googleCalendar: tokens
    });

    // Redirect back to frontend dashboard
    res.redirect(`${process.env.CLIENT_URL}/admin/settings?google=connected`);
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    res.status(500).send('Authentication error');
  }
});
// =======================
// Callable: sendSmsOnBooking
// =======================
exports.sendSmsOnBooking = functions
  .runWith({ timeoutSeconds: 30, memory: "256MB" })
  .https.onCall(async (data) => {
    const { phone, message, businessId, clientName, serviceName, startTime, notes } = data;
    const formattedClientPhone = phone.startsWith('+')
      ? phone
      : `+972${phone.replace(/^0/, '')}`;

    // 1. SMS to client
    await client.messages.create({ body: message, from: fromPhone, to: formattedClientPhone });

    // 2. SMS to owner
    const ownerSnap = await admin.firestore()
      .collection('users')
      .where('businessId','==', businessId)
      .where('role','==','admin')
      .limit(1)
      .get();

    let calendarId;
    if (!ownerSnap.empty) {
      const owner = ownerSnap.docs[0].data();
      const formattedOwnerPhone = owner.phone.startsWith('+')
        ? owner.phone
        : `+972${owner.phone.replace(/^0/, '')}`;

      const rawDate = new Date(startTime);
      const day     = rawDate.toLocaleDateString('he-IL', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric', timeZone:'Asia/Jerusalem' });
      const time    = rawDate.toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jerusalem' });

      const ownerMessage = `📅 תור חדש:\nלקוחה: ${clientName}\nשירות: ${serviceName}\nתאריך: ${day} בשעה ${time}`;
      await client.messages.create({ body: ownerMessage, from: fromPhone, to: formattedOwnerPhone });

      // Fetch calendarId from business doc
      const bizDoc = await admin.firestore().collection('businesses').doc(businessId).get();
      calendarId = bizDoc.data()?.calendarId;
    }

    // 3. Create event in Google Calendar if connected
    if (calendarId) {
      await addToGoogleCalendar({
        clientName,
        clientPhone: formattedClientPhone,
        serviceName,
        notes,
        startTime: admin.firestore.Timestamp.fromDate(new Date(startTime)),
        duration: data.duration
      }, calendarId);
    }

    return { success: true };
  });

// =======================
// HTTP endpoint: sendSms
// =======================
exports.sendSms = functions.https.onRequest(async (req, res) => {
  const { to, message } = req.body;
  const formattedPhone  = to.startsWith('+') ? to : `+972${to.replace(/^0/, '')}`;

  try {
    await client.messages.create({ body: message, from: fromPhone, to: formattedPhone });
    res.status(200).send({ success: true });
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    res.status(500).send({ success: false, error: error.message });
  }
});

// =======================
// HTTP endpoint: onIncomingSMS
// =======================
const smsApp = express();
smsApp.use(bodyParser.urlencoded({ extended: false }));
smsApp.use(bodyParser.json());

smsApp.post('/', async (req, res) => {
  const incomingMsg = req.body.Body?.trim();
  const from        = req.body.From;

  if (incomingMsg === '1') {
    const phone = from.startsWith('+972') ? '0' + from.slice(4) : from;
    const now   = new Date();

    const snapshot = await admin.firestore()
      .collection('appointments')
      .where('clientPhone','==', phone)
      .where('status','==','pending')
      .get();

    let cancelled = false;
    for (const docSnap of snapshot.docs) {
      const data      = docSnap.data();
      const startTime = data.startTime.toDate();
      if ((startTime - now) >= 24*60*60*1000) {
        await docSnap.ref.update({ status: 'cancelled_by_client' });

        // Notify owner
        const ownerDoc = await admin.firestore()
          .collection('users')
          .where('businessId','==', data.businessId)
          .where('role','==','admin')
          .limit(1)
          .get();

        if (!ownerDoc.empty) {
          const owner         = ownerDoc.docs[0].data();
          const formattedOwner = owner.phone.startsWith('+')
            ? owner.phone
            : `+972${owner.phone.replace(/^0/, '')}`;
          const day  = startTime.toLocaleDateString('he-IL', { weekday:'long', day:'2-digit', month:'2-digit', timeZone:'Asia/Jerusalem' });
          const time = startTime.toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jerusalem' });
          const ownerMessage = `שלום, הלקוחה ${data.clientName} ביטלה תור ליום ${day} בשעה ${time}.`;
          await client.messages.create({ body: ownerMessage, from: fromPhone, to: formattedOwner });
        }

        // Confirmation to client
        await client.messages.create({ body: 'התור בוטל בהצלחה.', from: fromPhone, to: from });

        cancelled = true;
        break;
      }
    }

    if (!cancelled) {
      await client.messages.create({ body: 'לא ניתן לבטל פחות מ-24 שעות מראש.', from: fromPhone, to: from });
    }
  }

  res.send('OK');
});
exports.onIncomingSMS = functions.https.onRequest(smsApp);
// =======================
// Firestore trigger: onCreate appointment
// =======================
exports.sendAppointmentSmsOnCreate = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap) => {
    const appointment = snap.data();
    const businessId  = appointment.businessId;
    const dateObj     = appointment.startTime.toDate();
    const day         = dateObj.toLocaleDateString('he-IL', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric', timeZone:'Asia/Jerusalem' });
    const time        = dateObj.toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jerusalem' });

    // SMS to client
    await client.messages.create({
      body: `היי ${appointment.clientName}, התור שלך נקבע ליום ${day} בשעה ${time}.`,
      from: fromPhone,
      to: appointment.clientPhone.startsWith('+')
        ? appointment.clientPhone
        : `+972${appointment.clientPhone.replace(/^0/, '')}`
    });

    // Notify owner
    const ownerSnap = await admin.firestore()
      .collection('users')
      .where('businessId','==', businessId)
      .where('role','==','admin')
      .limit(1)
      .get();

    let calendarId;
    if (!ownerSnap.empty) {
      const owner        = ownerSnap.docs[0].data();
      const formattedOwner = owner.phone.startsWith('+') ? owner.phone : `+972${owner.phone.replace(/^0/, '')}`;
      await client.messages.create({ body: `📌 תור חדש: ${appointment.clientName} ליום ${day} בשעה ${time}.`, from: fromPhone, to: formattedOwner });

      const bizDoc = await admin.firestore().collection('businesses').doc(businessId).get();
      calendarId   = bizDoc.data()?.calendarId;
    }

    // Create calendar event
    if (calendarId) {
      await addToGoogleCalendar({
        clientName:  appointment.clientName,
        clientPhone: appointment.clientPhone,
        serviceName: appointment.serviceName,
        notes:       appointment.notes,
        startTime:   appointment.startTime,
        duration:    appointment.duration
      }, calendarId);
    }
  });

// =======================
// Firestore trigger: onUpdate appointment (cancelled_by_admin)
// =======================
exports.notifyClientOnCancel = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change) => {
    const before    = change.before.data();
    const after     = change.after.data();
    if (before.status !== 'cancelled_by_admin' && after.status === 'cancelled_by_admin') {
      const appointment = after;
      const dateObj     = appointment.startTime.toDate();
      const day         = dateObj.toLocaleDateString('he-IL', { weekday:'long', day:'2-digit', month:'2-digit', timeZone:'Asia/Jerusalem' });
      const time        = dateObj.toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jerusalem' });
      const clientPhone = appointment.clientPhone.startsWith('+') ? appointment.clientPhone : `+972${appointment.clientPhone.replace(/^0/, '')}`;
      await client.messages.create({ body: `שלום ${appointment.clientName}, התור שלך ליום ${day} בשעה ${time} בוטל על-ידי בעלת העסק.`, from: fromPhone, to: clientPhone });
    }
  });

// =======================
// Scheduled reminders (load from separate module)
// =======================
Object.assign(exports, require('./reminderFunctions'));
