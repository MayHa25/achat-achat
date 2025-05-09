// src/pages/public/BookPage.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
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
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  // Default daily time slots
  const defaultSlots = [
    "09:00","09:30","10:00","10:30","11:00","11:30",
    "12:00","12:30","13:00","13:30","14:00","14:30",
    "15:00","15:30","16:00","16:30","17:00","17:30",
  ];

  // Load services for this business
  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const q = query(
        collection(db, "services"),
        where("businessId", "==", businessId)
      );
      const snap = await getDocs(q);
      setServices(
        snap.docs.map(d => ({
          ...(d.data() as Omit<Service, "id">),
          id: d.id,
        }))
      );
    })();
  }, [businessId]);

  // Compute availableTimes when date or service changes
  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setAvailableTimes([]);
      return;
    }
    // Always use the defaultSlots (or you can replace with dynamic slots from Firestore)
    setAvailableTimes(defaultSlots);
  }, [selectedDate, selectedService]);

  const determineClientStatus = (visits: number): string => {
    if (visits >= 10) return "VIP";
    if (visits >= 3) return "קבוע";
    return "מזדמן";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      alert("שגיאה: לא נמצא מזהה העסק בכתובת.");
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    if (!selectedService || !selectedDate || !selectedTime || !name || !phone) {
      alert("חסרים שדות חובה. אנא בדקי שוב.");
      return;
    }

    const datetimeStr = `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}`;
    const appointmentDate = new Date(datetimeStr);
    if (isNaN(appointmentDate.getTime())) {
      alert(`שעת התור שגויה: ${datetimeStr}`);
      return;
    }
    const appointmentTs = Timestamp.fromDate(appointmentDate);

    // Prevent conflicts
    const conflictQ = query(
      collection(db, "appointments"),
      where("businessId", "==", businessId),
      where("startTime", "==", appointmentTs)
    );
    const conflictSnap = await getDocs(conflictQ);
    if (!conflictSnap.empty) {
      alert("מצטערים, התור בשעה זו כבר תפוס. אנא בחרי זמן אחר.");
      return;
    }

    // Build and save appointment
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

      // Upsert client record
      const clientQ = query(
        collection(db, "clients"),
        where("businessId", "==", businessId),
        where("phone", "==", phone)
      );
      const clientSnap = await getDocs(clientQ);
      const visits = clientSnap.empty
        ? 0
        : ((clientSnap.docs[0].data().visits as number) || 0);
      const status = determineClientStatus(visits + 1);

      const clientDocId = `${businessId}_${phone}`;
      await setDoc(
        doc(db, "clients", clientDocId),
        {
          businessId,
          name,
          phone,
          email,
          notes,
          visits: increment(1),
          totalPayments: increment(0),
          status,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      navigate("/appointment-sent", {
        state: { appointment, client: { name, phone, email, notes }, service },
      });
    } catch (err) {
      console.error(err);
      alert("אירעה שגיאה. אנא נסי שוב.");
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !selectedService;
    if (step === 2) return !selectedDate || !selectedTime;
    if (step === 3) return !name || !phone;
    return false;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {t("book_appointment") || "קביעת תור"}
        </h1>
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="mb-6">
              <label className="block mb-2">
                {t("select_service") || "בחרי שירות"}
              </label>
              <select
                value={selectedService}
                onChange={e => setSelectedService(e.target.value)}
                className="w-full border-gray-300 rounded px-4 py-2"
                required
              >
                <option value="">-- בחרי --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <label className="block mb-2">
                  {t("select_date") || "בחרי תאריך"}
                </label>
                <Calendar
                  value={selectedDate}
                  onChange={(value: any, _event: any) => {
                    const val = value as Date | Date[];
                    const date = Array.isArray(val) ? val[0] : val;
                    setSelectedDate(date);
                  }}
                  minDate={new Date()}
                  locale="he"
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2">
                  {t("select_time") || "בחרי שעה"}
                </label>
                <select
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  className="w-full border-gray-300 rounded px-4 py-2"
                  required
                >
                  <option value="">-- בחרי שעה --</option>
                  {availableTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="mb-4">
                <label className="block mb-1">{t("name") || "שם מלא"}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border-gray-300 rounded px-4 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">{t("phone") || "טלפון"}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border-gray-300 rounded px-4 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">{t("email") || "אימייל (לא חובה)"}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border-gray-300 rounded px-4 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">{t("notes") || "הערות"}</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border-gray-300 rounded px-4 py-2"
                />
              </div>
            </>
          )}

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={isNextDisabled()}
              className={`bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 transition ${
                isNextDisabled() ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {step < 3 ? t("next") || "הבא" : t("book") || "שלחי תור"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookPage;
