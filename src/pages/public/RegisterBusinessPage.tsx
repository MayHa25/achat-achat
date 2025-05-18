// src/pages/public/RegisterBusinessPage.tsx

import React, { useState } from "react";
import { db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const RegisterBusinessPage: React.FC = () => {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    businessName: "",
    calendarId: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // שלב 1 – יצירת משתמש במערכת (Authentication)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const uid = userCredential.user.uid;
      const businessId = uuidv4();

      // שלב 2 – שמירה במסד הנתונים
      await setDoc(doc(db, "users", uid), {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        businessName: form.businessName,
        role: "admin",
        businessId,
        createdAt: new Date(),
      });

      await setDoc(doc(db, "businesses", businessId), {
        calendarId: form.calendarId,
        businessName: form.businessName,
        createdAt: new Date(),
      });

      alert("נרשמת בהצלחה! אפשר להתחיל לעבוד 🎉");
      navigate("/login");
    } catch (error: any) {
      console.error("שגיאה בהרשמה:", error);
      alert(error.message || "אירעה שגיאה, נסי שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold mb-4 text-center">הרשמה לבעלות עסקים</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="fullName"
          placeholder="שם מלא"
          value={form.fullName}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="phone"
          placeholder="טלפון"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="email"
          placeholder="אימייל"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="password"
          placeholder="סיסמה"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="businessName"
          placeholder="שם העסק"
          value={form.businessName}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          name="calendarId"
          placeholder="כתובת היומן בגוגל (calendarId)"
          value={form.calendarId}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "שולחת..." : "הירשמי עכשיו"}
        </button>
      </form>
    </div>
  );
};

export default RegisterBusinessPage;
