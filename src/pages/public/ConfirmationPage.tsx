import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CheckCircle, Calendar, CreditCard, ArrowLeft } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';

const ConfirmationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { appointment, client, service } = location.state || {};

  // תיקון - המרה ידנית מ-Timestamp ל-Date
  if (
    appointment &&
    appointment.startTime &&
    typeof appointment.startTime === 'object' &&
    appointment.startTime.seconds
  ) {
    appointment.startTime = new Date(appointment.startTime.seconds * 1000);
  }

  const [paymentMethod, setPaymentMethod] = useState<string>('credit');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
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
      const businessName = 'מאי חכימי';

      const message = `התור שלך בנושא ${service.name} אצל ${businessName} נקבע ל־${format(appointment.startTime, 'dd.MM.yyyy')}, ${format(appointment.startTime, 'HH:mm')}.
לביטול שלחי את הספרה 1 עד 24 שעות מראש.`;

      await sendSMS({ phone: client.phone, message });
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
              <p className="text-sm text-gray-500 mt-1">אנא בחרי שיטת תשלום והמשיכי</p>
            </div>

            <form onSubmit={handlePayment}>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">שיטת תשלום</p>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input type="radio" value="credit" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} className="mr-2" />
                    <span>כרטיס אשראי</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" value="bit" checked={paymentMethod === 'bit'} onChange={() => setPaymentMethod('bit')} className="mr-2" />
                    <span>ביט</span>
                  </label>
                </div>
              </div>

              {paymentMethod === 'credit' && (
                <div className="space-y-4 mb-6">
                  <input type="text" placeholder="XXXX XXXX XXXX XXXX" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full border rounded px-4 py-2" required />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="MM/YY" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full border rounded px-4 py-2" required />
                    <input type="text" placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value)} className="w-full border rounded px-4 py-2" required />
                  </div>
                </div>
              )}

              {paymentMethod === 'bit' && (
                <div className="p-4 border border-gray-200 rounded mb-6 text-center">
                  <p className="mb-2">שלחי תשלום באמצעות ביט למספר:</p>
                  <p className="text-xl font-bold">050-1234567</p>
                  <p className="text-gray-500">נא לציין את שמך ותאריך התור בהערות</p>
                </div>
              )}

              <button type="submit" disabled={isProcessing} className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700">
                {isProcessing ? 'מעבד תשלום...' : 'אשרי תשלום וסיום'}
              </button>
            </form>
          </div>
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
            <h1 className="text-3xl font-bold mb-2">תודה {client.name}!</h1>
            <p className="text-lg text-gray-600">
              תורך נקבע ליום {format(appointment.startTime, 'EEEE, d בMMMM yyyy', { locale: he })} בשעה {format(appointment.startTime, 'HH:mm')}.
              <br />
              שלחנו לך אישור בהודעת טקסט למספר {client.phone}.
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="flex items-center border-b border-gray-200 pb-4 mb-4">
              <Calendar className="w-5 h-5 text-primary-600 ml-3" />
              <h2 className="text-xl font-semibold">{t('appointment_details')}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-600">{t('appointment_service')}:</span><span className="font-medium">{service.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">{t('appointment_date')}:</span><span className="font-medium">{format(appointment.startTime, 'EEEE, d בMMMM yyyy', { locale: he })}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">{t('appointment_time')}:</span><span className="font-medium">{format(appointment.startTime, 'HH:mm')}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">{t('client_name')}:</span><span className="font-medium">{client.name}</span></div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="flex items-center border-b border-gray-200 pb-4 mb-4">
              <CreditCard className="w-5 h-5 text-primary-600 ml-3" />
              <h2 className="text-xl font-semibold">{t('payment_details')}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-600">{t('payment_method')}:</span><span className="font-medium">{paymentMethod === 'credit' ? t('credit_card') : t('bit')}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">{t('payment_amount')}:</span><span className="font-medium">₪{service.price}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">{t('payment_status')}:</span><span className="font-medium text-success-600">{t('payment_status_paid')}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">מספר חשבונית:</span><span className="font-medium">INV-{Math.floor(Math.random() * 10000)}</span></div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <ArrowLeft className="w-5 h-5 ml-2" /> חזרה לדף הבית
            </button>
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

export default ConfirmationPage;
