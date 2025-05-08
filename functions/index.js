const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

admin.initializeApp();

const accountSid = functions.config().twilio.sid;
const authToken = functions.config().twilio.token;
const fromPhone = functions.config().twilio.phone;
const client = twilio(accountSid, authToken);

// 1. SMS לבעלת העסק על תור חדש
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
    const formattedPhone = owner.phone.startsWith("+") ? owner.phone : `+972${owner.phone.replace(/^0/, "")}`;
    const time = data.startTime?.toDate?.().toLocaleString("he-IL") || "מועד לא ידוע";
    const body = `נכנס תור חדש בתאריך ${time} מ-${data.clientName}`;

    try {
      await client.messages.create({ body, from: fromPhone, to: formattedPhone });
    } catch (error) {
      console.error("שגיאה בשליחת SMS לבעלת העסק:", error.message || error);
    }

    return null;
  });

// 2. SMS ללקוחה לפי שינוי סטטוס
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
    } else if (["cancelled", "rejected"].includes(after.status)) {
      body = "לצערנו התור שלך לא אושר. לפרטים נוספים פני לבעלת העסק.";
    } else return null;

    try {
      await client.messages.create({ body, from: fromPhone, to: formattedPhone });
    } catch (error) {
      console.error("שגיאה בשליחת SMS ללקוחה:", error.message || error);
    }

    return null;
  });

// 3. תזכורות יומיות אוטומטיות
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

      // תזכורת ללקוחה - יום לפני
      if (Math.abs(appt.startTime.toDate() - oneDayLater.toDate()) < 60 * 60 * 1000) {
        const clientPhone = appt.clientPhone;
        const formattedClient = clientPhone.startsWith("+") ? clientPhone : `+972${clientPhone.replace(/^0/, "")}`;
        const msg = `תזכורת: התור שלך נקבע למחר בשעה ${appt.startTime.toDate().toLocaleTimeString("he-IL")}`;
        try {
          await client.messages.create({ body: msg, from: fromPhone, to: formattedClient });
        } catch (err) {
          console.error("שגיאה בשליחת תזכורת ללקוחה:", err);
        }
      }

      // תזכורת לבעלת העסק - שעה לפני
      if (Math.abs(appt.startTime.toDate() - oneHourLater.toDate()) < 30 * 60 * 1000) {
        const ownerDoc = await admin.firestore()
          .collection("users")
          .where("businessId", "==", appt.businessId)
          .where("role", "==", "admin")
          .limit(1)
          .get();

        if (!ownerDoc.empty) {
          const owner = ownerDoc.docs[0].data();
          const formattedOwner = owner.phone.startsWith("+") ? owner.phone : `+972${owner.phone.replace(/^0/, "")}`;
          const msg = `תזכורת: בעוד שעה יש לך תור עם ${appt.clientName}`;
          try {
            await client.messages.create({ body: msg, from: fromPhone, to: formattedOwner });
          } catch (err) {
            console.error("שגיאה בשליחת תזכורת לבעלת העסק:", err);
          }
        }
      }
    }

    return null;
  });
