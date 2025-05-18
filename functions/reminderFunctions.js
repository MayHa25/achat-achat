const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

const db = admin.firestore();
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const fromPhone = process.env.TWILIO_PHONE;

// שליחת תזכורת יום לפני התור – כל יום בשעה 8:00 בבוקר
exports.sendReminders1DayBefore = functions.pubsub
  .schedule("every day 08:00")
  .timeZone("Asia/Jerusalem")
  .onRun(async () => {
    const now = new Date();
    const target = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const snapshot = await db.collection("appointments")
      .where("startTime", ">=", admin.firestore.Timestamp.fromDate(startOfHour(target)))
      .where("startTime", "<", admin.firestore.Timestamp.fromDate(endOfHour(target)))
      .get();

    for (const doc of snapshot.docs) {
      const appt = doc.data();
      if (appt.status !== 'cancelled_by_admin' && appt.status !== 'cancelled_by_client') {
        const phone = normalizePhone(appt.clientPhone);
        const timeStr = formatHour(appt.startTime.toDate());
        const message = `📅 תזכורת: יש לך תור מחר ל-${appt.serviceName} בשעה ${timeStr}.`;

        await client.messages.create({
          body: message,
          from: fromPhone,
          to: phone,
        });
      }
    }
  });

// שליחת תזכורת שעה לפני התור – כל 30 דקות
exports.sendReminders1HourBefore = functions.pubsub
  .schedule("every 30 minutes")
  .timeZone("Asia/Jerusalem")
  .onRun(async () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const snapshot = await db.collection("appointments")
      .where("startTime", ">=", admin.firestore.Timestamp.fromDate(startOfHour(oneHourLater)))
      .where("startTime", "<", admin.firestore.Timestamp.fromDate(endOfHour(oneHourLater)))
      .get();

    for (const doc of snapshot.docs) {
      const appt = doc.data();
      if (appt.status !== 'cancelled_by_admin' && appt.status !== 'cancelled_by_client') {
        const phone = normalizePhone(appt.clientPhone);
        const timeStr = formatHour(appt.startTime.toDate());
        const message = `⏰ תזכורת: יש לך תור ל-${appt.serviceName} בעוד שעה, בשעה ${timeStr}.`;

        await client.messages.create({
          body: message,
          from: fromPhone,
          to: phone,
        });
      }
    }
  });

// סיכום יומי לבעל העסק – כל ערב ב-20:00
exports.sendSummaryToOwner = functions.pubsub
  .schedule("every day 20:00")
  .timeZone("Asia/Jerusalem")
  .onRun(async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const start = new Date(tomorrow.setHours(0, 0, 0, 0));
    const end   = new Date(tomorrow.setHours(23, 59, 59, 999));

    const snapshot = await db.collection("appointments")
      .where("startTime", ">=", admin.firestore.Timestamp.fromDate(start))
      .where("startTime", "<=", admin.firestore.Timestamp.fromDate(end))
      .get();

    const appointmentsByBusiness = {};

    for (const doc of snapshot.docs) {
      const appt = doc.data();
      if (appt.status === 'cancelled_by_admin' || appt.status === 'cancelled_by_client') continue;

      if (!appointmentsByBusiness[appt.businessId]) {
        appointmentsByBusiness[appt.businessId] = [];
      }
      appointmentsByBusiness[appt.businessId].push(appt);
    }

    for (const businessId in appointmentsByBusiness) {
      const appts = appointmentsByBusiness[businessId];

      const ownerSnap = await db.collection("users")
        .where("businessId", "==", businessId)
        .where("role", "==", "admin")
        .limit(1)
        .get();

      if (ownerSnap.empty) continue;

      const owner = ownerSnap.docs[0].data();
      const formattedPhone = normalizePhone(owner.phone);

      let message = `📋 סיכום תורים למחר:\n`;
      for (const appt of appts) {
        const time = formatHour(appt.startTime.toDate());
        message += `• ${time} - ${appt.clientName} (${appt.serviceName})\n`;
      }

      await client.messages.create({
        body: message,
        from: fromPhone,
        to: formattedPhone,
      });
    }
  });

// פונקציות עזר
function normalizePhone(phone) {
  return phone.startsWith("+972") ? phone : `+972${phone.replace(/^0/, "")}`;
}

function startOfHour(date) {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

function endOfHour(date) {
  const d = new Date(date);
  d.setMinutes(59, 59, 999);
  return d;
}

function formatHour(date) {
  return date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}
