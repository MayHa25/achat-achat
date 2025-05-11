import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import useStore from '../../store/useStore';
import { Timestamp } from 'firebase/firestore';

const AppointmentsPage: React.FC = () => {
  const { user } = useStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.businessId) return;

    const fetchAppointmentsAndServices = async () => {
      try {
        const [appointmentsSnap, servicesSnap] = await Promise.all([
          getDocs(query(collection(db, 'appointments'), where('businessId', '==', user.businessId))),
          getDocs(query(collection(db, 'services'), where('businessId', '==', user.businessId))),
        ]);

        const services: Record<string, string> = {};
        servicesSnap.docs.forEach(doc => {
          services[doc.id] = doc.data().name;
        });
        setServicesMap(services);

        const appointmentsData = appointmentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('שגיאה בטעינת תורים:', error);
      }
    };

    fetchAppointmentsAndServices();
  }, [user?.businessId]);

  const cancelAppointment = async (appointmentId: string) => {
    try {
      await deleteDoc(doc(db, 'appointments', appointmentId));
      setAppointments(prev => prev.filter(app => app.id !== appointmentId));
    } catch (error) {
      console.error('שגיאה בביטול תור:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">רשימת תורים</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {appointments.length === 0 ? (
          <p className="text-gray-600">לא נמצאו תורים.</p>
        ) : (
          <div className="space-y-4">
            {appointments.map(app => {
              const start = (app.startTime as Timestamp).toDate();
              const serviceName = servicesMap[app.serviceId] || 'לא צוין';

              return (
                <div key={app.id} className="border-b border-gray-200 pb-4">
                  <p><strong>שם לקוחה:</strong> {app.clientName}</p>
                  <p><strong>טיפול:</strong> {serviceName}</p>
                  <p><strong>מחיר:</strong> ₪{app.price || 'לא צוין'}</p>
                  <p><strong>תאריך:</strong> {format(start, 'd בMMMM yyyy', { locale: he })}</p>
                  <p><strong>שעה:</strong> {format(start, 'HH:mm')}</p>
                  <button
                    onClick={() => cancelAppointment(app.id)}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    בטלי תור
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
