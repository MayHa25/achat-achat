import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { format, addDays, startOfWeek, setHours, setMinutes } from 'date-fns';

const BookPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();

  const [services, setServices] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      const servicesQuery = query(collection(db, 'services'), where('businessId', '==', businessId));
      const availabilitiesQuery = query(collection(db, 'availabilities'), where('businessId', '==', businessId));
      const appointmentsQuery = query(collection(db, 'appointments'), where('businessId', '==', businessId));

      const [servicesSnap, availabilitiesSnap, appointmentsSnap] = await Promise.all([
        getDocs(servicesQuery),
        getDocs(availabilitiesQuery),
        getDocs(appointmentsQuery)
      ]);

      setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setAvailabilities(availabilitiesSnap.docs.map(doc => doc.data()));
      setAppointments(appointmentsSnap.docs.map(doc => doc.data()));
    };

    fetchData();
  }, [businessId]);

  const getAvailableHoursForDay = (dayIndex: number) => {
    const dayAvailability = availabilities.find(a => a.dayOfWeek === dayIndex && a.available);
    if (!dayAvailability) return [];

    const startHour = parseInt(dayAvailability.startTime.split(':')[0]);
    const endHour = parseInt(dayAvailability.endTime.split(':')[0]);

    const hours: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return hours;
  };

  const isTimeTaken = (date: Date, time: string) => {
    const timeDate = new Date(date);
    const [h, m] = time.split(':');
    timeDate.setHours(parseInt(h), parseInt(m), 0, 0);

    return appointments.some(appt => {
      const startTime = (appt.startTime as Timestamp).toDate();
      return startTime.getTime() === timeDate.getTime();
    });
  };

  const weekDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const handleBookAppointment = async () => {
    if (!selectedSlot || !selectedServiceId || !businessId || !clientName || !clientPhone) return;

    const selectedService = services.find(s => s.id === selectedServiceId);
    const selectedDate = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), selectedSlot.day);
    const [hour, minute] = selectedSlot.time.split(':').map(Number);
    const startTime = setMinutes(setHours(selectedDate, hour), minute);

    const newAppointment = {
      businessId,
      serviceId: selectedServiceId,
      clientName,
      clientPhone,
      startTime: Timestamp.fromDate(startTime),
      duration: selectedService.duration,
      price: selectedService.price,
      status: 'confirmed',
      created: Timestamp.now()
    };

    await addDoc(collection(db, 'appointments'), newAppointment);
    setSuccessMessage('התור נקבע בהצלחה!');
    setSelectedSlot(null);
    setClientName('');
    setClientPhone('');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">קביעת תור</h1>

      {successMessage && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-6 text-center">
          {successMessage}
        </div>
      )}

      {/* שירותים */}
      <div className="mb-6">
        <h2 className="font-medium mb-2">בחרי שירות</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {services.map(service => (
            <div
              key={service.id}
              className={`border p-4 rounded cursor-pointer ${
                selectedServiceId === service.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200'
              }`}
              onClick={() => setSelectedServiceId(service.id)}
            >
              <p className="font-semibold">{service.name}</p>
              <p className="text-sm text-gray-500">{service.duration} דקות</p>
              <p className="text-sm text-gray-600">₪{service.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* טבלת שעות */}
      {selectedServiceId && (
        <>
          <h2 className="font-medium mb-3">בחרי מועד</h2>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr>
                  {weekDays.map((day, i) => {
                    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), i);
                    return (
                      <th key={i} className="border px-4 py-2 text-sm font-medium">
                        {day} <br />
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
                      const date = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), dayIndex);

                      if (!time) {
                        return <td key={dayIndex} className="border px-4 py-2 text-center text-gray-300">—</td>;
                      }

                      const taken = isTimeTaken(date, time);
                      const isSelected =
                        selectedSlot?.day === dayIndex && selectedSlot.time === time;

                      return (
                        <td key={dayIndex} className="border px-1 py-2 text-center">
                          <button
                            disabled={taken}
                            onClick={() =>
                              setSelectedSlot({ day: dayIndex, time })
                            }
                            className={`w-full rounded px-2 py-1 text-sm ${
                              taken
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : isSelected
                                ? 'bg-primary-600 text-white'
                                : 'bg-white hover:bg-primary-100'
                            }`}
                          >
                            {taken ? 'תפוס' : time}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* פרטים אישיים */}
          <div className="mb-6">
            <h2 className="font-medium mb-2">פרטי יצירת קשר</h2>
            <input
              type="text"
              placeholder="שם מלא"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full border px-4 py-2 rounded mb-3"
            />
            <input
              type="tel"
              placeholder="מספר טלפון"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
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
