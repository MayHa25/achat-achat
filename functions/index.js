// functions/index.js
require("dotenv").config();

const functions = require("firebase-functions");
const admin     = require("firebase-admin");
const twilio    = require("twilio");
const path      = require("path");

admin.initializeApp();

// =======================
// Twilio setup
// =======================
const accountSid = functions.config()?.twilio?.sid   || process.env.TWILIO_SID;
const authToken  = functions.config()?.twilio?.token || process.env.TWILIO_AUTH_TOKEN;
const fromPhone  = functions.config()?.twilio?.phone || process.env.TWILIO_PHONE;
const client     = twilio(accountSid, authToken);

// =======================
// Lazy helper: Nodemailer transporter
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
// Lazy helper: Google Calendar
// =======================
async function getAuthClient() {
  const { google } = require("googleapis");
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "calendar-service-account.json"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return auth.getClient();
}

async function addToGoogleCalendar(appointment, calendarId) {
  const { google }   = require("googleapis");
  const authClient   = await getAuthClient();
  const calendar     = google.calendar({ version: "v3", auth: authClient });
  const dateObj      = appointment.startTime.toDate();

  const event = {
    summary:     appointment.serviceName || 'תור חדש',
    description: `לקוחה: ${appointment.clientName}\nטלפון: ${appointment.clientPhone}\nהערות: ${appointment.notes || '-'}`,
    start:       { dateTime: dateObj.toISOString(), timeZone: 'Asia/Jerusalem' },
    end:         { dateTime: new Date(dateObj.getTime() + 30*60000).toISOString(), timeZone: 'Asia/Jerusalem' },
  };

  return calendar.events.insert({ calendarId, resource: event });
}

// =======================
// Callable: sendSmsOnBooking
// =======================
exports.sendSmsOnBooking = functions
  .runWith({ timeoutSeconds: 30, memory: "256MB" })
  .https.onCall(async (data) => {
    const {
      phone, message,
      businessId, clientName,
      serviceName, startTime, notes
    } = data;

    const formattedClientPhone = phone.startsWith('+')
      ? phone
      : `+972${phone.replace(/^0/, '')}`;

    // 1. SMS ללקוחה
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: formattedClientPhone
    });

    // 2. מציאת בעל/ת העסק
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
      const day     = rawDate.toLocaleDateString('he-IL', {
        weekday:'long', day:'2-digit', month:'2-digit', year:'numeric',
        timeZone:'Asia/Jerusalem'
      });
      const time    = rawDate.toLocaleTimeString('he-IL', {
        hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jerusalem'
      });

      // 3. SMS לבעל/ת העסק
      const ownerMessage = `📅 תור חדש:\nלקוחה: ${clientName}\nשירות: ${serviceName}\nתאריך: ${day} בשעה ${time}`;
      await client.messages.create({
        body: ownerMessage,
        from: fromPhone,
        to: formattedOwnerPhone
      });

      // שליפת calendarId מתוך מסמך העסק
      const bizDoc = await admin.firestore()
        .collection('businesses')
        .doc(businessId)
        .get();
      calendarId = bizDoc.data()?.calendarId;
    }

    // 4. יצירת אירוע ביומן
    if (calendarId) {
      await addToGoogleCalendar({
        clientName,
        clientPhone: formattedClientPhone,
        serviceName,
        notes,
        startTime: admin.firestore.Timestamp.fromDate(new Date(startTime))
      }, calendarId);
    }

    return { success: true };
  });

// =======================
// HTTP endpoint: sendSms
// =======================
exports.sendSms = functions.https.onRequest(async (req, res) => {
  const { to, message } = req.body;
  const formattedPhone  = to.startsWith('+')
    ? to
    : `+972${to.replace(/^0/, '')}`;

  try {
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: formattedPhone
    });
    res.status(200).send({ success: true });
  } catch (error) {
    console.error('שגיאה בשליחת SMS:', error.message);
    res.status(500).send({ success: false, error: error.message });
  }
});

