"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // ודא שהנתיב הזה נכון
import useStore from '../../store/useStore';

interface Appointment {
  id: string;
  businessId: string;
  startTime: string;
  status: string;
  notes?: string;
}

const AppointmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useStore(); // שמרנו את useStore רק בשביל ה-user
  const businessId = user?.businessId;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!businessId) return;

      try {
        const q = query(
          collection(db, 'appointments'),
          where('businessId', '==', businessId)
        );
        const querySnapshot = await getDocs(q);
        const fetched: Appointment[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Appointment, 'id'>),
        }));
        setAppointments(fetched);
      } catch (error) {
        console.error('שגיאה בטעינת תורים:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [businessId]);

  if (!businessId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">{t('appointments.title', 'Appointments')}</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-600 font-semibold">
            לא נמצאה זהות של העסק. אנא התחברי מחדש או פני לתמיכה.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('appointments.title', 'Appointments')}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <p className="text-gray-600">טוען תורים...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-600">{t('appointments.noAppointments', 'No appointments found.')}</p>
        ) : (
          <ul className="space-y-4">
            {appointments.map(app => (
              <li key={app.id} className="border-b pb-2">
                <div><strong>תאריך:</strong> {new Date(app.startTime).toLocaleString('he-IL')}</div>
                <div><strong>סטטוס:</strong> {app.status}</div>
                <div><strong>הערות:</strong> {app.notes || '-'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
