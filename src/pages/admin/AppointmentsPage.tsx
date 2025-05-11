import React from 'react';
import { useTranslation } from 'react-i18next';

const AppointmentsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('appointments.title', 'Appointments')}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">{t('appointments.noAppointments', 'No appointments found.')}</p>
      </div>
    </div>
  );
};

export default AppointmentsPage;