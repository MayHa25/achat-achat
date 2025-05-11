import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';

const SettingsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-semibold text-gray-900">{t('settings.title', 'Settings')}</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">{t('settings.general', 'General Settings')}</h2>
          
          {/* Settings content will go here */}
          <p className="text-gray-600">{t('settings.comingSoon', 'Settings configuration coming soon')}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;