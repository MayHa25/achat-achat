// src/pages/public/BookPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  setDoc,
  increment,
} from "firebase/firestore";
import { Service } from "../../types";

const BookPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { ownerId: businessId } = useParams<{ ownerId: string }>();

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [step, setStep] = useState<number>(1);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);

  const defaultSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00"
  ];

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const q = query(collection(db, "services"), where("businessId", "==", businessId));
      const snap = await getDocs(q);
      setServices(snap.docs.map(d => ({ ...(d.data() as Omit<Service, "id">), id: d.id })));
    })();
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const q = query(collection(db, "appointments"), where("businessId", "==", businessId));
      const snap = await getDocs(q);
      setAppointments(snap.docs.map(doc => doc.data()));
    })();
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const q = query(collection(db, "availability"), where("businessId", "==", businessId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setAvailability(data.hours || []);
      }
    })();
  }, [businessId]);

  const determineClientStatus = (visits: number): string => {
    if (visits >= 10) return "VIP";
    if (visits >= 3) return "קבוע";
    return "מזדמן";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    if (step < 3) return setStep(step + 1);
    if (!selectedService || !selectedDate || !selectedTime || !name || !phone) return alert("חסרים שדות חובה.");

    const datetimeStr = `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}`;
    const appointmentDate = new Date(datetimeStr);
    if (isNaN(appointmentDate.getTime())) return alert(`שעת התור שגויה: ${datetimeStr}`);
    const appointmentTs = Timestamp.fromDate(appointmentDate);

    const conflictQ = query(
      collection(db, "appointments"),
      where("businessId", "==", businessId),
      where("startTime", "==", appointmentTs)
    );
    const conflictSnap = await getDocs(conflictQ);
    if (!conflictSnap.empty) return alert("התור בשעה זו כבר תפוס.");

    const service = services.find(s => s.id === selectedService);
    const appointment = {
      businessId,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      serviceId: selectedService,
      serviceName: service?.name || "",
      startTime: appointmentTs,
      status: "pending",
      paymentStatus: "pending",
      notes,
    };

    try {
      await addDoc(collection(db, "appointments"), appointment);
      const clientQ = query(collection(db, "clients"), where("businessId", "==", businessId), where("phone", "==", phone));
      const clientSnap = await getDocs(clientQ);
      if (clientSnap.empty) {
        await addDoc(collection(db, "clients"), {
          businessId,
          name,
          phone,
          email,
          notes,
          visits: 1,
          totalPayments: 0,
          status: "מזדמן",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } else {
        const clientRef = clientSnap.docs[0].ref;
        const previousVisits = clientSnap.docs[0].data().visits || 0;
        const newStatus = determineClientStatus(previousVisits + 1);
        await setDoc(clientRef, { name, email, notes, visits: increment(1), status: newStatus, updatedAt: Timestamp.now() }, { merge: true });
      }
      navigate("/appointment-sent", { state: { appointment, client: { name, phone, email, notes }, service } });
    } catch (err) {
      console.error(err);
      alert("אירעה שגיאה. אנא נסי שוב.");
    }
  };

  const isSlotTaken = (date: Date, time: string) => {
    return appointments.some(app => {
      const appDate = app.startTime?.toDate?.();
      return appDate && format(appDate, "yyyy-MM-dd'T'HH:mm") === `${format(date, "yyyy-MM-dd")}T${time}`;
    });
  };

  const isNextDisabled = () => {
    if (step === 1) return !selectedService;
    if (step === 2) return !selectedDate || !selectedTime;
    if (step === 3) return !name || !phone;
    return false;
  };

  const startOfCurrentWeek = startOfWeek(new Date(), { locale: he, weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

  const getAvailabilityForDay = (dayIndex: number) => availability.find((a: any) => a.dayOfWeek === dayIndex);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">{t("book_appointment") || "קביעת תור"}</h1>
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="mb-6">
              <label className="block mb-2">{t("select_service") || "בחרי שירות"}</label>
              <select value={selectedService} onChange={e => setSelectedService(e.target.value)} className="w-full border-gray-300 rounded px-4 py-2" required>
                <option value="">-- בחרי --</option>
                {services.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              {selectedService && (
                <p className="mt-2 text-sm text-gray-700">מחיר השירות: ₪{services.find(s => s.id === selectedService)?.price || 'לא זמין'}</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="overflow-x-auto">
              <table className="table-auto w-full border text-center">
                <thead>
                  <tr>
                    <th className="p-2 border">שעה</th>
                    {weekDays.map((day, index) => {
                      const av = getAvailabilityForDay(day.getDay());
                      return (
                        <th key={day.toDateString()} className="p-2 border">
                          {format(day, 'EEEE', { locale: he })}<br />{format(day, 'dd.MM')}
                          {!av?.available && <div className="text-red-500 text-xs">לא פעיל</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {defaultSlots.map(time => (
                    <tr key={time}>
                      <td className="p-2 border font-medium">{time}</td>
                      {weekDays.map(day => {
                        const dayAvailability = getAvailabilityForDay(day.getDay());
                        const isTaken = isSlotTaken(day, time);
                        const inRange = dayAvailability?.startTime <= time && time <= dayAvailability?.endTime;
                        const isActive = dayAvailability?.available && inRange;
                        return (
                          <td
                            key={day.toISOString() + time}
                            className={`p-2 border ${!isActive || isTaken ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'hover:bg-green-100 cursor-pointer'}`}
                            onClick={() => {
                              if (isActive && !isTaken) {
                                setSelectedDate(day);
                                setSelectedTime(time);
                                setStep(3);
                              }
                            }}
                          >
                            {!isActive ? '-' : isTaken ? 'תפוס' : 'פנוי'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {step === 3 && (
            <>
              <div className="mb-4">
                <label className="block mb-1">{t("name") || "שם מלא"}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border-gray-300 rounded px-4 py-2" required />
              </div>
              <div className="mb-4">
                <label className="block mb-1">{t("phone") || "טלפון"}</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border-gray-300 rounded px-4 py-2" required />
              </div>
              <div className="mb-4">
                <label className="block mb-1">{t("email") || "אימייל (לא חובה)"}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border-gray-300 rounded px-4 py-2" />
              </div>
              <div className="mb-4">
                <label className="block mb-1">{t("notes") || "הערות"}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border-gray-300 rounded px-4 py-2" />
              </div>
            </>
          )}

          <div className="flex justify-end mt-6">
            <button type="submit" disabled={isNextDisabled()} className={`bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 transition ${isNextDisabled() ? "opacity-50 cursor-not-allowed" : ""}`}>
              {step < 3 ? t("next") || "הבא" : t("book") || "שלחי תור"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookPage;
