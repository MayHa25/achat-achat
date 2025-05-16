require("dotenv").config();

const functions = require("firebase-functions");
const admin     = require("firebase-admin");
const twilio    = require("twilio");
const express   = require("express");
const bodyParser= require("body-parser");
const path      = require("path");
const nodemailer = require("nodemailer");

admin.initializeApp();

// משתני הסביבה שהגדרת דרך `firebase functions:config:set`
const mailConfig = functions.config().mail;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: mailConfig.user,
    pass: mailConfig.pass,
  }
});

const accountSid = functions.config()?.twilio?.sid || process.env.TWILIO_SID;
const authToken  = functions.config()?.twilio?.token || process.env.TWILIO_AUTH_TOKEN;
const fromPhone  = functions.config()?.twilio?.phone || process.env.TWILIO_PHONE;
const client     = twilio(accountSid, authToken);

/**
 * מחזיר AuthClient עבור Google Calendar
 * ייבוא דינמי כדי למנוע timeout בפריסה
 */
async function getAuthClient() {
  const { google } = require("googleapis");
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "calendar-service-account.json"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return await auth.getClient();
}

/**
 * מוסיף אירוע חדש ל-Google Calendar
 */
async function addToGoogleCalendar(appointment) {
  const { google } = require("googleapis");
  const calendar  = google.calendar("v3");
  const authClient = await getAuthClient();
  const calendarId = "calendar-owner@gmail.com";

  const dateObj = appointment.startTime.toDate();
  const event = {
    summary: appointment.serviceName || "תור חדש",
    description: `לקוחה: ${appointment.clientName}\nטלפון: ${appointment.clientPhone}\nהערות: ${appointment.notes || "-"}`,
    start: {
      dateTime: dateObj.toISOString(),
      timeZone: "Asia/Jerusalem",
    },
    end: {
      dateTime: new Date(dateObj.getTime() + 30 * 60000).toISOString(),
      timeZone: "Asia/Jerusalem",
    },
  };

  await calendar.events.insert({
    auth: authClient,
    calendarId,
    requestBody: event,
  });
}

// ===== Callable function: שליחת SMS ללקוחה ולבעלת העסק + הוספה ל-Calendar =====
exports.sendSmsOnBooking = functions.https.onCall(async (data) => {
  const { phone, message, businessId, clientName, serviceName, startTime, notes } = data;
  const formattedClientPhone = phone.startsWith("+") ? phone : `+972${phone.replace(/^0/, "")}`;

  try {
    // 1. שליחת SMS ללקוחה
    await client.messages.create({ body: message, from: fromPhone, to: formattedClientPhone });

    // 2. מציאת בעלת העסק
    const ownerSnap = await admin.firestore()
      .collection("users")
      .where("businessId", "==", businessId)
      .where("role", "==", "admin")
      .limit(1)
      .get();

    if (!ownerSnap.empty) {
      const owner = ownerSnap.docs[0].data();
      const formattedOwnerPhone = owner.phone.startsWith("+")
        ? owner.phone
        : `+972${owner.phone.replace(/^0/, "")}`;

      // 3. הרכבת הודעה לבעלת העסק
      const rawDate = new Date(startTime);
      const day = rawDate.toLocaleDateString("he-IL", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Jerusalem' });
      const time = rawDate.toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });

      const ownerMessage = `📅 תור חדש נקבע:\n` +
        `לקוחה: ${clientName}\n` +
        `שירות: ${serviceName}\n` +
        `תאריך: ${day} בשעה ${time}`;

      await client.messages.create({ body: ownerMessage, from: fromPhone, to: formattedOwnerPhone });
    }

    // 4. הוספה ל-Google Calendar
    await addToGoogleCalendar({
      clientName,
      clientPhone: formattedClientPhone,
      serviceName,
      notes,
      startTime: admin.firestore.Timestamp.fromDate(new Date(startTime))
    });

    return { success: true };
  } catch (error) {
    console.error("שגיאה ב-sendSmsOnBooking:", error);
    throw new functions.https.HttpsError("internal", "שליחת SMS/Calendar נכשלה");
  }
});

// ===== HTTP endpoint פשוט לשליחת SMS =====
exports.sendSms = functions.https.onRequest(async (req, res) => {
  const { to, message } = req.body;
  const formattedPhone = to.startsWith("+") ? to : `+972${to.replace(/^0/, "")}`;

  try {
    await client.messages.create({ body: message, from: fromPhone, to: formattedPhone });
    res.status(200).send({ success: true });
  } catch (error) {
    console.error("שגיאה בשליחת SMS:", error.message);
    res.status(500).send({ success: false, error: error.message });
  }
});

// ===== טיפול בהודעות נכנסות מהלקוחות =====
const smsApp = express();
smsApp.use(bodyParser.urlencoded({ extended: false }));

