import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import useStore from '../../store/useStore';

const BookPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { services, appointments, availabilities } = useStore();
  
  // Form state
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  
  // Available times for selected date
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  
  // Calculate available times based on selected date and service
  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setAvailableTimes([]);
      return;
    }
    
    // This would normally be calculated based on availabilities, blocked times, and existing appointments
    // For demo purposes, we'll generate some times
    const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
                      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
    
    // Filter out times that would be unavailable
    // In a real implementation, this would check against actual availabilities and appointments
    const available = timeSlots.filter((_, index) => {
      // For demo, make some times unavailable
      return index % 3 !== 0;
    });
    
    setAvailableTimes(available);
  }, [selectedDate, selectedService, availabilities, appointments]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    // In a real app, we would save the appointment to the database here
    const service = services.find(s => s.id === selectedService);
    
    // Create appointment object
    const appointment = {
      id: Math.random().toString(36).substring(2, 9),
      businessId: "business-1",
      clientId: "client-new",
      serviceId: selectedService,
      startTime: new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`),
      endTime: new Date(),  // This would be calculated based on service duration
      status: "pending" as const,
      notes: notes,
      paymentStatus: "pending" as const
    };

    const client = {
      id: "client-new",
      businessId: "business-1",
      name: name,
      phone: phone,
      email: email,
      notes: notes,
      created: new Date()
    };
    
    // Navigate to confirmation page with appointment details
    navigate('/confirmation', { 
      state: { 
        appointment,
        client,
        service
      } 
    });
  };
  
  const isNextDisabled = () => {
    if (step === 1) {
      return !selectedService;
    } else if (step === 2) {
      return !selectedDate || !selectedTime;
    } else if (step === 3) {
      return !name || !phone;
    }
    return false;
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6 text-center">{t('book_appointment')}</h1>
          
          {/* Step indicator */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {[1, 2, 3].map(i => (
                <React.Fragment key={i}>
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step >= i 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {i}
                  </div>
                  {i < 3 && (
                    <div className={`w-16 h-1 ${step > i ? 'bg-primary-600' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Step 1: Select Service */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-semibold mb-4">{t('select_service')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* For demo purposes, we'll use mock services */}
                  {[
                    { id: 'service1', name: 'טיפול פנים', duration: 60, price: 250 },
                    { id: 'service2', name: 'עיסוי שוודי', duration: 45, price: 200 },
                    { id: 'service3', name: 'טיפול רפלקסולוגיה', duration: 60, price: 220 },
                    { id: 'service4', name: 'מניקור', duration: 30, price: 120 }
                  ].map(service => (
                    <div 
                      key={service.id}
                      className={`border rounded-lg p-4 cursor-pointer hover:border-primary-500 transition-colors ${
                        selectedService === service.id 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedService(service.id)}
                    >
                      <h3 className="font-medium mb-2">{service.name}</h3>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{service.duration} דקות</span>
                        <span>₪{service.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Step 2: Select Date & Time */}
            {step === 2 && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-semibold mb-4">{t('select_date')}</h2>
                
                <div className="mb-8">
                  <Calendar
                    onChange={setSelectedDate}
                    value={selectedDate}
                    minDate={new Date()}
                    className="mx-auto rounded-lg overflow-hidden border border-gray-200"
                  />
                </div>
                
                <h2 className="text-xl font-semibold mb-4">{t('select_time')}</h2>
                
                {availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-6">
                    {availableTimes.map(time => (
                      <button
                        key={time}
                        type="button"
                        className={`py-2 px-4 rounded border ${
                          selectedTime === time
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 mb-6">{t('no_available_times')}</p>
                )}
              </div>
            )}
            
            {/* Step 3: Personal Details */}
            {step === 3 && (
              <div className="animate-fadeIn">
                <h2 className="text-xl font-semibold mb-4">{t('your_details')}</h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 mb-1">{t('full_name')}</label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-gray-700 mb-1">{t('phone')}</label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-gray-700 mb-1">{t('email')} (אופציונלי)</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="notes" className="block text-gray-700 mb-1">{t('notes')} (אופציונלי)</label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-24"
                    />
                  </div>
                </div>
                
                {/* Booking summary */}
                <div className="bg-gray-50 p-4 rounded-md mb-6">
                  <h3 className="font-medium mb-2">{t('booking_summary')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">{t('appointment_service')}: </span>
                      {services.find(s => s.id === selectedService)?.name || 'טיפול פנים'}
                    </p>
                    <p><span className="font-medium">{t('appointment_date')}: </span>
                      {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
                    </p>
                    <p><span className="font-medium">{t('appointment_time')}: </span>{selectedTime}</p>
                    <p><span className="font-medium">{t('appointment_price')}: </span>
                      ₪{services.find(s => s.id === selectedService)?.price || 250}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 bg-white text-primary-600 border border-primary-600 rounded-md hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {t('back')}
                </button>
              ) : (
                <div></div>
              )}
              
              <button
                type="submit"
                disabled={isNextDisabled()}
                className={`px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  isNextDisabled() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {step === 3 ? t('confirm_booking') : t('next')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookPage;