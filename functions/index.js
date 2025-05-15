require("dotenv").config();

const functions = require("firebase-functions");
const admin     = require("firebase-admin");
const twilio    = require("twilio");
const express   = require("express");
const bodyParser= require("body-parser");
const { google }= require("googleapis");
const path      = require("path");

admin.initializeApp();

const accountSid = functions.config()?.twilio?.sid || process.env.TWILIO_SID;
const authToken  = functions.config()?.twilio?.token || process.env.TWILIO_AUTH_TOKEN;
const fromPhone  = functions.config()?.twilio?.phone || process.env.TWILIO_PHONE;
const client     = twilio(accountSid, authToken);

const calendar = google.calendar("v3");

const getAuthClient = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "calendar-service-account.json"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return await auth.getClient();
};

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

// === ה־https Callable הקיים ===
exports.sendSmsOnBooking = functions.https.onCall(async (data) => {
  const { phone, message, businessId, clientName, serviceName } = data;
  const formattedPhone = phone.startsWith("+") ? phone : `+972${phone.replace(/^0/, "")}`;

  try {
    // שליחת SMS ללקוחה
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: formattedPhone,
    });

    // שליפת בעלת העסק
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

      // שליפת התור האחרון של הלקוחה
      const appointmentsSnap = await admin.firestore()
        .collection("appointments")
        .where("clientPhone", "==", phone)
        .where("businessId", "==", businessId)
        .orderBy("created", "desc")
        .limit(1)
        .get();

      if (!appointmentsSnap.empty) {
        const appointment = appointmentsSnap.docs[0].data();
        const rawDate = appointment.startTime.toDate();
        const day = rawDate.toLocaleDateString("he-IL", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const time = rawDate.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const ownerMessage = `📅 תור חדש נקבע:\n` +
          `לקוחה: ${clientName}\n` +
          `שירות: ${serviceName}\n` +
          `תאריך: ${day} בשעה ${time}`;

        await client.messages.create({
          body: ownerMessage,
          from: fromPhone,
          to: formattedOwnerPhone,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("שגיאה בשליחת SMS:", error);
    throw new functions.https.HttpsError("internal", "שליחת SMS נכשלה");
  }
});

// === ה־https endpoint הקיים ===
exports.sendSms = functions.https.onRequest(async (req, res) => {
  const { to, message } = req.body;
  const formattedPhone = to.startsWith("+") ? to : `+972${to.replace(/^0/, "")}`;

  try {
    const result = await client.messages.create({
      body: message,
      from: fromPhone,
      to: formattedPhone,
    });
    res.status(200).send({ success: true });
  } catch (error) {
    console.error("❌ שגיאה בשליחת SMS:", error.message);
    res.status(500).send({ success: false, error: error.message });
  }
});

// === טיפול בהודעות נכנסות ===
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
          .limit(1).get();

        if (!ownerDoc.empty) {
          const owner = ownerDoc.docs[0].data();
          const formattedOwner = owner.phone.startsWith("+")
            ? owner.phone
            : `+972${owner.phone.replace(/^0/, "")}`;

          const day = startTime.toLocaleDateString("he-IL", { weekday: 'long', day: '2-digit', month: '2-digit' });
          const time = startTime.toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit' });

          const ownerMessage = `שלום, הלקוחה ${data.clientName} ביטלה את התור שלה ליום ${day} בשעה ${time}.`;
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

// === הפונקציה החדשה: Firestore trigger על יצירת תור ===
exports.sendAppointmentSmsOnCreate = functions.firestore
  .document('appointments/{apptId}')
  .onCreate(async (snap, ctx) => {
    const appt = snap.data();
    const { businessId, clientPhone, clientName, startTime } = appt;

    // חיפוש בעלת העסק
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

    // עיצוב תאריך ושעה
    const dateObj = startTime.toDate();
    const day  = dateObj.toLocaleDateString("he-IL", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = dateObj.toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit' });

    // הודעה ללקוחה
    const clientMsg = `היי ${clientName}, התור שלך נקבע ליום ${day} בשעה ${time}.`;
    await client.messages.create({
      body: clientMsg,
      from: fromPhone,
      to: clientPhone.startsWith("+") ? clientPhone : `+972${clientPhone.replace(/^0/, "")}`
    });

    // הודעה לבעלת העסק
    if (formattedOwnerPhone) {
      const ownerMsg = `📌 תור חדש: ${clientName} ליום ${day} בשעה ${time}.`;
      await client.messages.create({
        body: ownerMsg,
        from: fromPhone,
        to: formattedOwnerPhone
      });
    }
  });
