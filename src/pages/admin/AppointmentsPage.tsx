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
  return isBefore(date, new Date());
};

const AppointmentsPage: React.FC = () => {
  const { user } = useStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [view, setView] = useState<'weekly' | 'daily' | 'monthly'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());

  // שליפה ראשונית של תורים ושירותים
  useEffect(() => {
    if (!user?.businessId) return;
    const fetchData = async () => {
      const [appsSnap, servicesSnap] = await Promise.all([
        getDocs(query(collection(db, 'appointments'), where('businessId', '==', user.businessId))),
        getDocs(query(collection(db, 'services'), where('businessId', '==', user.businessId))),
      ]);
      const svcMap: Record<string, string> = {};
      servicesSnap.docs.forEach(d => {
        const data = d.data() as any;
        svcMap[d.id] = data.name;
      });
      setServicesMap(svcMap);

      const pendingApps = appsSnap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .filter(a => a.status === 'pending');
      setAppointments(pendingApps);
    };
    fetchData().catch(console.error);
  }, [user?.businessId]);

  const cancelAppointment = async (id: string) => {
    await updateDoc(doc(db, 'appointments', id), { status: 'cancelled_by_admin' });
    setAppointments(prev => prev.filter(a => a.id !== id));
    setSelectedAppointment(null);
  };

  const today = new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  const navigate = (dir: 'prev' | 'next') => {
    if (view === 'daily') setCurrentDate(d => dir === 'next' ? addDays(d, 1) : subDays(d, 1));
    else if (view === 'weekly') setCurrentDate(d => dir === 'next' ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => dir === 'next' ? addMonths(d, 1) : subMonths(d, 1));
  };

  return (
    <div className="p-6 overflow-x-auto">
      {/* כפתורי ניווט */}
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          {(['daily','weekly','monthly'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded ${view === v ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
            >
              {v === 'daily' ? 'יומי' : v === 'weekly' ? 'שבועי' : 'חודשי'}
            </button>
          ))}
        </div>
        <div className="space-x-2">
          <button onClick={() => setCurrentDate(today)} className="px-3 py-1 bg-blue-100 rounded">היום</button>
          <button onClick={() => navigate('prev')} className="px-3 py-1">←</button>
          <button onClick={() => navigate('next')} className="px-3 py-1">→</button>
        </div>
      </div>

      {view === 'weekly' ? (
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((day, i) => {
            const dayApps = appointments.filter(app =>
              isSameDay((app.startTime as Timestamp).toDate(), day)
            );
            return (
              <div key={i} className="border rounded-lg p-3 bg-white shadow-sm">
                <div className="font-bold mb-1 text-sm">
                  {format(day, 'd/M (EEEE)', { locale: he })}
                </div>
                {dayApps.length ? (
                  <ul className="text-xs space-y-1">
                    {dayApps.map(app => (
                      <li
                        key={app.id}
                        className="cursor-pointer hover:underline"
                        onClick={() => setSelectedAppointment(app)}
                      >
                        {format((app.startTime as Timestamp).toDate(), 'HH:mm')} – {app.clientName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-xs">אין תורים</p>
                )}
              </div>
            );
          })}
        </div>
      ) : view === 'monthly' ? (
        <table className="min-w-full border">
          <thead>
            <tr>
              {WEEK_DAYS.map((wd,i) => <th key={i} className="border px-4 py-2 text-center text-sm font-medium">{wd}</th>)}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
              const rows: Date[][] = [];
              for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i+7));
              return rows.map((week,rowIdx) => (
                <tr key={rowIdx}>
                  {week.map((day,cellIdx) => {
                    const has = appointments.some(app => isSameDay((app.startTime as Timestamp).toDate(), day));
                    return (
                      <td key={cellIdx} className="border px-4 py-3 text-center">
                        <div className="text-sm font-semibold mb-1">{format(day,'d/M')}</div>
                        {has ? (
                          <button
                            className="text-xs bg-primary-600 text-white rounded px-2 py-1"
                            onClick={() => { setCurrentDate(day); setView('daily'); }}
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
          {appointments.filter(app => isSameDay((app.startTime as Timestamp).toDate(), currentDate)).length ? (
            <ul className="space-y-3">
              {appointments
                .filter(app => isSameDay((app.startTime as Timestamp).toDate(), currentDate))
                .sort((a,b) => (a.startTime as Timestamp).toDate().getTime() - (b.startTime as Timestamp).toDate().getTime())
                .map(app => {
                  const dt = (app.startTime as Timestamp).toDate();
                  return (
                    <li key={app.id} className="border p-3 rounded flex justify-between items-center">
                      <div>
                        <p><strong>{format(dt,'HH:mm')}</strong> – {app.clientName}</p>
                        <p className="text-sm text-gray-500">{servicesMap[app.serviceId]}</p>
                      </div>
                      <button
                        disabled={isPast(dt)}
                        onClick={() => cancelAppointment(app.id)}
                        className={`px-3 py-1 rounded ${isPast(dt) ? 'bg-gray-300 text-gray-600 cursor-default' : 'bg-red-500 text-white'}`}
                      >
                        {isPast(dt) ? 'בוצע' : 'בטל'}
                      </button>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="text-gray-500">אין תורים ביום זה.</p>
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
              <button onClick={() => cancelAppointment(selectedAppointment.id)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">בטל תור</button>
              <button onClick={() => setSelectedAppointment(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">סגור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
