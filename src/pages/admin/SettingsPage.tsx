"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../../lib/firebase";

const SettingsPage = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      setMessage({ type: "error", text: "המשתמש אינו מחובר או אין אימייל זמין." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setMessage({ type: "success", text: "הסיסמה עודכנה בהצלחה." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      let errorText = "שגיאה כללית בשינוי סיסמה.";
      if (error.code === "auth/wrong-password") {
        errorText = "הסיסמה הנוכחית שגויה.";
      } else if (error.code === "auth/weak-password") {
        errorText = "הסיסמה החדשה חלשה מדי (מינימום 6 תווים).";
      } else if (error.code === "auth/too-many-requests") {
        errorText = "נחסמת זמנית עקב ניסיונות מרובים. נסה שוב מאוחר יותר.";
      }

      setMessage({ type: "error", text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("settings.title", "הגדרות")}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-xl">
        <h2 className="text-lg font-medium text-gray-900 mb-4">שינוי סיסמה</h2>

        {message && (
          <div
            className={`mb-4 px-4 py-2 rounded ${
              message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            סיסמה נוכחית
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
            placeholder="********"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            סיסמה חדשה
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-4 py-2"
            placeholder="********"
          />
        </div>

        <button
          onClick={handlePasswordChange}
          disabled={loading}
          className={`bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition ${
            loading ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "מעבד..." : "שנה סיסמה"}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
