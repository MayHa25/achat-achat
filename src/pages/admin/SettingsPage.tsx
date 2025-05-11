import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useStore from '../../store/useStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from 'firebase/auth';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, setUser } = useStore();

  const [businessName, setBusinessName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSaveBusinessName = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !user) return;

    try {
      await updateDoc(doc(db, 'users', uid), { name: businessName });

      // ✅ עדכון המשתמש ישירות (בלי פונקציה)
      setUser({
        ...user,
        name: businessName
      });

      setMessage('שם העסק עודכן בהצלחה.');
      setError(null);
    } catch (err) {
      setError('אירעה שגיאה בשמירת שם העסק.');
      setMessage(null);
    }
  };

  const handleChangePassword = async () => {
    setMessage(null);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות.');
      return;
    }

    if (!auth.currentUser?.email) {
      setError('אין משתמש מחובר.');
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      setMessage('הסיסמה עודכנה בהצלחה.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('שגיאה: בדקי שהסיסמה הנוכחית נכונה.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-semibold text-gray-900">
          {t('settings.title', 'הגדרות')}
        </h1>
      </div>

      {message && <p className="text-green-600 mb-4">{message}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* שינוי שם העסק */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">שם העסק</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="border px-4 py-2 rounded w-full sm:w-1/2"
          />
          <button
            onClick={handleSaveBusinessName}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            שמור
          </button>
        </div>
      </div>

      {/* שינוי סיסמה */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">שינוי סיסמה</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <input
            type="password"
            placeholder="סיסמה נוכחית"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="border px-4 py-2 rounded"
          />
          <input
            type="password"
            placeholder="סיסמה חדשה"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border px-4 py-2 rounded"
          />
          <input
            type="password"
            placeholder="אימות סיסמה חדשה"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border px-4 py-2 rounded"
          />
        </div>
        <button
          onClick={handleChangePassword}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          עדכן סיסמה
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
