import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import useStore from '../../store/useStore';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Appointment {
  id: string;
  clientName: string;
  serviceName: string;
  date: string | number | Date;
  price: number;
}

const PaymentsPage: React.FC = () => {
  const { user } = useStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user?.businessId) return;

    const fetchAppointments = async () => {
      try {
        const q = query(collection(db, 'appointments'), where('businessId', '==', user.businessId));
        const snapshot = await getDocs(q);
        const all = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];

        const now = new Date();

        const filtered = all.filter(app => {
          const appDate = new Date(app.date);
          return appDate < now && app.price > 0;
        });

        setAppointments(filtered);
      } catch (error) {
        console.error('שגיאה בטעינת תשלומים:', error);
      }
    };

    fetchAppointments();
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
                    {app.serviceName} | {format(new Date(app.date), 'd בMMMM yyyy', { locale: he })}
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
