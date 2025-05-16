// functions/index.js
require("dotenv").config();

const functions   = require("firebase-functions");
const admin       = require("firebase-admin");
const twilio      = require("twilio");
const express     = require("express");
const cors        = require("cors");
const bodyParser  = require("body-parser");
const path        = require("path");
const nodemailer  = require("nodemailer");

admin.initializeApp();

// =======================
// Mailer setup
// =======================
const mailConfig = functions.config().mail;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: mailConfig.user,
    pass: mailConfig.pass,
  },
});

// =======================
// Twilio setup
// =======================
const accountSid = functions.config()?.twilio?.sid   || process.env.TWILIO_SID;
const authToken  = functions.config()?.twilio?.token || process.env.TWILIO_AUTH_TOKEN;
const fromPhone  = functions.config()?.twilio?.phone || process.env.TWILIO_PHONE;
const client     = twilio(accountSid, authToken);

// =======================
// Google Calendar helper (lazy load)
// =======================
async function getAuthClient() {
  const { google } = require('googleapis');
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'calendar-service-account.json'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return auth.getClient();
}

async function addToGoogleCalendar(appointment, calendarId) {
  const { google } = require('googleapis');
  const authClient = await getAuthClient();
  const calendar   = google.calendar({ version: 'v3', auth: authClient });

  const dateObj = appointment.startTime.toDate();
  const event = {
    summary:     appointment.serviceName || 'תור חדש',
    description: `לקוחה: ${appointment.clientName}\nטלפון: ${appointment.clientPhone}\nהערות: ${appointment.notes || '-'}`,
    start:       { dateTime: dateObj.toISOString(), timeZone: 'Asia/Jerusalem' },
    end:         { dateTime: new Date(dateObj.getTime() + 30*60000).toISOString(), timeZone: 'Asia/Jerusalem' },
  };

  return calendar.events.insert({
    calendarId,
    resource: event,
  });
}