smsApp.post("/", async (req, res) => {
  const incomingMsg = req.body.Body?.trim();
  const from = req.body.From;

  if (incomingMsg === "1") {
    const phone = from.startsWith("+972") ? "0" + from.slice(4) : from;
    const now = new Date();

    const snapshot = await admin.firestore()
      .collection("appointments")
      .where("clientPhone", "==", phone)
      .where("status", "==", "pending")
      .get();

    let cancelled = false;
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const startTime = data.startTime.toDate();

      if ((startTime - now) >= 24 * 60 * 60 * 1000) {
        await docSnap.ref.update({ status: "cancelled_by_client" });

        const ownerDoc = await admin.firestore()
          .collection("users")
          .where("businessId", "==", data.businessId)
          .where("role", "==", "admin")
          .limit(1)
          .get();

        if (!ownerDoc.empty) {
          const owner = ownerDoc.docs[0].data();
          const formattedOwner = owner.phone.startsWith("+")
            ? owner.phone
            : `+972${owner.phone.replace(/^0/, "")}`;

          const day = startTime.toLocaleDateString("he-IL", { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Asia/Jerusalem' });
          const time = startTime.toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });

          const ownerMessage = `שלום, הלקוחה ${data.clientName} ביטלה את התור שלה ליום ${day} בשעה ${time}.`;
          await client.messages.create({ body: ownerMessage, from: fromPhone, to: formattedOwner });
        }

        await client.messages.create({ body: "בחירתך התקבלה. התור בוטל בהצלחה.", from: fromPhone, to: from });
        cancelled = true;
        break;
      }
    }

    if (!cancelled) {
      await client.messages.create({ body: "לא ניתן לבטל תורים פחות מ-24 שעות מראש.", from: fromPhone, to: from });
    }
  }

  res.send("OK");
});
exports.onIncomingSMS = functions.https.onRequest(smsApp);

// ===== Firestore trigger: שליחת SMS עם פרטי התור לשני הצדדים =====
exports.sendAppointmentSmsOnCreate = functions.firestore
  .document('appointments/{apptId}')
  .onCreate(async (snap, ctx) => {
    const appt = snap.data();
    const { businessId, clientPhone, clientName, startTime } = appt;

    // שליפת בעלת העסק
    const ownerSnap = await admin.firestore()
      .collection("users")
      .where("businessId", "==", businessId)
      .where("role", "==", "admin")
      .limit(1)
      .get();

    const ownerPhoneRaw = ownerSnap.empty ? null : ownerSnap.docs[0].data().phone;
    const formattedOwnerPhone = ownerPhoneRaw
      ? ownerPhoneRaw.startsWith("+")
        ? ownerPhoneRaw
        : `+972${ownerPhoneRaw.replace(/^0/, "")}`
      : null;

    // עיצוב תאריך ושעה לפרטי התור עם timeZone
    const dateObj = startTime.toDate();
    const day = dateObj.toLocaleDateString("he-IL", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Jerusalem' });
    const time = dateObj.toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });

    // 1. SMS ללקוחה
    const clientMsg = `היי ${clientName}, התור שלך נקבע ליום ${day} בשעה ${time}.`;
    await client.messages.create({ body: clientMsg, from: fromPhone, to: clientPhone.startsWith("+") ? clientPhone : `+972${clientPhone.replace(/^0/, "")}` });

    // 2. SMS לבעלת העסק
    if (formattedOwnerPhone) {
      const ownerMsg = `📌 תור חדש: ${clientName} ליום ${day} בשעה ${time}.`;
      await client.messages.create({ body: ownerMsg, from: fromPhone, to: formattedOwnerPhone });
    }
  });

// ===== Firestore trigger: notification ללקוח על ביטול תור על ידי בעלת העסק =====
exports.notifyClientOnCancel = functions.firestore
  .document('appointments/{apptId}')
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after  = change.after.data();
    if (before.status !== 'cancelled_by_admin' && after.status === 'cancelled_by_admin') {
      const { clientName, clientPhone, startTime } = after;
      const dateObj = startTime.toDate ? startTime.toDate() : new Date(startTime);
      const day = dateObj.toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Asia/Jerusalem' });
      const time = dateObj.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });
      const formattedPhone = clientPhone.startsWith('+') ? clientPhone : `+972${clientPhone.replace(/^0/, '')}`;
      const body = `שלום ${clientName}, התור שלך ליום ${day} בשעה ${time} בוטל על-ידי בעלת העסק.`;
      await client.messages.create({ body, from: fromPhone, to: formattedPhone });
    }
  });

/**
 * פונקציית HTTP לקבלת טופס צור-קשר ושיחרור מייל אליך
 */
exports.sendContactForm = functions.https.onRequest(async (req, res) => {
  try {
    const { businessName, contactName, phone, email, selfRegister } = req.body;
    const text = `
שם העסק: ${businessName}
איש קשר: ${contactName}
טלפון: ${phone}
אימייל: ${email}
הרשמה עצמית: ${selfRegister ? 'כן' : 'לא'}
`;
    await transporter.sendMail({
      from: mailConfig.user,
      to: mailConfig.to,
      subject: 'פנייה חדשה מטופס צור קשר',
      text
    });
    res.status(200).send({ success: true });
  } catch (err) {
    console.error("sendContactForm error:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});
