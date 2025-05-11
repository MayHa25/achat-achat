import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Users, Calendar, CreditCard, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import useStore from '../../store/useStore';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, appointments, clients } = useStore();
  
  // For demo purposes, let's create some mock stats
  const stats = {
    totalClients: clients.length || 76,
    todayAppointments: 5,
    totalAppointments: appointments.length || 32,
    monthlyIncome: 8750,
    completionRate: 92,
  };
  
  // Mock upcoming appointments
  const upcomingAppointments = [
    {
      id: 'appt-1',
      clientName: 'שירה לוי',
      serviceName: 'טיפול פנים',
      startTime: new Date(new Date().setHours(new Date().getHours() + 1)),
      status: 'confirmed'
    },
    {
      id: 'appt-2',
      clientName: 'דני כהן',
      serviceName: 'עיסוי שוודי',
      startTime: new Date(new Date().setHours(new Date().getHours() + 3)),
      status: 'confirmed'
    },
    {
      id: 'appt-3',
      clientName: 'מיכל ברקוביץ',
      serviceName: 'מניקור',
      startTime: new Date(new Date().setHours(new Date().getHours() + 5)),
      status: 'pending'
    }
  ];
  
  // Mock recent clients
  const recentClients = [
    {
      id: 'client-1',
      name: 'שירה לוי',
      phone: '050-1234567',
      lastVisit: new Date(new Date().setDate(new Date().getDate() - 2)),
      totalVisits: 5
    },
    {
      id: 'client-2',
      name: 'דני כהן',
      phone: '052-7654321',
      lastVisit: new Date(new Date().setDate(new Date().getDate() - 7)),
      totalVisits: 3
    },
    {
      id: 'client-3',
      name: 'רונית אביב',
      phone: '054-9876543',
      lastVisit: new Date(new Date().setDate(new Date().getDate() - 14)),
      totalVisits: 12
    }
  ];
  
  return (
    <div>
      {/* Welcome message */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('welcome_message', { name: user?.name || 'ישראל' })}
        </h1>
        <p className="text-gray-600">
          הנה סקירה של העסק שלך להיום, {format(new Date(), 'EEEE, d בMMMM yyyy', { locale: he })}
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: t('today_appointments'),
            value: stats.todayAppointments,
            icon: <Calendar className="w-8 h-8 text-primary-200" />,
            color: 'from-primary-600 to-primary-700'
          },
          {
            title: t('total_clients'),
            value: stats.totalClients,
            icon: <Users className="w-8 h-8 text-primary-200" />,
            color: 'from-secondary-600 to-secondary-700'
          },
          {
            title: t('monthly_income'),
            value: `₪${stats.monthlyIncome}`,
            icon: <CreditCard className="w-8 h-8 text-primary-200" />,
            color: 'from-success-600 to-success-700'
          },
          {
            title: 'אחוז השלמת תורים',
            value: `${stats.completionRate}%`,
            icon: <TrendingUp className="w-8 h-8 text-primary-200" />,
            color: 'from-accent-600 to-accent-700'
          }
        ].map((stat, index) => (
          <div 
            key={index} 
            className={`bg-gradient-to-r ${stat.color} rounded-lg p-6 text-white shadow flex justify-between items-center`}
          >
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
      
      {/* Today's appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{t('today_appointments')}</h2>
            </div>
            <div className="p-4">
              {upcomingAppointments.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="py-4 px-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{appointment.clientName}</p>
                          <p className="text-sm text-gray-600">{appointment.serviceName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {format(appointment.startTime, 'HH:mm')}
                          </p>
                          <div className="flex items-center mt-1">
                            {appointment.status === 'confirmed' ? (
                              <CheckCircle className="w-4 h-4 text-success-500 mr-1" />
                            ) : (
                              <Clock className="w-4 h-4 text-warning-500 mr-1" />
                            )}
                            <span className={`text-xs ${
                              appointment.status === 'confirmed' 
                                ? 'text-success-600' 
                                : 'text-warning-600'
                            }`}>
                              {appointment.status === 'confirmed' 
                                ? t('status_confirmed') 
                                : t('status_pending')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">אין תורים נוספים להיום</p>
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <a href="#" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                צפה בכל התורים
              </a>
            </div>
          </div>
        </div>
        
        {/* Recent clients */}
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">לקוחות אחרונים</h2>
            </div>
            <div className="p-4">
              {recentClients.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentClients.map((client) => (
                    <div key={client.id} className="py-4 px-2">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-600">{client.phone}</p>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>ביקור אחרון: {format(client.lastVisit, 'd בMMM', { locale: he })}</span>
                        <span>{client.totalVisits} ביקורים</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">אין לקוחות להצגה</p>
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <a href="#" className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                צפה בכל הלקוחות
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;