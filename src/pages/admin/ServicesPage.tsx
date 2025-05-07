import React from 'react';
import { useTranslation } from 'react-i18next';

const ServicesPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('services.title', 'Services')}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">{t('services.description', 'Manage your services here')}</p>
      </div>
    </div>
  );
};

export default ServicesPage;