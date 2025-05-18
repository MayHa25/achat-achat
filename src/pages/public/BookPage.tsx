// src/pages/public/BookPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import {
  addDays,
  startOfWeek,
  setHours,
  setMinutes,
  format,
  addWeeks
} from 'date-fns';

const SEND_SMS_FN_URL =
  'https://us-central1-achat-achat-app.cloudfunctions.net/sendAppointmentSmsOnCreate';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}
type Slot = { day: number; time: string };

const BookPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const now = new Date(); // ✅ בשימוש לבדיקה אם השעה עברה

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        const servicesSnap = await getDocs(
          query(collection(db, 'services'), where('businessId', '==', businessId))
        );
        const appointmentsSnap = await getDocs(
          query(
            collection(db, 'appointments'),
            where('businessId', '==', businessId),
            where('status', '==', 'pending')
          )
        );
        const availabilityDoc = await getDoc(doc(db, 'availability', businessId));

        const mappedServices: Service[] = servicesSnap.docs
          .map(d => ({ id: d.id, ...(d.data() as Omit<Service, 'id'>) }))
          .filter(s => s.name !== 'שלום בביט');
        setServices(mappedServices);

        setAppointments(appointmentsSnap.docs.map(d => d.data()));
        const availabilityData = availabilityDoc.data();
        setAvailabilities(availabilityData?.businessHours || []);
      } catch (err) {
        console.error('שגיאה בטעינת נתונים:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId]);
  const getAvailableHoursForDay = (dayIndex: number): string[] => {
    const dayAvailability = availabilities.find(
      a => a.dayOfWeek === dayIndex && a.available
    );
    if (!dayAvailability) return [];
    const startHour = parseInt(dayAvailability.startTime.split(':')[0], 10);
    const endHour = parseInt(dayAvailability.endTime.split(':')[0], 10);
    const hours: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return hours;
  };

  const isTimeTaken = (date: Date, time: string): boolean => {
    const d = new Date(date);
    const [h, m] = time.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return appointments.some(appt => {
      const start = (appt.startTime as Timestamp).toDate();
      return start.getTime() === d.getTime();
    });
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot || !selectedServiceId || !businessId || !clientName || !clientPhone)
      return;

    const selectedService = services.find(s => s.id === selectedServiceId)!;
    const weekStart = addWeeks(
      startOfWeek(new Date(), { weekStartsOn: 0 }),
      weekOffset
    );
    const [hour, minute] = selectedSlot.time.split(':').map(Number);
    const dayDate = addDays(weekStart, selectedSlot.day);
    const startTimeDate = setMinutes(setHours(dayDate, hour), minute);

    const newAppointment = {
      businessId,
      serviceId: selectedServiceId,
      clientName,
      clientPhone,
      startTime: Timestamp.fromDate(startTimeDate),
      duration: selectedService.duration,
      price: selectedService.price,
      status: 'pending',
      created: Timestamp.now()
    };

    try {
      const appointmentRef = await addDoc(
        collection(db, 'appointments'),
        newAppointment
      );

      try {
        await fetch(SEND_SMS_FN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointmentId: appointmentRef.id, businessId })
        });
      } catch (smsErr) {
        console.error('שגיאה בשליחת SMS:', smsErr);
      }

      const clientSnap = await getDocs(
        query(
          collection(db, 'clients'),
          where('businessId', '==', businessId),
          where('phone', '==', clientPhone)
        )
      );
      let visitCount = 1;
      let totalAmount = selectedService.price;
      let status = 'מזדמן';

      if (!clientSnap.empty) {
        const cDoc = clientSnap.docs[0];
        const data = cDoc.data();
        visitCount = (data.visitCount || 0) + 1;
        totalAmount = (data.totalAmount || 0) + selectedService.price;
        status = visitCount >= 11 ? 'VIP' : visitCount >= 5 ? 'קבוע' : 'מזדמן';
        await updateDoc(doc(db, 'clients', cDoc.id), {
          visitCount,
          totalAmount,
          status,
          lastVisit: Timestamp.fromDate(startTimeDate)
        });
      } else {
        await addDoc(collection(db, 'clients'), {
          businessId,
          name: clientName,
          phone: clientPhone,
          visitCount,
          totalAmount,
          status,
          lastVisit: Timestamp.fromDate(startTimeDate)
        });
      }

      navigate('/confirmation', {
        state: {
          appointment: { id: appointmentRef.id, ...newAppointment },
          client: { name: clientName, phone: clientPhone },
          service: selectedService
        }
      });
    } catch (err) {
      console.error('שגיאה בקביעת התור:', err);
    }
  };
  if (!businessId) {
    return <p className="text-center mt-10 text-red-600 font-bold">שגיאה: לא נמצא מזהה עסק בכתובת.</p>;
  }
  if (loading) {
    return <p className="text-center mt-10">טוען נתונים...</p>;
  }

  const weekDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const currentWeekStart = addWeeks(
    startOfWeek(new Date(), { weekStartsOn: 0 }),
    weekOffset
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">קביעת תור</h1>

      <div className="flex justify-between mb-4">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="px-3 py-1 bg-gray-200 rounded">← שבוע קודם</button>
        <button onClick={() => setWeekOffset(0)} className="px-3 py-1 bg-blue-100 rounded">שבוע נוכחי</button>
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="px-3 py-1 bg-gray-200 rounded">שבוע הבא →</button>
      </div>

      <div className="mb-6">
        <h2 className="font-medium mb-2">בחרי שירות</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {services.map(s => {
            const isSelected = selectedServiceId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedServiceId(s.id)}
                className={`border p-4 rounded cursor-pointer ${isSelected ? 'border-primary-600 bg-primary-50' : 'border-gray-200'}`}
              >
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-gray-500">{s.duration} דקות</p>
                <p className="text-sm text-gray-600">₪{s.price}</p>
              </div>
            );
          })}
        </div>
      </div>

      {selectedServiceId && (
        <>
          <h2 className="font-medium mb-3">בחרי מועד</h2>
          <div className="overflow-x-auto mb-6" dir="rtl">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr>
                  {weekDays.map((day, i) => {
                    const date = addDays(currentWeekStart, i);
                    return (
                      <th key={i} className="border px-4 py-2 text-sm font-medium">
                        {day}
                        <br />
                        {format(date, 'd/M')}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[...Array(12).keys()].map(row => (
                  <tr key={row}>
                    {weekDays.map((_, dayIndex) => {
                      const hours = getAvailableHoursForDay(dayIndex);
                      const time = hours[row];
                      const date = addDays(currentWeekStart, dayIndex);
                      if (!time) {
                        return <td key={dayIndex} className="border px-4 py-2 text-center text-gray-300">—</td>;
                      }

                      const taken = isTimeTaken(date, time);
                      const [hour, minute] = time.split(':').map(Number);
                      const dateWithTime = new Date(date);
                      dateWithTime.setHours(hour, minute, 0, 0);
                      const isPast = dateWithTime < now;

                      const disabled = taken || isPast;
                      const selected = selectedSlot?.day === dayIndex && selectedSlot.time === time;

                      return (
                        <td key={dayIndex} className="border px-1 py-2 text-center">
                          <button
                            disabled={disabled}
                            onClick={() => setSelectedSlot({ day: dayIndex, time })}
                            className={`w-full rounded px-2 py-1 text-sm ${disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : selected ? 'bg-primary-600 text-white' : 'bg-white hover:bg-primary-100'}`}
                          >
                            {time}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-6">
            <h2 className="font-medium mb-2">פרטי יצירת קשר</h2>
            <input
              type="text"
              placeholder="שם מלא"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full border px-4 py-2 rounded mb-3"
            />
            <input
              type="tel"
              placeholder="מספר טלפון"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              className="w-full border px-4 py-2 rounded"
            />
          </div>

          <button
            onClick={handleBookAppointment}
            disabled={!clientName || !clientPhone || !selectedSlot}
            className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition"
          >
            קבעי תור
          </button>
        </>
      )}
    </div>
  );
};

export default BookPage;
