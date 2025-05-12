import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';

const ConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { appointment, client, service } = location.state || {};

  // המרת Timestamp ל-Date
  if (
    appointment &&
    appointment.startTime &&
    typeof appointment.startTime === 'object' &&
    appointment.startTime.seconds
  ) {
    appointment.startTime = new Date(appointment.startTime.seconds * 1000);
  }

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);

  if (!appointment || !client || !service || !appointment.startTime) {
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

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const sendSMS = httpsCallable(functions, 'sendSmsOnBooking');
      const businessId = appointment.businessId;

      const message = `התור שלך בנושא ${service.name} נקבע ל־${format(appointment.startTime, 'dd.MM.yyyy')}, בשעה ${format(appointment.startTime, 'HH:mm')}.
לביטול שלחי את הספרה 1 עד 24 שעות מראש.`;

      await sendSMS({
        phone: client.phone,
        message,
        businessId,
        clientName: client.name,
        serviceName: service.name,
        startTime: appointment.startTime,
      });

      setPaymentCompleted(true);
    } catch (error) {
      console.error('שגיאה בשליחת SMS:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!paymentCompleted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-success-100 rounded-full mb-2">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h1 className="text-2xl font-bold">התור שלך נקבע בהצלחה</h1>
              <p className="text-gray-600">
                ליום {format(appointment.startTime, 'EEEE, d בMMMM yyyy', { locale: he })} בשעה {format(appointment.startTime, 'HH:mm')}
              </p>
              <p className="text-sm text-gray-500 mt-1">אנא בצעי תשלום באמצעות Bit</p>
            </div>

            <form onSubmit={handlePayment}>
              <div className="p-4 border border-gray-200 rounded mb-6 text-center">
                <p className="mb-2">שלחי תשלום באמצעות Bit למספר:</p>
                <p className="text-xl font-bold">050-1234567</p>
                <a
                  href="https://bitpay.co.il/pay/0501234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-700 underline mt-2 block"
                >
                  מעבר לתשלום ב-Bit
                </a>
                <p className="text-gray-500 mt-2">נא לציין את שמך ותאריך התור בהערות</p>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700"
              >
                {isProcessing ? 'מעבד...' : 'סיום'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <div className="inline-block p-3 bg-success-100 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-success-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">תודה {client.name}!</h1>
        <p className="text-lg text-gray-600">
          תורך נקבע ליום {format(appointment.startTime, 'EEEE, d בMMMM yyyy', { locale: he })} בשעה {format(appointment.startTime, 'HH:mm')}.
          <br />
          שלחנו לך אישור בהודעת טקסט למספר {client.phone}.
        </p>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <ArrowLeft className="w-5 h-5 ml-2" /> חזרה לדף הבית
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
