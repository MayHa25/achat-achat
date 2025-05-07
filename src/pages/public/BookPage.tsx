import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import useStore from '../../store/useStore';
import { db } from '../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const BookPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { ownerId } = useParams<{ ownerId: string }>();
  const { services, appointments, availabilities } = useStore();

  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setAvailableTimes([]);
      return;
    }

    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    const available = timeSlots.filter((_, index) => index % 3 !== 0);
    setAvailableTimes(available);
  }, [selectedDate, selectedService, availabilities, appointments]);

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

    const service = services.find(s => s.id === selectedService);

    const appointment = {
      businessId: ownerId,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      serviceId: selectedService,
      serviceName: service?.name || '',
      startTime: Timestamp.fromDate(new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`)),
      status: 'pending',
      paymentStatus: 'pending',
      notes
    };

    try {
      await addDoc(collection(db, 'appointments'), appointment);

      navigate('/confirmation', {
        state: { appointment, client: { name, phone, email, notes }, service }
      });
    } catch (error) {
      console.error('שגיאה בשמירת התור:', error);
      alert('אירעה שגיאה בשמירת התור. נסה שוב.');
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
          <h1 className="text-2xl font-bold mb-6 text-center">{t('book_appointment')}</h1>
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {[1, 2, 3].map(i => (
                <React.Fragment key={i}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= i ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{i}</div>
                  {i < 3 && <div className={`w-16 h-1 ${step > i ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* All steps rendering remain unchanged */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookPage;
