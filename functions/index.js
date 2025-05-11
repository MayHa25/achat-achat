const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");
const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
const path = require("path");

admin.initializeApp();

const accountSid = functions.config().twilio.sid;
const authToken = functions.config().twilio.token;
const fromPhone = functions.config().twilio.phone;
const client = twilio(accountSid, authToken);

const calendar = google.calendar("v3");
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "calendar-service-account.json"),
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

async function addToGoogleCalendar(appointment) {
  const authClient = await auth.getClient();
  const calendarId = "calendar-owner@gmail.com"; // עדכני את כתובת היומן האמיתית

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

exports.notifyOwnerOnNewAppointment = functions.firestore
  .document("appointments/{appointmentId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();

    const businessDoc = await admin.firestore()
      .collection("users")
      .where("businessId", "==", data.businessId)
      .where("role", "==", "admin")
      .limit(1)
      .get();

    if (businessDoc.empty) return null;

    const owner = businessDoc.docs[0].data();
    const formattedOwner = owner.phone?.startsWith("+") ? owner.phone : `+972${owner.phone?.replace(/^0/, "")}`;
    const formattedClient = data.clientPhone?.startsWith("+") ? data.clientPhone : `+972${data.clientPhone?.replace(/^0/, "")}`;
    const time = data.startTime?.toDate?.().toLocaleString("he-IL") || "מועד לא ידוע";

    const ownerMsg = `נכנס תור חדש בתאריך ${time} מ-${data.clientName}`;
    const clientMsg = `התור שלך בנושא ${data.serviceName || 'שירות'} אצל ${owner.name || 'בעלת העסק'} נקבע ל-${time}. לביטול שלחי את הספרה 1 עד 24 שעות מראש.`;

    try {
      if (formattedOwner) {
        await client.messages.create({ body: ownerMsg, from: fromPhone, to: formattedOwner });
      }
      if (formattedClient) {
        await client.messages.create({ body: clientMsg, from: fromPhone, to: formattedClient });
      }

      await addToGoogleCalendar(data);

    } catch (error) {
      console.error("שגיאה בשליחת SMS או ביומן:", error.message || error);
    }

    return null;
  });

exports.notifyClientBySMS = functions.firestore
  .document("appointments/{appointmentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!before || !after || before.status === after.status) return null;

    const phone = after.clientPhone;
    if (!phone || typeof phone !== "string") return null;
    const formattedPhone = phone.startsWith("+") ? phone : `+972${phone.replace(/^0/, "")}`;

    let body;
    if (["confirmed", "approved"].includes(after.status)) {
      const time = after.startTime?.toDate?.().toLocaleString("he-IL") || "מועד לא ידוע";
      body = `התור שלך אושר למועד ${time}`;
    } else if (["cancelled", "rejected", "cancelled_by_owner"].includes(after.status)) {
      const time = after.startTime?.toDate?.().toLocaleString("he-IL") || "מועד לא ידוע";
      const reason = after.cancelReason ? ` סיבה: ${after.cancelReason}` : '';
      body = `לתשומת לבך: התור שלך בתאריך ${time} בוטל ע"י בעלת העסק.${reason}`;
    } else if (after.status === "cancelled_by_client") {
      body = "בחירתך התקבלה. התור בוטל בהצלחה.";
    } else return null;

    try {
      await client.messages.create({ body, from: fromPhone, to: formattedPhone });
    } catch (error) {
      console.error("שגיאה בשליחת SMS ללקוחה:", error.message || error);
    }

    return null;
  });

exports.sendAppointmentReminders = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const oneHourLater = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000));
    const oneDayLater = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

    const snapshot = await admin.firestore()
      .collection("appointments")
      .where("status", "in", ["confirmed", "approved"])
      .where("startTime", ">=", now)
      .get();

    for (const doc of snapshot.docs) {
      const appt = doc.data();

      if (Math.abs(appt.startTime.toDate() - oneDayLater.toDate()) < 60 * 60 * 1000) {
        const clientPhone = appt.clientPhone;
        const formattedClient = clientPhone?.startsWith("+") ? clientPhone : `+972${clientPhone?.replace(/^0/, "")}`;
        const msg = `תזכורת: התור שלך נקבע למחר בשעה ${appt.startTime.toDate().toLocaleTimeString("he-IL")}`;
        try {
          if (formattedClient) {
            await client.messages.create({ body: msg, from: fromPhone, to: formattedClient });
          }
        } catch (err) {
          console.error("שגיאה בשליחת תזכורת ללקוחה:", err);
        }
      }

      if (Math.abs(appt.startTime.toDate() - oneHourLater.toDate()) < 30 * 60 * 1000) {
        const ownerDoc = await admin.firestore()
          .collection("users")
          .where("businessId", "==", appt.businessId)
          .where("role", "==", "admin")
          .limit(1)
          .get();

        if (!ownerDoc.empty) {
          const owner = ownerDoc.docs[0].data();
          const formattedOwner = owner.phone?.startsWith("+") ? owner.phone : `+972${owner.phone?.replace(/^0/, "")}`;
          const msg = `תזכורת: בעוד שעה יש לך תור עם ${appt.clientName}`;
          try {
            if (formattedOwner) {
              await client.messages.create({ body: msg, from: fromPhone, to: formattedOwner });
            }
          } catch (err) {
            console.error("שגיאה בשליחת תזכורת לבעלת העסק:", err);
          }
        }
      }
    }

    return null;
  });

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
      if ((startTime.getTime() - now.getTime()) >= 24 * 60 * 60 * 1000) {
        await admin.firestore().collection("appointments").doc(doc.id).update({
          status: "cancelled_by_client"
        });

        const ownerDoc = await admin.firestore()
          .collection("users")
          .where("businessId", "==", data.businessId)
          .where("role", "==", "admin")
          .limit(1)
          .get();

        if (!ownerDoc.empty) {
          const owner = ownerDoc.docs[0].data();
          const formattedOwner = owner.phone?.startsWith("+") ? owner.phone : `+972${owner.phone?.replace(/^0/, "")}`;
          const message = `הלקוחה ${data.clientName} ביטלה את התור שנקבע ל-${startTime.toLocaleString("he-IL")}`;
          if (formattedOwner) {
            await client.messages.create({ body: message, from: fromPhone, to: formattedOwner });
          }
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
