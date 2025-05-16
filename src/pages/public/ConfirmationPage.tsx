import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CheckCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';

// טיפוסי ה-state שמועברים דרך הניווט
interface ConfirmationState {
  appointment: { businessId: string; startTime: any };
  client: { name: string; phone: string };
  service: { name: string };
}

const ConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // ביצוע cast מפורש ל-state ששלחנו
  const { appointment, client, service } = (location.state as ConfirmationState) || {};

  // בדיקת תקינות הנתונים
  if (!appointment || !client || !service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">שגיאה</h1>
          <p className="mb-4 text-gray-700">חסרים נתוני תור. יש לבצע הזמנה מחדש.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  // המרת Firestore Timestamp לאובייקט Date, אם קיים
  if (typeof appointment.startTime === 'object' && 'seconds' in appointment.startTime) {
    appointment.startTime = new Date(appointment.startTime.seconds * 1000);
  }

  const [isProcessing, setIsProcessing] = useState(false);

  const handleFinish = async () => {
    setIsProcessing(true);
    try {
      const sendSMS = httpsCallable(functions, 'sendSmsOnBooking');
      const message =
        `התור שלך בנושא ${service.name} נקבע ל־${format(
          appointment.startTime,
          'dd.MM.yyyy'
        )}, בשעה ${format(appointment.startTime, 'HH:mm')}.
לביטול שלחי את הספרה 1 עד 24 שעות מראש.`;

      await sendSMS({
        phone: client.phone,
        message,
        businessId: appointment.businessId,
        clientName: client.name,
        serviceName: service.name,
        startTime: appointment.startTime,
      });
    } catch (error) {
      console.error('שגיאה בשליחת SMS:', error);
    } finally {
      navigate('/');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <div className="inline-block p-3 bg-success-100 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-success-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">תודה, {client.name}!</h1>
        <p className="text-lg text-gray-600 mb-4">
          התור שלך נקבע ליום {format(appointment.startTime, 'EEEE, d בMMMM yyyy', { locale: he })}
          {' '}בשעה {format(appointment.startTime, 'HH:mm')}.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          שלחנו לך אישור בהודעת טקסט למספר {client.phone}.
        </p>
        <button
          onClick={handleFinish}
          disabled={isProcessing}
          className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          {isProcessing ? 'מעבד...' : 'סיום'}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationPage;