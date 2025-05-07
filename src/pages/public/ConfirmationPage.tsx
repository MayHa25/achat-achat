import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Check, CreditCard } from 'lucide-react';

const ConfirmationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the appointment data passed from BookPage with default values
  const { appointment, client, service } = location.state || {
    appointment: null,
    client: null,
    service: null
  };
  
  const [paymentMethod, setPaymentMethod] = useState<string>('credit');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, we would process the payment here
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Navigate to thank you page
      navigate('/thank-you', { 
        state: { 
          appointment,
          client,
          service,
          paymentMethod 
        } 
      });
    }, 1500);
  };
  
  if (!appointment || !client || !service) {
    // Handle the case where the user navigated directly to this page without an appointment
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">{t('error_general')}</h1>
          <p className="mb-4">לא נמצאו פרטי הזמנה. אנא חזור לדף הזמנת התור.</p>
          <button
            onClick={() => navigate('/book')}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            חזרה לדף הזמנת התור
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-success-100 rounded-full mb-2">
              <Check className="w-8 h-8 text-success-600" />
            </div>
            <h1 className="text-2xl font-bold">{t('appointment_booked')}</h1>
            <p className="text-gray-600">כעת תוכל לבצע תשלום עבור התור שהזמנת</p>
          </div>
          
          {/* Appointment details */}
          <div className="bg-gray-50 p-4 rounded-md mb-8">
            <h2 className="font-semibold text-lg mb-4">{t('confirmation_details')}</h2>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span className="text-gray-600">{t('appointment_service')}:</span>
                <span className="font-medium">{service.name}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">{t('appointment_date')}:</span>
                <span className="font-medium">
                  {format(appointment.startTime, 'EEEE, d בMMMM yyyy', { locale: he })}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">{t('appointment_time')}:</span>
                <span className="font-medium">{format(appointment.startTime, 'HH:mm')}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">{t('client_name')}:</span>
                <span className="font-medium">{client.name}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">{t('phone')}:</span>
                <span className="font-medium">{client.phone}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">{t('appointment_price')}:</span>
                <span className="font-medium">₪{service.price}</span>
              </p>
            </div>
          </div>
          
          {/* Payment form */}
          <div>
            <h2 className="font-semibold text-lg mb-4">{t('payment_title')}</h2>
            
            <form onSubmit={handlePayment}>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">{t('payment_method')}</p>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit"
                      checked={paymentMethod === 'credit'}
                      onChange={() => setPaymentMethod('credit')}
                      className="mr-2"
                    />
                    <span>{t('credit_card')}</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bit"
                      checked={paymentMethod === 'bit'}
                      onChange={() => setPaymentMethod('bit')}
                      className="mr-2"
                    />
                    <span>{t('bit')}</span>
                  </label>
                </div>
              </div>
              
              {paymentMethod === 'credit' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="cardNumber" className="block text-gray-700 mb-1">{t('card_number')}</label>
                    <input
                      id="cardNumber"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiryDate" className="block text-gray-700 mb-1">{t('expiration_date')}</label>
                      <input
                        id="expiryDate"
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="cvv" className="block text-gray-700 mb-1">{t('cvv')}</label>
                      <input
                        id="cvv"
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'bit' && (
                <div className="p-6 border border-gray-200 rounded-md mb-6 text-center">
                  <p className="mb-4">שלח תשלום באמצעות ביט למספר:</p>
                  <p className="text-xl font-bold mb-2">050-1234567</p>
                  <p className="text-gray-500">נא לציין את שמך ותאריך התור בהערות</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  isProcessing ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? t('loading') : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {t('proceed_to_payment')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;