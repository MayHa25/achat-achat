import React from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '../../store/useStore';

const AppointmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, appointments } = useStore();
  const businessId = user?.businessId;

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

  const filteredAppointments = appointments.filter(app => app.businessId === businessId);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('appointments.title', 'Appointments')}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {filteredAppointments.length === 0 ? (
          <p className="text-gray-600">{t('appointments.noAppointments', 'No appointments found.')}</p>
        ) : (
          <ul className="space-y-4">
            {filteredAppointments.map(app => (
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
