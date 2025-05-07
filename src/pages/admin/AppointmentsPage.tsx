"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useStore from '../../store/useStore';

interface Appointment {
  id: string;
  businessId: string;
  startTime: Timestamp;
  status: string;
  notes?: string;
}

const AppointmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useStore();
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

  const updateAppointmentStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const ref = doc(db, 'appointments', id);
      await updateDoc(ref, { status: newStatus });
      setAppointments(prev =>
        prev.map(app => app.id === id ? { ...app, status: newStatus } : app)
      );
    } catch (err) {
      console.error('שגיאה בעדכון סטטוס התור:', err);
      alert('שגיאה בעדכון סטטוס התור.');
    }
  };

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
                <div><strong>תאריך:</strong> {app.startTime.toDate().toLocaleString('he-IL')}</div>
                <div><strong>סטטוס:</strong> {app.status}</div>
                <div><strong>הערות:</strong> {app.notes || '-'}</div>

                {app.status === 'pending' && (
                  <div className="mt-2 flex space-x-2 rtl:space-x-reverse">
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                      onClick={() => updateAppointmentStatus(app.id, 'approved')}
                    >
                      אשרי
                    </button>
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                      onClick={() => updateAppointmentStatus(app.id, 'rejected')}
                    >
                      דחייה
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
