// ✅ Firebase Cloud Functions v1 - כולל Twilio, Google Calendar ותמיכה מלאה ב-SMS
require("dotenv").config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");
const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const path = require("path");

admin.initializeApp();

const accountSid = functions.config()?.twilio?.sid || process.env.TWILIO_SID;
const authToken = functions.config()?.twilio?.token || process.env.TWILIO_AUTH_TOKEN;
const fromPhone = functions.config()?.twilio?.phone || process.env.TWILIO_PHONE;
const client = twilio(accountSid, authToken);

const calendar = google.calendar("v3");

// ✅ נטען את ההרשאות רק בזמן הריצה
const getAuthClient = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "calendar-service-account.json"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return await auth.getClient();
};

// ✅ הוספת תור ל-Google Calendar
async function addToGoogleCalendar(appointment) {
  const authClient = await getAuthClient();
  const calendarId = "calendar-owner@gmail.com";

  const event = {
    summary: appointment.serviceName || "תור חדש",
    description: `לקוחה: ${appointment.clientName}\nטלפון: ${appointment.clientPhone}\nהערות: ${appointment.notes || "-"}`,
    start: {
      dateTime: appointment.startTime.toDate().toISOString(),
      timeZone: "Asia/Jerusalem",
    },
    end: {
      dateTime: new Date(appointment.startTime.toDate().getTime() + 30 * 60000).toISOString(),
      timeZone: "Asia/Jerusalem",
    },
  };

  await calendar.events.insert({
    auth: authClient,
    calendarId,
    requestBody: event,
  });
}

// ✅ שליחת SMS על הזמנה (ללקוחה ולבעלת העסק)
exports.sendSmsOnBooking = functions.https.onCall(async (data) => {
  const { phone, message, businessId, clientName, serviceName, startTime } = data;
  const formattedPhone = phone.startsWith("+") ? phone : `+972${phone.replace(/^0/, "")}`;

  try {
    // שליחת SMS ללקוחה
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: formattedPhone,
    });

    // שליפת בעלת העסק לפי businessId
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

      const appointmentDate = new Date(startTime.seconds * 1000);
      const day = appointmentDate.toLocaleDateString("he-IL", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const time = appointmentDate.toLocaleTimeString("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const ownerMessage = `📅 תור חדש נקבע:
לקוחה: ${clientName}
שירות: ${serviceName}
תאריך: ${day} בשעה ${time}`;

      await client.messages.create({
        body: ownerMessage,
        from: fromPhone,
        to: formattedOwnerPhone,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("שגיאה בשליחת SMS:", error);
    throw new functions.https.HttpsError("internal", "שליחת SMS נכשלה");
  }
});

// ✅ תמיכה בביטול תור עם SMS נכנס
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
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const startTime = data.startTime.toDate();

      if ((startTime - now) >= 24 * 60 * 60 * 1000) {
        await doc.ref.update({ status: "cancelled_by_client" });

        const ownerDoc = await admin.firestore()
          .collection("users")
          .where("businessId", "==", data.businessId)
          .where("role", "==", "admin")
          .limit(1).get();

        if (!ownerDoc.empty) {
          const owner = ownerDoc.docs[0].data();
          const formattedOwner = owner.phone?.startsWith("+")
            ? owner.phone
            : `+972${owner.phone?.replace(/^0/, "")}`;

          const day = startTime.toLocaleDateString("he-IL", { weekday: 'long', day: '2-digit', month: '2-digit' });
          const time = startTime.toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit' });

          const ownerMessage = `שלום, הלקוחה ${data.clientName} ביטלה את התור שלה ליום ${day} בשעה ${time}.
אין צורך באישור נוסף – התור הוסר מהמערכת.`;

          await client.messages.create({
            body: ownerMessage,
            from: fromPhone,
            to: formattedOwner
          });
        }

        await client.messages.create({
          body: "בחירתך התקבלה. התור בוטל בהצלחה.",
          from: fromPhone,
          to: from
        });

        cancelled = true;
        break;
      }
    }

    if (!cancelled) {
      await client.messages.create({
        body: "לא ניתן לבטל תורים פחות מ-24 שעות מראש.",
        from: fromPhone,
        to: from
      });
    }
  }

  res.send("OK");
});

exports.onIncomingSMS = functions.https.onRequest(smsApp);