// =======================
// Callable: sendSmsOnBooking
// =======================
exports.sendSmsOnBooking = functions.https.onCall(async (data) => {
  const { phone, message, businessId, clientName, serviceName, startTime, notes } = data;
  const formattedClientPhone = phone.startsWith('+') ? phone : `+972${phone.replace(/^0/, '')}`;

  // 1. SMS ללקוחה
  await client.messages.create({ body: message, from: fromPhone, to: formattedClientPhone });

  // 2. מציאת בעלת העסק ומשיכת calendarId
  const [ownerSnap] = await admin.firestore()
    .collection('users')
    .where('businessId','==', businessId)
    .where('role','==','admin')
    .limit(1)
    .get().docs;

  let calendarId;
  if (ownerSnap) {
    const owner = ownerSnap.data();
    // שליפת calendarId מתוך מסמך העסק
    const bizDoc = await admin.firestore().collection('businesses').doc(businessId).get();
    calendarId = bizDoc.data()?.calendarId;

    // 3. SMS לבעלת העסק
    const formattedOwnerPhone = owner.phone.startsWith('+') ? owner.phone : `+972${owner.phone.replace(/^0/, '')}`;
    const rawDate = new Date(startTime);
    const day     = rawDate.toLocaleDateString('he-IL',{ weekday:'long', day:'2-digit', month:'2-digit', year:'numeric', timeZone:'Asia/Jerusalem' });
    const time    = rawDate.toLocaleTimeString('he-IL',{ hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jerusalem' });
    const ownerMessage = `📅 תור חדש:\nלקוחה: ${clientName}\nשירות: ${serviceName}\nתאריך: ${day} בשעה ${time}`;
    await client.messages.create({ body: ownerMessage, from: fromPhone, to: formattedOwnerPhone });
  }

  // 4. יצירת אירוע ביומן
  if (calendarId) {
    await addToGoogleCalendar({
      clientName,
      clientPhone: formattedClientPhone,
      serviceName,
      notes,
      startTime: admin.firestore.Timestamp.fromDate(new Date(startTime)),
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
    console.error('שגיאה בשליחת SMS:', error.message);
    res.status(500).send({ success: false, error: error.message });
  }
});

// =======================
// HTTP endpoint: onIncomingSMS
// =======================
const smsApp = express();
 smsApp.use(bodyParser.urlencoded({ extended: false }));
 smsApp.post('/', async (req, res) => {
  const incomingMsg = req.body.Body?.trim();
  const from        = req.body.From;

  if (incomingMsg === '1') {
    const phone = from.startsWith('+972') ? '0'+from.slice(4) : from;
    const now   = new Date();

    const snapshot = await admin.firestore()
      .collectionGroup('appointments')
      .where('clientPhone','==', phone)
      .where('status','==','pending')
      .get();

    let cancelled = false;
    for (const docSnap of snapshot.docs) {
      const data      = docSnap.data();
      const startTime = data.startTime.toDate();
      if ((startTime - now) >= 24*60*60*1000) {
        await docSnap.ref.update({ status: 'cancelled_by_client' });
        // הודעה לבעלת העסק
        const ownerDoc = await admin.firestore()
          .collection('users')
          .where('businessId','==', data.businessId)
          .where('role','==','admin')
          .limit(1)
          .get();

        if (!ownerDoc.empty) {
          const owner = ownerDoc.docs[0].data();
          const formattedOwner = owner.phone.startsWith('+') ? owner.phone : `+972${owner.phone.replace(/^0/, '')}`;
          const day  = startTime.toLocaleDateString('he-IL',{ weekday:'long', day:'2-digit', month:'2-digit', timeZone:'Asia/Jerusalem' });
          const time = startTime.toLocaleTimeString('he-IL',{ hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jerusalem' });
          const ownerMessage = `שלום, הלקוחה ${data.clientName} ביטלה את התור שלה ליום ${day} בשעה ${time}.`;
          await client.messages.create({ body: ownerMessage, from: fromPhone, to: formattedOwner });
        }
        await client.messages.create({ body: 'התור בוטל בהצלחה.', from: fromPhone, to: from });
        cancelled = true;
        break;
      }
    }
    if (!cancelled) {
      await client.messages.create({ body: 'לא ניתן לבטל תורים פחות מ-24 שעות מראש.', from: fromPhone, to: from });
    }
  }
  res.send('OK');
});
exports.onIncomingSMS = functions.https.onRequest(smsApp);

// =======================
// Firestore trigger: onCreate appointment
// =======================
exports.sendAppointmentSmsOnCreate = functions.firestore
  .document('businesses/{businessId}/appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const appointment = snap.data();
    const businessId  = context.params.businessId;
    const dateObj     = appointment.startTime.toDate();
    const day         = dateObj.toLocaleDateString('he-IL',{ weekday:'long', day:'2-digit', month:'2-digit', year:'numeric', timeZone:'Asia/Jerusalem' });
    const time        = dateObj.toLocaleTimeString('he-IL',{ hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jerusalem' });

    // SMS ללקוחה
    const clientMsg = `היי ${appointment.clientName}, התור שלך נקבע ליום ${day} בשעה ${time}.`;
    await client.messages.create({
      body: clientMsg,
      from: fromPhone,
      to: appointment.clientPhone.startsWith('+') ? appointment.clientPhone : `+972${appointment.clientPhone.replace(/^0/, '')}`
    });

    // SMS לבעלת העסק
    const ownerSnap = await admin.firestore()
      .collection('users')
      .where('businessId','==', businessId)
      .where('role','==','admin')
      .limit(1)
      .get();

    let calendarId;
    if (!ownerSnap.empty) {
      const owner = ownerSnap.docs[0].data();
      const formattedOwner = owner.phone.startsWith('+') ? owner.phone : `+972${owner.phone.replace(/^0/, '')}`;
      const ownerMsg = `📌 תור חדש: ${appointment.clientName} ליום ${day} בשעה ${time}.`;
      await client.messages.create({ body: ownerMsg, from: fromPhone, to: formattedOwner });

      // שליפת calendarId של העסק
      const bizDoc = await admin.firestore().collection('businesses').doc(businessId).get();
      calendarId = bizDoc.data()?.calendarId;
    }

    // יצירת אירוע ביומן
    if (calendarId) {
      await addToGoogleCalendar({
        clientName:  appointment.clientName,
        clientPhone: appointment.clientPhone,
        serviceName: appointment.serviceName,
        notes:       appointment.notes,
        startTime:   appointment.startTime,
      }, calendarId);
    }
  });

// =======================
// Firestore trigger: onUpdate appointment (cancelled_by_admin)
// =======================
exports.notifyClientOnCancel = functions.firestore
  .document('businesses/{businessId}/appointments/{appointmentId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after  = change.after.data();
    if (before.status !== 'cancelled_by_admin' && after.status === 'cancelled_by_admin') {
      const dateObj = after.startTime.toDate ? after.startTime.toDate() : new Date(after.startTime);
      const day     = dateObj.toLocaleDateString('he-IL',{ weekday:'long', day:'2-digit', month:'2-digit', timeZone:'Asia/Jerusalem' });
      const time    = dateObj.toLocaleTimeString('he-IL',{ hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jerusalem' });
      const formattedPhone = after.clientPhone.startsWith('+') ? after.clientPhone : `+972${after.clientPhone.replace(/^0/, '')}`;
      const body    = `שלום ${after.clientName}, התור שלך ליום ${day} בשעה ${time} בוטל על-ידי בעלת העסק.`;
      await client.messages.create({ body, from: fromPhone, to: formattedPhone });
    }
  });

// =======================
// HTTP function: sendContactForm
// =======================
const contactApp = express();
contactApp.use(cors({ origin: true }));
contactApp.use(bodyParser.json());

contactApp.post('/', async (req, res) => {
  try {
    const { businessName, contactName, phone, email, selfRegister } = req.body;
    const text = `
שם העסק:       ${businessName}
איש קשר:        ${contactName}
טלפון:          ${phone}
אימייל:         ${email}
הרשמה עצמית:   ${selfRegister ? 'כן' : 'לא'}
`;
    await transporter.sendMail({ from: mailConfig.user, to: mailConfig.to, subject: 'פנייה חדשה מטופס צור קשר', text });
    res.status(200).send({ success: true });
  } catch (err) {
    console.error('sendContactForm error:', err);
    res.status(500).send({ success: false, error: err.message });
  }
});
exports.sendContactForm = functions.https.onRequest(contactApp);
