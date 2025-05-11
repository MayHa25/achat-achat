import React from 'react';
import { useTranslation } from 'react-i18next';

const ClientsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">{t('clients.title', 'Clients')}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        {/* Client list will be implemented here */}
        <p className="text-gray-600">{t('clients.noClients', 'No clients found.')}</p>
      </div>
    </div>
  );
};

export default ClientsPage;