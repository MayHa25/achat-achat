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
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

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

  const groupedByClient = appointments.reduce<Record<string, Appointment[]>>((acc, app) => {
    if (!acc[app.clientName]) acc[app.clientName] = [];
    acc[app.clientName].push(app);
    return acc;
  }, {});

  const toggleExpand = (clientName: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientName]: !prev[clientName]
    }));
  };

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
            {Object.entries(groupedByClient).map(([clientName, clientAppointments]) => {
              const total = clientAppointments.reduce((sum, app) => sum + (app.price || 0), 0);
              const isExpanded = expandedClients[clientName];

              return (
                <li key={clientName} className="py-3">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(clientName)}>
                    <p className="font-semibold text-lg">{clientName}</p>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-green-700">₪{total}</span>
                      <span className="text-blue-600 text-sm underline">
                        {isExpanded ? 'סגור' : 'צפייה'}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <ul className="mt-3 space-y-2 bg-gray-50 p-3 rounded">
                      {clientAppointments.map(app => (
                        <li key={app.id} className="flex justify-between items-center text-sm">
                          <div>
                            <p>{servicesMap[app.serviceId] || 'שירות לא ידוע'}</p>
                            <p className="text-gray-500">
                              {format(app.startTime.toDate(), 'd בMMMM yyyy', { locale: he })}
                            </p>
                          </div>
                          <span className="text-green-600 font-medium">₪{app.price}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
