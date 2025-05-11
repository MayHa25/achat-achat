import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { addDays, startOfWeek, setHours, setMinutes } from 'date-fns';

const BookPage: React.FC = () => {
  const params = useParams();
  const businessId = params.businessId;

  const [services, setServices] = useState<any[]>([]);
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchData = async () => {
      try {
        const servicesQuery = query(collection(db, 'services'), where('businessId', '==', businessId));
        const appointmentsQuery = query(collection(db, 'appointments'), where('businessId', '==', businessId));

        const [servicesSnap, appointmentsSnap, availabilityDocSnap] = await Promise.all([
          getDocs(servicesQuery),
          getDocs(appointmentsQuery),
          getDoc(doc(db, 'availability', businessId))
        ]);

        setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setAppointments(appointmentsSnap.docs.map(doc => doc.data()));

        const availabilityData = availabilityDocSnap.data();
        setAvailabilities(availabilityData?.businessHours || []);
      } catch (err) {
        console.error("שגיאה בטעינת נתונים:", err);
      } finally {
        setLoading(false);
      }
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
      duration: selectedService?.duration || 30,
      price: selectedService?.price || 0,
      status: 'pending',
      created: Timestamp.now()
    };

    await addDoc(collection(db, 'appointments'), newAppointment);
    setSuccessMessage('התור נשלח לאישור בעלת העסק!');
    setSelectedSlot(null);
    setClientName('');
    setClientPhone('');
  };

  if (!businessId) {
    return <p className="text-center mt-10 text-red-600 font-bold">שגיאה: לא נמצא מזהה עסק בכתובת.</p>;
  }

  if (loading) {
    return <p className="text-center mt-10">טוען נתונים...</p>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">קביעת תור</h1>

      {successMessage && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-6 text-center">
          {successMessage}
        </div>
      )}

      {services.length === 0 && (
        <p className="text-center text-gray-500 mt-4">אין שירותים זמינים להצגה. אנא בדקי בהגדרות העסק.</p>
      )}

      {availabilities.length === 0 && (
        <p className="text-center text-gray-500 mt-4">בעלת העסק לא הגדירה שעות פעילות.</p>
      )}

      {/* הקוד הרלוונטי לטבלת שירותים וזמנים יגיע כאן בהמשך */}
    </div>
  );
};

export default BookPage;
