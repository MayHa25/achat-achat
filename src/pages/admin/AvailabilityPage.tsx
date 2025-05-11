import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { X } from 'lucide-react'; // רק X בשימוש בפועל
import 'react-calendar/dist/Calendar.css';
import ReactCalendar from 'react-calendar';
import useStore from '../../store/useStore';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

const AvailabilityPage: React.FC = () => {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<'hours' | 'blocked'>('hours');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddingBlocked, setIsAddingBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.businessId) return;

    const fetchAvailability = async () => {
      try {
        const docRef = doc(db, 'availability', user.businessId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBusinessHours(docSnap.data().businessHours || []);
        } else {
          setBusinessHours([
            { dayOfWeek: 0, startTime: '09:00', endTime: '18:00', available: true },
            { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', available: true },
            { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', available: true },
            { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', available: true },
            { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', available: true },
            { dayOfWeek: 5, startTime: '09:00', endTime: '14:00', available: true },
            { dayOfWeek: 6, startTime: '', endTime: '', available: false },
          ]);
        }

        const blockedQuery = query(
          collection(db, 'blockedTimes'),
          where('businessId', '==', user.businessId)
        );
        const blockedSnap = await getDocs(blockedQuery);
        const blocked = blockedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBlockedTimes(blocked);
      } catch (error) {
        console.error('שגיאה בטעינת זמינות:', error);
      }
    };

    fetchAvailability();
  }, [user?.businessId]);

  const handleHoursChange = (dayIndex: number, field: 'startTime' | 'endTime' | 'available', value: string | boolean) => {
    const updated = businessHours.map((day) =>
      day.dayOfWeek === dayIndex ? { ...day, [field]: value } : day
    );
    setBusinessHours(updated);
  };

  const handleSaveHours = async () => {
    if (!user?.businessId) return;
    try {
      await setDoc(doc(db, 'availability', user.businessId), {
        businessId: user.businessId,
        businessHours
      });
      alert('שעות הפעילות נשמרו בהצלחה!');
    } catch (error) {
      console.error('שגיאה בשמירת שעות פעילות:', error);
    }
  };

  const handleAddBlockedTime = async () => {
    if (!user?.businessId || !selectedDate) return;
    try {
      const newBlockedTime = {
        businessId: user.businessId,
        startTime: selectedDate,
        endTime: new Date(selectedDate.getTime() + 60 * 60 * 1000),
        reason: blockReason || 'חסימה'
      };

      const docRef = await addDoc(collection(db, 'blockedTimes'), newBlockedTime);
      setBlockedTimes(prev => [...prev, { ...newBlockedTime, id: docRef.id }]);
      setIsAddingBlocked(false);
      setBlockReason('');
    } catch (error) {
      console.error('שגיאה בהוספה:', error);
    }
  };

  const handleDeleteBlockedTime = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blockedTimes', id));
      setBlockedTimes(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('שגיאה במחיקה:', error);
    }
  };

  const getDayName = (dayIndex: number) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[dayIndex];
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ניהול זמני פעילות</h1>

      <div className="flex mb-6 space-x-4">
        <button
          onClick={() => setActiveTab('hours')}
          className={`px-4 py-2 rounded ${activeTab === 'hours' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
        >
          שעות פעילות
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-4 py-2 rounded ${activeTab === 'blocked' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
        >
          זמנים חסומים
        </button>
      </div>

      {activeTab === 'hours' && (
        <div>
          {businessHours.map(day => (
            <div key={day.dayOfWeek} className="mb-4 flex items-center space-x-4">
              <div className="w-24 font-medium">{getDayName(day.dayOfWeek)}</div>
              <input type="checkbox" checked={day.available} onChange={e => handleHoursChange(day.dayOfWeek, 'available', e.target.checked)} />
              {day.available && (
                <>
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={e => handleHoursChange(day.dayOfWeek, 'startTime', e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={e => handleHoursChange(day.dayOfWeek, 'endTime', e.target.value)}
                    className="border px-2 py-1 rounded"
                  />
                </>
              )}
            </div>
          ))}
          <button onClick={handleSaveHours} className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            שמור שעות פעילות
          </button>
        </div>
      )}

      {activeTab === 'blocked' && (
        <div>
          <button
            onClick={() => setIsAddingBlocked(!isAddingBlocked)}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            {isAddingBlocked ? 'ביטול' : 'הוסף זמן חסום'}
          </button>

          {isAddingBlocked && (
            <div className="mb-6 border p-4 rounded bg-gray-50">
              <label className="block mb-2">בחר תאריך:</label>
              <ReactCalendar
                value={selectedDate}
                onChange={(value) => {
                  if (value instanceof Date) {
                    setSelectedDate(value);
                  }
                }}
                minDate={new Date()}
              />
              <input
                className="mt-2 w-full px-3 py-2 border rounded"
                type="text"
                placeholder="סיבה (אופציונלי)"
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
              />
              <button onClick={handleAddBlockedTime} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">
                שמור זמן חסום
              </button>
            </div>
          )}

          <h2 className="font-semibold mb-2">רשימת זמנים חסומים:</h2>
          {blockedTimes.length === 0 ? (
            <p className="text-gray-500">אין זמנים חסומים</p>
          ) : (
            <ul className="space-y-2">
              {blockedTimes.map(time => (
                <li key={time.id} className="border p-3 rounded flex justify-between items-center">
                  <div>
                    <p>{format(new Date(time.startTime), 'd בMMMM yyyy', { locale: he })}</p>
                    <p className="text-sm text-gray-500">{time.reason}</p>
                  </div>
                  <button onClick={() => handleDeleteBlockedTime(time.id)} className="text-red-600 hover:text-red-800">
                    <X className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailabilityPage;
