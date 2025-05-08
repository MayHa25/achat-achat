"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useStore from '../../store/useStore';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  businessId: string;
  clientName?: string;
  serviceName?: string;
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
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [appointmentSent, setAppointmentSent] = useState(false); // מצב חדש

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

  const filteredAppointments =
    filter === 'all'
      ? appointments
      : appointments.filter(app => app.status === filter);

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
      <h1 className="text-2xl font-bold mb-4">ניהול תורים</h1>

      <div className="mb-4 flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status as typeof filter)}
            className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status === 'all' ? 'הכל' : status === 'pending' ? 'ממתינים' : status === 'approved' ? 'מאושרים' : 'נדחים'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <p className="text-gray-600">טוען תורים...</p>
        ) : filteredAppointments.length === 0 ? (
          <p className="text-gray-600">לא נמצאו תורים.</p>
        ) : (
          <ul className="space-y-4">
            {filteredAppointments.map(app => (
              <li key={app.id} className="border rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">{app.clientName || 'לקוחה ללא שם'}</h3>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded-full ${
                      app.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : app.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {app.status === 'approved'
                      ? 'מאושר'
                      : app.status === 'rejected'
                      ? 'נדחה'
                      : 'ממתין לאישור'}
                  </span>
                </div>

                <p className="text-gray-700 mb-1">
                  <strong>שירות:</strong> {app.serviceName || '-'}
                </p>
                <p className="text-gray-700 mb-1">
                  <strong>תאריך:</strong> {format(app.startTime.toDate(), 'dd.MM.yyyy')}
                </p>
                <p className="text-gray-700 mb-1">
                  <strong>שעה:</strong> {format(app.startTime.toDate(), 'HH:mm')}
                </p>
                {app.notes && (
                  <p className="text-gray-700 mb-1">
                    <strong>הערות:</strong> {app.notes}
                  </p>
                )}

                {app.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
                      onClick={() => updateAppointmentStatus(app.id, 'approved')}
                    >
                      אשרי
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
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
