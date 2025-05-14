import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';
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
  totalVisits?: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useStore();

  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    todayAppointments: 0,
    totalAppointments: 0,
    monthlyIncome: 0,
    completionRate: 0,
  });

  useEffect(() => {
    if (!user?.businessId) return;

    const fetchData = async () => {
      try {
        const clientsQuery = query(collection(db, 'clients'), where('businessId', '==', user.businessId));
        const clientsSnap = await getDocs(clientsQuery);
        const fetchedClients = clientsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];

        const appointmentsQuery = query(collection(db, 'appointments'), where('businessId', '==', user.businessId));
        const appointmentsSnap = await getDocs(appointmentsQuery);
        const fetchedAppointments = appointmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];

        setClients(fetchedClients);
        setAppointments(fetchedAppointments);

        const currentMonthIncome = fetchedAppointments
          .filter(app => {
            const appDate = (app.startTime as any).toDate();
            const now = new Date();
            return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum, app) => sum + (app.price || 0), 0);

        const total = fetchedAppointments.length;
        const confirmed = fetchedAppointments.filter(app => app.status === 'confirmed').length;
        const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

        setStats({
          totalClients: fetchedClients.length,
          todayAppointments: fetchedAppointments.filter(app =>
            (app.startTime as any).toDate().toDateString() === new Date().toDateString()
          ).length,
          totalAppointments: total,
          monthlyIncome: currentMonthIncome,
          completionRate: rate,
        });
      } catch (error) {
        console.error('שגיאה בטעינת דאשבורד:', error);
      }
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          שלום {user?.name || 'ישראל'}!
        </h1>
        <p className="text-gray-600">
          הנה סקירה של העסק שלך להיום, {format(new Date(), 'EEEE, d בMMMM yyyy', { locale: he })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[{
          title: 'תורים היום',
          value: stats.todayAppointments,
          icon: <Calendar className="w-8 h-8 text-primary-200" />,
          color: 'from-primary-600 to-primary-700'
        }, {
          title: 'סה"כ לקוחות',
          value: stats.totalClients,
          icon: <Users className="w-8 h-8 text-primary-200" />,
          color: 'from-secondary-600 to-secondary-700'
        }, {
          title: 'הכנסה חודשית',
          value: `₪${stats.monthlyIncome}`,
          icon: <CreditCard className="w-8 h-8 text-primary-200" />,
          color: 'from-success-600 to-success-700'
        }, {
          title: 'אחוז השלמת תורים',
          value: `${stats.completionRate}%`,
          icon: <TrendingUp className="w-8 h-8 text-primary-200" />,
          color: 'from-accent-600 to-accent-700'
        }].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-r ${stat.color} rounded-lg p-6 text-white shadow flex justify-between items-center`}>
            <div>
              <p className="text-sm text-white opacity-80">{stat.title}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className="p-3 rounded-full bg-white bg-opacity-20">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">תורים קרובים</h2>
          </div>
          <div className="p-4">
            {upcomingAppointments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {upcomingAppointments.map(app => (
                  <div key={app.id} className="py-4 px-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{app.clientName}</p>
                        <p className="text-sm text-gray-600">{app.serviceName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{format((app.startTime as any).toDate(), 'HH:mm')}</p>
                        <div className="flex items-center mt-1">
                          {app.status === 'confirmed' ? (
                            <CheckCircle className="w-4 h-4 text-success-500 mr-1" />
                          ) : (
                            <Clock className="w-4 h-4 text-warning-500 mr-1" />
                          )}
                          <span className={`text-xs ${app.status === 'confirmed' ? 'text-success-600' : 'text-warning-600'}`}>
                            {app.status === 'confirmed' ? 'מאושר' : 'ממתין'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">אין תורים קרובים</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">לקוחות אחרונים</h2>
          </div>
          <div className="p-4">
            {recentClients.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentClients.map(client => (
                  <div key={client.id} className="py-4 px-2">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-gray-600">{client.phone}</p>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>ביקור אחרון: {client.lastVisit?.seconds ? format(new Date(client.lastVisit.seconds * 1000), 'd בMMM', { locale: he }) : 'לא ידוע'}</span>
                      <span>{client.totalVisits || 0} ביקורים</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">אין לקוחות להצגה</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
