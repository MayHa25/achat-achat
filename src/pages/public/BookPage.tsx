import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import useStore from '../../store/useStore';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { Service } from '../../types';

const BookPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { ownerId } = useParams<{ ownerId: string }>();
  const { services, setServices } = useStore();

  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      if (!ownerId) return;
      const q = query(collection(db, 'services'), where('businessId', '==', ownerId));
      const snapshot = await getDocs(q);
      const loaded: Service[] = snapshot.docs.map(doc => ({
        ...(doc.data() as Omit<Service, 'id'>),
        id: doc.id,
      }));
      setServices(loaded);
    };

    fetchServices();
  }, [ownerId, setServices]);

  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setAvailableTimes([]);
      return;
    }

    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    ];

    const available = timeSlots.filter((_, index) => index % 3 !== 0);
    setAvailableTimes(available);
  }, [selectedDate, selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ownerId) {
      alert("שגיאה: לא נמצא מזהה של בעלת העסק (ownerId).");
      return;
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!selectedService || !selectedDate || !selectedTime || !name || !phone) {
      alert("חסרים שדות חובה. אנא ודאי שכל המידע מולא.");
      return;
    }

    const datetimeStr = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`;
    const appointmentDate = new Date(datetimeStr);

    if (isNaN(appointmentDate.getTime())) {
      alert(`שעת התור שגויה: ${datetimeStr}`);
      return;
    }

    const service = services.find((s) => s.id === selectedService);

    const appointment = {
      businessId: ownerId,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      serviceId: selectedService,
      serviceName: service?.name || '',
      startTime: Timestamp.fromDate(appointmentDate),
      status: 'pending',
      paymentStatus: 'pending',
      notes,
    };

    try {
      await addDoc(collection(db, 'appointments'), appointment);
      navigate('/confirmation', {
        state: { appointment, client: { name, phone, email, notes }, service },
      });
    } catch (error) {
      console.error('שגיאה בשמירת התור:', error);
      alert('אירעה שגיאה בשמירת התור. נסי שוב.');
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !selectedService;
    if (step === 2) return !selectedDate || !selectedTime;
    if (step === 3) return !name || !phone;
    return false;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6 text-center">{t('book_appointment') || 'קביעת תור'}</h1>

          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {[1, 2, 3].map((i) => (
                <React.Fragment key={i}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= i ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{i}</div>
                  {i < 3 && <div className={`w-16 h-1 ${step > i ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">{t('select_service') || 'בחרי שירות'}</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2"
                  required
                >
                  <option value="">-- בחרי --</option>
                  {services.map((service: Service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {step === 2 && (
              <>
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">{t('select_date') || 'בחרי תאריך'}</label>
                  <Calendar
                    onChange={(date) => setSelectedDate(date as Date)}
                    value={selectedDate}
                    minDate={new Date()}
                    locale="he"
                    className="w-full"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">{t('select_time') || 'בחרי שעה'}</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                    required
                  >
                    <option value="">-- בחרי שעה --</option>
                    {availableTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-1">{t('name') || 'שם מלא'}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-1">{t('phone') || 'טלפון'}</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-1">{t('email') || 'אימייל (לא חובה)'}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-1">{t('notes') || 'הערות'}</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-4 py-2"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end mt-6">
              <button
                type="submit"
                disabled={isNextDisabled()}
                className={`bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors ${isNextDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {step < 3 ? t('next') || 'הבא' : t('book') || 'שלחי תור'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookPage;
