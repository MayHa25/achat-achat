const functions = require("firebase-functions");

// פונקציית תשלום מדומה – עד שיתקבלו פרטי Cardcom האמיתיים
exports.createCardcomPayment = functions.https.onRequest((req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { businessName, selectedPlan } = req.body || {};

  // החזרה של תגובה דמה עם JSON תקין
  return res.status(200).json({
    success: true,
    message: "תשלום מדומה בוצע בהצלחה",
    plan: selectedPlan || "לא נבחר מסלול",
    business: businessName || "ללא שם עסק",
    mock: true,
  });
});