// =======================
// HTTP endpoint: onIncomingSMS
// =======================
exports.onIncomingSMS = functions.https.onRequest((req, res) => {
  const express    = require("express");
  const bodyParser = require("body-parser");
  const app        = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.post('/', async (req2, res2) => {
    const incomingMsg = req2.body.Body?.trim();
    const from        = req2.body.From;

    if (incomingMsg === '1') {
      const phone = from.startsWith('+972')
        ? '0'+from.slice(4)
        : from;
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

          // הודעה לבעל/ת העסק
          const ownerDoc = await admin.firestore()
            .collection('users')
            .where('businessId','==', data.businessId)
            .where('role','==','admin')
            .limit(1)
            .get();

          if (!ownerDoc.empty) {
            const owner = ownerDoc.docs[0].data();
            const formattedOwner = owner.phone.startsWith('+')
              ? owner.phone
              : `+972${owner.phone.replace(/^0/, '')}`;
            const day  = startTime.toLocaleDateString('he-IL', {
              weekday:'long', day:'2-digit', month:'2-digit',
              timeZone:'Asia/Jerusalem'
            });
            const time = startTime.toLocaleTimeString('he-IL', {
              hour:'2-digit', minute:'2-digit',
              timeZone:'Asia/Jerusalem'
            });
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
    res2.send('OK');
  });

  app(req, res);
});

// =======================
// Firestore trigger: onCreate appointment
// =======================
exports.sendAppointmentSmsOnCreate = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const appointment = snap.data();
    const businessId  = appointment.businessId;
    const dateObj     = appointment.startTime.toDate();
    const day         = dateObj.toLocaleDateString('he-IL', {
      weekday:'long', day:'2-digit', month:'2-digit', year:'numeric',
      timeZone:'Asia/Jerusalem'
    });
    const time        = dateObj.toLocaleTimeString('he-IL', {
      hour:'2-digit', minute:'2-digit',
      timeZone:'Asia/Jerusalem'
    });

    // SMS ללקוחה
    const clientMsg = `היי ${appointment.clientName}, התור שלך נקבע ליום ${day} בשעה ${time}.`;
    await client.messages.create({
      body: clientMsg,
      from: fromPhone,
      to: appointment.clientPhone.startsWith('+')
        ? appointment.clientPhone
        : `+972${appointment.clientPhone.replace(/^0/, '')}`
    });

    // SMS לבעל/ת העסק
    const ownerSnap = await admin.firestore()
      .collection('users')
      .where('businessId','==', businessId)
      .where('role','==','admin')
      .limit(1)
      .get();

    let calendarId;
    if (!ownerSnap.empty) {
      const owner = ownerSnap.docs[0].data();
      const formattedOwner = owner.phone.startsWith('+')
        ? owner.phone
        : `+972${owner.phone.replace(/^0/, '')}`;
      const ownerMsg = `📌 תור חדש: ${appointment.clientName} ליום ${day} בשעה ${time}.`;
      await client.messages.create({ body: ownerMsg, from: fromPhone, to: formattedOwner });

      // שליפת calendarId של העסק
      const bizDoc = await admin.firestore()
        .collection('businesses')
        .doc(businessId)
        .get();
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
  .document('appointments/{appointmentId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after  = change.after.data();
    if (before.status !== 'cancelled_by_admin' && after.status === 'cancelled_by_admin') {
      const appointment = after;
      const dateObj     = appointment.startTime.toDate();
      const day         = dateObj.toLocaleDateString('he-IL', {
        weekday:'long', day:'2-digit', month:'2-digit', timeZone:'Asia/Jerusalem'
      });
      const time        = dateObj.toLocaleTimeString('he-IL', {
        hour:'2-digit', minute:'2-digit', timeZone:'Asia/Jerusalem'
      });
      const clientPhone = appointment.clientPhone.startsWith('+')
        ? appointment.clientPhone
        : `+972${appointment.clientPhone.replace(/^0/, '')}`;
      const body        = `שלום ${appointment.clientName}, התור שלך ליום ${day} בשעה ${time} בוטל על-ידי בעלת העסק.`;
      await client.messages.create({ body, from: fromPhone, to: clientPhone });
    }
  });

// =======================
// HTTP function: sendContactForm
// =======================
exports.sendContactForm = functions.https.onRequest((req, res) => {
  const express    = require("express");
  const cors       = require("cors");
  const bodyParser = require("body-parser");
  const app        = express();

  app.use(cors({ origin: true }));
  app.use(bodyParser.json());
  app.post('/', async (req2, res2) => {
    try {
      const { businessName, contactName, phone, email, selfRegister } = req2.body;
      const text = `
שם העסק:       ${businessName}
איש קשר:        ${contactName}
טלפון:          ${phone}
אימייל:         ${email}
הרשמה עצמית:   ${selfRegister ? 'כן' : 'לא'}
`;
      await getTransporter().sendMail({
        from: functions.config().mail.user,
        to:   functions.config().mail.to,
        subject: 'פנייה חדשה מטופס צור קשר',
        text
      });
      res2.status(200).send({ success: true });
    } catch (err) {
      console.error('sendContactForm error:', err);
      res2.status(500).send({ success: false, error: err.message });
    }
  });

  app(req, res);
});
