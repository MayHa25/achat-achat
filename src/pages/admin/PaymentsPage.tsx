import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import useStore from '../../store/useStore';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Appointment {
  id: string;
  clientName: string;
  serviceId: string;
  startTime: Timestamp;
  price: number;
}

const PaymentsPage: React.FC = () => {
  const { user } = useStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.businessId) return;

    const fetchData = async () => {
      try {
        const appointmentsQuery = query(collection(db, 'appointments'), where('businessId', '==', user.businessId));
        const servicesQuery = query(collection(db, 'services'), where('businessId', '==', user.businessId));

        const [appointmentsSnap, servicesSnap] = await Promise.all([
          getDocs(appointmentsQuery),
          getDocs(servicesQuery)
        ]);

        const services: Record<string, string> = {};
        servicesSnap.docs.forEach(doc => {
          services[doc.id] = doc.data().name;
        });
        setServicesMap(services);

        const now = new Date();

        const filtered = appointmentsSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }) as Appointment)
          .filter(app => {
            const appDate = app.startTime?.toDate?.();
            return appDate && appDate < now && app.price > 0;
          });

        setAppointments(filtered);
      } catch (error) {
        console.error('שגיאה בטעינת תשלומים:', error);
      }
    };

    fetchData();
  }, [user?.businessId]);

  const totalIncome = appointments.reduce((sum, app) => sum + (app.price || 0), 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ניהול תשלומים</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-lg font-medium mb-4">
          סך הכל הכנסות מתורים שהתקיימו: <span className="text-green-600">₪{totalIncome}</span>
        </p>

        {appointments.length === 0 ? (
          <p className="text-gray-600">אין תורים שהסתיימו עם תשלום.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {appointments.map(app => (
              <li key={app.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{app.clientName}</p>
                  <p className="text-sm text-gray-500">
                    {servicesMap[app.serviceId] || 'שירות לא ידוע'} |{' '}
                    {format(app.startTime.toDate(), 'd בMMMM yyyy', { locale: he })}
                  </p>
                </div>
                <span className="font-bold text-green-700">₪{app.price}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
