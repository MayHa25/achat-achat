// src/pages/admin/AppointmentsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
} from 'date-fns';
import { he } from 'date-fns/locale';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import useStore from '../../store/useStore';

const WEEK_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 08:00–20:00

const AppointmentsPage: React.FC = () => {
  const { user } = useStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // טען תורים (pending בלבד) ושירותים
  useEffect(() => {
    if (!user?.businessId) return;
    (async () => {
      const [appsSnap, svcsSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, 'appointments'),
            where('businessId', '==', user.businessId)
          )
        ),
        getDocs(
          query(
            collection(db, 'services'),
            where('businessId', '==', user.businessId)
          )
        ),
      ]);

      // מיפוי שמות השירותים
      const map: Record<string, string> = {};
      svcsSnap.docs.forEach((d) => {
        map[d.id] = (d.data() as any).name;
      });
      setServicesMap(map);

      // רק תורים במצב pending
      const apps = appsSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((a: any) => a.status === 'pending');
      setAppointments(apps);
    })();
  }, [user?.businessId]);

  // ביטול תור (על־ידי בעלת העסק)
  const cancelAppointment = async (id: string) => {
    await updateDoc(doc(db, 'appointments', id), {
      status: 'cancelled_by_admin',
    });
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    setSelectedAppointment(null);
  };

  // חישוב ימי השבוע לפי התאריך הנוכחי
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const daysOfWeek = Array.from({ length: 7 }, (_, i) =>
    addDays(weekStart, i)
  );

  const handleNavigation = (dir: 'prev' | 'next') => {
    setCurrentDate((d) =>
      dir === 'next' ? addWeeks(d, 1) : subWeeks(d, 1)
    );
  };

  return (
    <div className="p-6 overflow-auto">
      {/* ניווט בין שבועות */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-3 py-1 bg-blue-100 rounded"
        >
          היום
        </button>
        <div className="space-x-2">
          <button
            onClick={() => handleNavigation('prev')}
            className="px-3 py-1"
          >
            ← שבוע קודם
          </button>
          <button
            onClick={() => handleNavigation('next')}
            className="px-3 py-1"
          >
            שבוע הבא →
          </button>
        </div>
      </div>

      {/* טבלת תצוגת שבועי */}
      <table className="min-w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1 bg-gray-50 text-center">🕒</th>
            {daysOfWeek.map((day, idx) => (
              <th
                key={idx}
                className="border px-2 py-1 bg-gray-50 text-center text-sm"
              >
                {format(day, 'd/M')}
                <br />
                <span className="text-xs">{WEEK_DAYS[day.getDay()]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour}>
              {/* עמודת שעות */}
              <td className="border px-2 py-1 bg-gray-50 text-center text-sm">
                {hour.toString().padStart(2, '0')}:00
              </td>
              {/* תאים לפי יום */}
              {daysOfWeek.map((day, di) => {
                const appt = appointments.find(
                  (a) =>
                    isSameDay(
                      (a.startTime as Timestamp).toDate(),
                      day
                    ) &&
                    (a.startTime as Timestamp)
                      .toDate()
                      .getHours() === hour
                );
                return (
                  <td key={di} className="border px-2 py-1 h-12">
                    {appt ? (
                      <button
                        onClick={() => setSelectedAppointment(appt)}
                        className="w-full h-full bg-primary-100 hover:bg-primary-200 text-sm text-primary-700 rounded"
                      >
                        {appt.clientName}
                      </button>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* מודאל פרטי התור */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">פרטי תור</h2>
            <p>
              <strong>לקוחה:</strong> {selectedAppointment.clientName}
            </p>
            <p>
              <strong>נושא:</strong>{' '}
              {servicesMap[selectedAppointment.serviceId]}
            </p>
            <p>
              <strong>מחיר:</strong> ₪{selectedAppointment.price}
            </p>
            <p>
              <strong>תאריך:</strong>{' '}
              {format(
                (selectedAppointment.startTime as Timestamp).toDate(),
                'eeee, d בMMMM yyyy',
                { locale: he }
              )}
            </p>
            <p>
              <strong>שעה:</strong>{' '}
              {format(
                (selectedAppointment.startTime as Timestamp).toDate(),
                'HH:mm'
              )}
            </p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => cancelAppointment(selectedAppointment.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                בטל תור
              </button>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
