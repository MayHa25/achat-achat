// src/pages/admin/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Users, Calendar, CreditCard } from 'lucide-react';
import useStore from '../../store/useStore';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Appointment {
  id: string;
  startTime: any;
  price: number;
  status: string;
  clientName?: string;
  serviceName?: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  lastVisit?: { seconds: number };
  visitCount?: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useStore();

  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    todayAppointments: 0,
    monthlyIncome: 0,
  });

  useEffect(() => {
    if (!user?.businessId) return;

    const fetchData = async () => {
      const clientsSnap = await getDocs(
        query(collection(db, 'clients'), where('businessId', '==', user.businessId))
      );
      const fetchedClients = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Client[];

      const apptsSnap = await getDocs(
        query(collection(db, 'appointments'), where('businessId', '==', user.businessId))
      );
      const fetchedAppointments = apptsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[];

      setClients(fetchedClients);
      setAppointments(fetchedAppointments);

      // חישובי סטטיסטיקות
      const now = new Date();
      const todayCount = fetchedAppointments.filter(app =>
        (app.startTime as any).toDate().toDateString() === now.toDateString()
      ).length;

      const monthIncome = fetchedAppointments
        .filter(app => {
          const dt = (app.startTime as any).toDate();
          return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
        })
        .reduce((sum, app) => sum + (app.price || 0), 0);

      setStats({
        totalClients: fetchedClients.length,
        todayAppointments: todayCount,
        monthlyIncome: monthIncome,
      });
    };

    fetchData();
  }, [user?.businessId]);

  const upcomingAppointments = appointments
    .filter(app => (app.startTime as any).toDate() >= new Date())
    .sort((a, b) => (a.startTime as any).toDate().getTime() - (b.startTime as any).toDate().getTime())
    .slice(0, 3);

  const recentClients = clients
    .sort((a, b) => (b.lastVisit?.seconds || 0) - (a.lastVisit?.seconds || 0))
    .slice(0, 3);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          שלום {user?.name || 'ישראל'}!
        </h1>
        <p className="text-gray-600">
          סקירה ליום {format(new Date(), 'EEEE, d בMMMM yyyy', { locale: he })}
        </p>
      </div>

      {/* שלושה כרטיסי מידע בלבד */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          {
            title: 'תורים היום',
            value: stats.todayAppointments,
            icon: <Calendar className="w-8 h-8 text-primary-200" />,
            color: 'from-primary-600 to-primary-700'
          },
          {
            title: 'סה"כ לקוחות',
            value: stats.totalClients,
            icon: <Users className="w-8 h-8 text-secondary-200" />,
            color: 'from-secondary-600 to-secondary-700'
          },
          {
            title: 'הכנסה חודשית',
            value: `₪${stats.monthlyIncome}`,
            icon: <CreditCard className="w-8 h-8 text-success-200" />,
            color: 'from-success-600 to-success-700'
          }
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-gradient-to-r ${stat.color} rounded-lg p-6 text-white shadow flex justify-between items-center`}
          >
            <div>
              <p className="text-sm opacity-80">{stat.title}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className="p-3 rounded-full bg-white bg-opacity-20">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* תורים קרובים */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">תורים קרובים</h2>
          </div>
          <div className="p-4">
            {upcomingAppointments.length ? (
              <div className="divide-y">
                {upcomingAppointments.map(app => (
                  <div key={app.id} className="py-4 flex justify-between">
                    <div>
                      <p className="font-medium">{app.clientName}</p>
                      <p className="text-sm text-gray-600">{app.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {format((app.startTime as any).toDate(), 'HH:mm')}
                      </p>
                      <span
                        className={`text-xs mt-1 inline-block ${
                          app.status === 'confirmed' ? 'text-success-600' : 'text-warning-600'
                        }`}
                      >
                        {app.status === 'confirmed' ? 'מאושר' : 'ממתין'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">אין תורים קרובים</p>
            )}
          </div>
        </div>

        {/* לקוחות אחרונים */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">לקוחות אחרונים</h2>
          </div>
          <div className="p-4">
            {recentClients.length ? (
              <div className="divide-y">
                {recentClients.map(client => (
                  <div key={client.id} className="py-4">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-gray-600">{client.phone}</p>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>
                        ביקור אחרון:{' '}
                        {client.lastVisit?.seconds
                          ? format(
                              new Date(client.lastVisit.seconds * 1000),
                              'd בMMM',
                              { locale: he }
                            )
                          : 'לא ידוע'}
                      </span>
                      <span>{client.visitCount || 0} ביקורים</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">אין לקוחות להצגה</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
