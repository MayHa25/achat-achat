import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CheckCircle, Calendar, CreditCard, ArrowLeft } from 'lucide-react';

const ThankYouPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  // Get the data passed from ConfirmationPage
  const { appointment, client, service, paymentMethod } = location.state || {
    appointment: null,
    client: null,
    service: { name: 'טיפול פנים', price: 250 },
    paymentMethod: 'credit'
  };
  
  if (!appointment || !client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">{t('error_general')}</h1>
          <p className="mb-4">לא נמצאו פרטי הזמנה. אנא חזור לדף הזמנת התור.</p>
          <Link
            to="/book"
            className="block w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-center"
          >
            חזרה לדף הזמנת התור
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-success-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-success-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('thank_you_message')}</h1>
            <p className="text-lg text-gray-600">
              התור שלך נקבע בהצלחה והתשלום התקבל. שלחנו לך אישור בהודעת טקסט למספר {client.phone}.
            </p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="flex items-center border-b border-gray-200 pb-4 mb-4">
              <Calendar className="w-5 h-5 text-primary-600 ml-3" />
              <h2 className="text-xl font-semibold">{t('appointment_details')}</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('appointment_service')}:</span>
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('appointment_date')}:</span>
                <span className="font-medium">
                  {format(appointment.startTime, 'EEEE, d בMMMM yyyy', { locale: he })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('appointment_time')}:</span>
                <span className="font-medium">{format(appointment.startTime, 'HH:mm')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('client_name')}:</span>
                <span className="font-medium">{client.name}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="flex items-center border-b border-gray-200 pb-4 mb-4">
              <CreditCard className="w-5 h-5 text-primary-600 ml-3" />
              <h2 className="text-xl font-semibold">{t('payment_details')}</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment_method')}:</span>
                <span className="font-medium">{paymentMethod === 'credit' ? t('credit_card') : t('bit')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment_amount')}:</span>
                <span className="font-medium">₪{service.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('payment_status')}:</span>
                <span className="font-medium text-success-600">{t('payment_status_paid')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">מספר חשבונית:</span>
                <span className="font-medium">INV-{Math.floor(Math.random() * 10000)}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 ml-2" />
              חזור לדף הבית
            </Link>
          </div>
        </div>
        
        <div className="bg-primary-50 border border-primary-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-primary-800 mb-3">הערות חשובות:</h2>
          <ul className="list-disc list-inside space-y-2 text-primary-700">
            <li>נא להגיע 10 דקות לפני התור</li>
            <li>אם יש צורך לבטל או לשנות את התור, יש להודיע לפחות 24 שעות מראש</li>
            <li>נקבל תזכורת שעה לפני התור</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;