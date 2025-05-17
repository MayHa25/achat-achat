// src/pages/admin/AppointmentsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
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
  onSnapshot,
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
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Load services and subscribe to appointments
  useEffect(() => {
    if (!user?.businessId) return;

    // Load services map once
    (async () => {
      const svcsSnap = await getDocs(
        query(collection(db, 'services'), where('businessId', '==', user.businessId))
      );
      const map: Record<string, string> = {};
      svcsSnap.docs.forEach(d => {
        const data = d.data() as any;
        map[d.id] = data.name;
      });
      setServicesMap(map);
    })();

    // Real-time subscribe to appointments
    const appsQuery = query(
      collection(db, 'appointments'),
      where('businessId', '==', user.businessId)
    );
    const unsubscribeApps = onSnapshot(appsQuery, snapshot => {
      const apps = snapshot.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .filter(a => a.status === 'pending');
      setAppointments(apps);
    });

    return () => unsubscribeApps();
  }, [user?.businessId]);

  const cancelAppointment = async (id: string) => {
    await updateDoc(doc(db, 'appointments', id), { status: 'cancelled_by_admin' });
    setAppointments(prev => prev.filter(a => a.id !== id));
    setSelectedAppointment(null);
  };

  // Date calculations for weekly view
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleNav = (dir: 'prev' | 'next') => {
    if (view === 'weekly') setCurrentDate(d => dir === 'next' ? addWeeks(d, 1) : subWeeks(d, 1));
    else if (view === 'monthly') setCurrentDate(d => dir === 'next' ? addWeeks(d, 4) : subWeeks(d, 4));
    else setCurrentDate(d => dir === 'next' ? addDays(d, 1) : addDays(d, -1));
  };
  
  const now = new Date();

  return (
    <div className="p-6 overflow-auto">
      {/* View Switch & Navigation */}
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <button onClick={() => setView('daily')} className={`px-3 py-1 rounded ${view==='daily'?'bg-primary-600 text-white':'bg-gray-200'}`}>יומי</button>
          <button onClick={() => setView('weekly')} className={`px-3 py-1 rounded ${view==='weekly'?'bg-primary-600 text-white':'bg-gray-200'}`}>שבועי</button>
          <button onClick={() => setView('monthly')} className={`px-3 py-1 rounded ${view==='monthly'?'bg-primary-600 text-white':'bg-gray-200'}`}>חודשי</button>
        </div>
        <div className="space-x-2">
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 bg-blue-100 rounded">היום</button>
          <button onClick={() => handleNav('prev')} className="px-3 py-1">←</button>
          <button onClick={() => handleNav('next')} className="px-3 py-1">→</button>
        </div>
      </div>

      {/* Weekly View */}
      {view === 'weekly' && (
        <table className="min-w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1 bg-gray-50 text-center">🕒</th>
              {daysOfWeek.map((day, i) => (
                <th key={i} className="border px-2 py-1 bg-gray-50 text-center text-sm">
                  {format(day, 'd/M')}<br/><span className="text-xs">{WEEK_DAYS[day.getDay()]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour}>
                <td className="border px-2 py-1 bg-gray-50 text-center text-sm">{hour.toString().padStart(2,'0')}:00</td>
                {daysOfWeek.map((day, di) => {
                  const slotTime = new Date(day);
                  slotTime.setHours(hour,0,0,0);
                  const inPast = isBefore(slotTime, now);
                  const appt = appointments.find(a =>
                    isSameDay((a.startTime as Timestamp).toDate(), day) &&
                    (a.startTime as Timestamp).toDate().getHours() === hour
                  );
                  return (
                    <td key={di} className="border px-2 py-1 h-12">
                      {appt ? (
                        <button
                          onClick={() => setSelectedAppointment(appt)}
                          className={`w-full h-full text-sm rounded ${inPast ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-primary-100 hover:bg-primary-200 text-primary-700'}`}
                          disabled={inPast}
                        >{appt.clientName}</button>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Daily View */}
      {view === 'daily' && (
        <div className="space-y-2">
          <h2 className="font-semibold mb-2">{format(currentDate, 'EEEE, d בMMMM yyyy', { locale: he })}</h2>
          {HOURS.map(hour => {
            const slotTime = new Date(currentDate);
            slotTime.setHours(hour,0,0,0);
            const inPast = isBefore(slotTime, now);
            const appt = appointments.find(a =>
              isSameDay((a.startTime as Timestamp).toDate(), currentDate) &&
              (a.startTime as Timestamp).toDate().getHours() === hour
            );
            return (
              <div key={hour} className="flex justify-between items-center border p-2 rounded">
                <span className={`${inPast?'text-gray-400':'font-medium'}`}>{hour.toString().padStart(2,'0')}:00</span>
                {appt ? (
                  <button
                    onClick={() => setSelectedAppointment(appt)}
                    className={`px-3 py-1 rounded text-sm ${inPast ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-primary-100 hover:bg-primary-200 text-primary-700'}`}
                    disabled={inPast}
                  >{appt.clientName}</button>
                ) : <span className="text-gray-300">פנוי</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly View */}
      {view === 'monthly' && (
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {WEEK_DAYS.map((d,i) => (
                <th key={i} className="border px-2 py-1 bg-gray-50 text-center text-sm">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => {
              const start = startOfMonth(currentDate);
              const end   = endOfMonth(currentDate);
              const days  = eachDayOfInterval({ start, end });
              const rows: Date[][] = [];
              for (let i=0; i<days.length; i+=7) rows.push(days.slice(i,i+7));
              return rows.map((week,ri) => (
                <tr key={ri}>
                  {week.map((day,ci) => {
                    const inPast = isBefore(day, now);
                    const appts = appointments.filter(a =>
                      isSameDay((a.startTime as Timestamp).toDate(), day)
                    );
                    return (
                      <td key={ci} className="border px-2 py-1 align-top h-24">
                        <div className={inPast?'text-gray-400':''}>{format(day,'d')}</div>
                        {appts.map(a => (
                          <button
                            key={a.id}
                            onClick={()=>setSelectedAppointment(a)}
                            className={`block w-full text-xs mt-1 rounded px-1 py-0.5 ${inPast ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-primary-100 text-primary-700 hover:bg-primary-200'}`}
                            disabled={inPast}
                          >{format((a.startTime as Timestamp).toDate(),'HH:mm')} {a.clientName}</button>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">פרטי תור</h2>
            <p><strong>לקוחה:</strong> {selectedAppointment.clientName}</p>
            <p><strong>שירות:</strong> {servicesMap[selectedAppointment.serviceId]}</p>
            <p><strong>תאריך:</strong> {format((selectedAppointment.startTime as Timestamp).toDate(),'eeee, d בMMMM yyyy',{locale:he})}</p>
            <p><strong>שעה:</strong> {format((selectedAppointment.startTime as Timestamp).toDate(),'HH:mm')}</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={()=>cancelAppointment(selectedAppointment.id)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">בטל תור</button>
              <button onClick={()=>setSelectedAppointment(null)} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">סגור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
