// src/pages/public/RegisterBusinessPage.tsx

import React, { useState } from "react";

const RegisterBusinessPage: React.FC = () => {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    businessName: "",
    calendarId: "",
    plan: "basic", // ברירת מחדל
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/createCardcomPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          plan: form.plan,
        }),
      });

      const data = await response.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      } else {
        throw new Error("החיוב נכשל. נסי שוב.");
      }
    } catch (error: any) {
      console.error("שגיאה בתשלום:", error);
      alert(error.message || "אירעה שגיאה בתשלום");
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
        <select
          name="plan"
          value={form.plan}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">בחרי מסלול</option>
          <option value="basic">בסיסי – ₪80 לחודש</option>
          <option value="advanced">מתקדם – ₪120 לחודש</option>
          <option value="premium">פרימיום – ₪180 לחודש</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "מעבירה לתשלום..." : "המשיכי לתשלום"}
        </button>
      </form>
    </div>
  );
};

export default RegisterBusinessPage;
