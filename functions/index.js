const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

admin.initializeApp();

const accountSid = functions.config().twilio.sid;
const authToken = functions.config().twilio.token;
const fromPhone = functions.config().twilio.phone;

const client = twilio(accountSid, authToken);

exports.notifyClientBySMS = functions.firestore
  .document("appointments/{appointmentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // אם אין שינוי בסטטוס – לא לשלוח כלום
    if (!before || !after || before.status === after.status) return null;

    const phone = after.clientPhone;
    if (!phone || typeof phone !== "string") {
      console.warn("לא נמצא מספר טלפון תקני לשליחה");
      return null;
    }

    // לוודא פורמט מספר עם קידומת בינלאומית
    const formattedPhone = phone.startsWith("+") ? phone : `+972${phone.replace(/^0/, "")}`;

    let body;
    if (after.status === "confirmed") {
      const time = after.startTime?.toDate?.().toLocaleString("he-IL") || "מועד לא ידוע";
      body = `התור שלך אושר למועד ${time}`;
    } else if (after.status === "cancelled") {
      body = "לצערנו התור שלך בוטל. לפרטים נוספים פני לבעלת העסק.";
    } else {
      return null;
    }

    try {
      const message = await client.messages.create({
        body,
        from: fromPhone,
        to: formattedPhone,
      });
      console.log("נשלח SMS ל:", formattedPhone, "| SID:", message.sid);
    } catch (error) {
      console.error("שגיאה בשליחת SMS:", error.message || error);
    }

    return null;
  });
