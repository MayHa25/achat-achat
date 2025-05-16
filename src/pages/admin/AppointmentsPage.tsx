import React, { useEffect, useState } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  subDays,
  addMonths,
  subMonths,
  isSameDay,
  isBefore,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
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

const isPast = (date: Date) => {
  const now = new Date();
  return isBefore(date, now);
};

const AppointmentsPage: React.FC = () => {
  const { user } = useStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [view, setView] = useState<'weekly' | 'daily' | 'monthly'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!user?.businessId) return;

    const fetchAppointmentsAndServices = async () => {
      try {
        const [appointmentsSnap, servicesSnap] = await Promise.all([
          getDocs(query(collection(db, 'appointments'), where('businessId', '==', user.businessId))),
          getDocs(query(collection(db, 'services'), where('businessId', '==', user.businessId))),
        ]);

        const services: Record<string, string> = {};
        servicesSnap.docs.forEach(doc => {
          services[doc.id] = (doc.data() as any).name;
        });
        setServicesMap(services);

        const appointmentsData = appointmentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('שגיאה בטעינת תורים:', error);
      }
    };

    fetchAppointmentsAndServices();
  }, [user?.businessId]);

  const cancelAppointment = async (appointmentId: string) => {
    try {
      // עדכון סטטוס התור ל"cancelled_by_admin" במקום מחיקה
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'cancelled_by_admin',
      });

      // הסרת התור מ-state כדי לעדכן את הממשק
      setAppointments(prev => prev.filter(app => app.id !== appointmentId));
      setSelectedAppointment(null);
    } catch (error) {
      console.error('שגיאה בביטול תור:', error);
    }
  };

  const today = new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (view === 'daily') {
      setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : subDays(prev, 1));
    } else if (view === 'weekly') {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    }
  };

  return (
    <div className="p-6 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <button
            onClick={() => setView('daily')}
            className={`px-3 py-1 rounded ${view === 'daily' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >יומי</button>
          <button
            onClick={() => setView('weekly')}
            className={`px-3 py-1 rounded ${view === 'weekly' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >שבועי</button>
          <button
            onClick={() => setView('monthly')}
            className={`px-3 py-1 rounded ${view === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >חודשי</button>
        </div>
        <div className="space-x-2">
          <button onClick={() => setCurrentDate(today)} className="px-3 py-1 bg-blue-100 rounded">היום</button>
          <button onClick={() => handleNavigation('prev')} className="px-3 py-1">←</button>
          <button onClick={() => handleNavigation('next')} className="px-3 py-1">→</button>
        </div>
      </div>

      {view === 'weekly' ? (
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((day, i) => {
            const dayAppointments = appointments.filter(app =>
              isSameDay((app.startTime as Timestamp).toDate(), day)
            );
            return (
              <div key={i} className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="font-bold mb-1 text-sm">
                  {format(day, 'd/M (EEEE)', { locale: he })}
                </div>
                {dayAppointments.length === 0 ? (
                  <p className="text-gray-400 text-xs">אין תורים</p>
                ) : (
                  <ul className="text-xs space-y-1">
                    {dayAppointments.map(app => (
                      <li
                        key={app.id}
                        className="cursor-pointer hover:underline"
                        onClick={() => setSelectedAppointment(app)}
                      >
                        {format((app.startTime as Timestamp).toDate(), 'HH:mm')} - {app.clientName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : view === 'monthly' ? (
        <table className="min-w-full border">
          <thead>
            <tr>
              {WEEK_DAYS.map((day, i) => (
                <th key={i} className="border px-4 py-2 text-center text-sm font-medium">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const days = eachDayOfInterval({
                start: startOfMonth(currentDate),
                end: endOfMonth(currentDate)
              });
              const rows: Date[][] = [];
              for (let i = 0; i < days.length; i += 7) {
                rows.push(days.slice(i, i + 7));
              }
              return rows.map((week, rowIdx) => (
                <tr key={rowIdx}>
                  {week.map((day, colIdx) => {
                    const hasAppointments = appointments.some(app =>
                      isSameDay((app.startTime as Timestamp).toDate(), day)
                    );
                    return (
                      <td key={colIdx} className="border px-4 py-3 text-center">
                        <div className="text-sm font-semibold mb-1">{format(day, 'd/M')}</div>
                        {hasAppointments ? (
                          <button
                            className="text-xs bg-primary-600 text-white rounded px-2 py-1"
                            onClick={() => {
                              setCurrentDate(day);
                              setView('daily');
                            }}
                          >
                            צפייה
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      ) : (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-4">
            {format(currentDate, 'EEEE, d בMMMM yyyy', { locale: he })}
          </h2>
          {appointments.filter(app =>
            isSameDay((app.startTime as Timestamp).toDate(), currentDate)
          ).length === 0 ? (
            <p className="text-gray-500">אין תורים ביום זה.</p>
          ) : (
            <ul className="space-y-3">
              {appointments
                .filter(app => isSameDay((app.startTime as Timestamp).toDate(), currentDate))
                .sort((a, b) =>
                  (a.startTime as Timestamp).toDate().getTime() -
                  (b.startTime as Timestamp).toDate().getTime()
                )
                .map(app => {
                  const appDate = (app.startTime as Timestamp).toDate();
                  return (
                    <li key={app.id} className="border p-3 rounded flex justify-between items-center">
                      <div>
                        <p><strong>{format(appDate, 'HH:mm')}</strong> - {app.clientName}</p>
                        <p className="text-sm text-gray-500">{servicesMap[app.serviceId]}</p>
                      </div>
                      <button
                        disabled={isPast(appDate)}
                        onClick={() => cancelAppointment(app.id)}
                        className={`px-3 py-1 rounded ${
                          isPast(appDate)
                            ? 'bg-gray-300 text-gray-600 cursor-default'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {isPast(appDate) ? 'בוצע' : 'בטל'}
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      )}

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">פרטי תור</h2>
            <p><strong>לקוחה:</strong> {selectedAppointment.clientName}</p>
            <p><strong>טלפון:</strong> {selectedAppointment.clientPhone}</p>
            <p><strong>טיפול:</strong> {servicesMap[selectedAppointment.serviceId] || '—'}</p>
            <p><strong>תאריך:</strong> {format((selectedAppointment.startTime as Timestamp).toDate(), 'd בMMMM yyyy', { locale: he })}</p>
            <p><strong>שעה:</strong> {format((selectedAppointment.startTime as Timestamp).toDate(), 'HH:mm')}</p>

            <div className="mt-4 flex justify-between">
              <button
                onClick={() => cancelAppointment(selectedAppointment.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                בטל תור
              </button>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 ml-2"
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
