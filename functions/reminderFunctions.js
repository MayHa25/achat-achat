const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

const db = admin.firestore();
const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const fromPhone = process.env.TWILIO_PHONE;

// פונקציות עזר
function normalizePhone(phone) {
  return phone.startsWith("+972") ? phone : `+972${phone.replace(/^0/, "")}`;
}

function formatHour(date) {
  return date.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isCancelled(appt) {
  return (
    appt.status === "cancelled_by_admin" ||
    appt.status === "cancelled_by_client"
  );
}

// מניעת שליחה כפולה
async function sendSmsOnce(to, body, uniqueKey) {
  const docRef = db.collection("sentMessages").doc(uniqueKey);
  const doc = await docRef.get();
  if (doc.exists) return;

  await client.messages.create({ to, from: fromPhone, body });
  await docRef.set({ sentAt: admin.firestore.FieldValue.serverTimestamp() });
}

// תזכורת יום לפני
const sendReminders1DayBefore = functions.pubsub
  .schedule("every day 08:00")
  .timeZone("Asia/Jerusalem")
  .onRun(async () => {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + 1);

    const start = new Date(targetDate.setHours(0, 0, 0, 0));
    const end = new Date(targetDate.setHours(23, 59, 59, 999));

    const snapshot = await db
      .collection("appointments")
      .where("startTime", ">=", admin.firestore.Timestamp.fromDate(start))
      .where("startTime", "<=", admin.firestore.Timestamp.fromDate(end))
      .get();

    for (const doc of snapshot.docs) {
      const appt = doc.data();
      if (isCancelled(appt)) continue;

      const phone = normalizePhone(appt.clientPhone);
      const timeStr = formatHour(appt.startTime.toDate());
      const service = appt.serviceName || "";

      const message = `📅 תזכורת: יש לך תור מחר ל-${service} בשעה ${timeStr}.`;

      await sendSmsOnce(phone, message, `reminder-1d-${doc.id}`);
    }
  });

// תזכורת שעה לפני
const sendReminders1HourBefore = functions.pubsub
  .schedule("every 15 minutes")
  .timeZone("Asia/Jerusalem")
  .onRun(async () => {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start);
    end.setMinutes(59, 59, 999);

    const snapshot = await db
      .collection("appointments")
      .where("startTime", ">=", admin.firestore.Timestamp.fromDate(start))
      .where("startTime", "<=", admin.firestore.Timestamp.fromDate(end))
      .get();

    for (const doc of snapshot.docs) {
      const appt = doc.data();
      if (isCancelled(appt)) continue;

      const phone = normalizePhone(appt.clientPhone);
      const timeStr = formatHour(appt.startTime.toDate());
      const service = appt.serviceName || "";

      const message = `⏰ תזכורת: יש לך תור ל-${service} בעוד שעה, בשעה ${timeStr}.`;

      await sendSmsOnce(phone, message, `reminder-1h-${doc.id}`);
    }
  });

// סיכום יומי לבעלת העסק
const sendSummaryToOwner = functions.pubsub
  .schedule("every day 20:00")
  .timeZone("Asia/Jerusalem")
  .onRun(async () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const start = new Date(tomorrow.setHours(0, 0, 0, 0));
    const end = new Date(tomorrow.setHours(23, 59, 59, 999));

    const snapshot = await db
      .collection("appointments")
      .where("startTime", ">=", admin.firestore.Timestamp.fromDate(start))
      .where("startTime", "<=", admin.firestore.Timestamp.fromDate(end))
      .get();

    const appointmentsByBusiness = {};

    for (const doc of snapshot.docs) {
      const appt = doc.data();
      if (isCancelled(appt)) continue;

      if (!appointmentsByBusiness[appt.businessId]) {
        appointmentsByBusiness[appt.businessId] = [];
      }
      appointmentsByBusiness[appt.businessId].push(appt);
    }

    for (const businessId in appointmentsByBusiness) {
      const appts = appointmentsByBusiness[businessId];

      const ownerSnap = await db
        .collection("users")
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
        const clientName = appt.clientName || "לא ידוע";
        const service = appt.serviceName || "";
        message += `• ${time} - ${clientName} (${service})\n`;
      }

      await sendSmsOnce(
        formattedPhone,
        message,
        `summary-${businessId}-${start.toDateString()}`
      );
    }
  });

// ייצוא לפונקציות הראשיות
module.exports = {
  sendReminders1DayBefore,
  sendReminders1HourBefore,
  sendSummaryToOwner,
};
