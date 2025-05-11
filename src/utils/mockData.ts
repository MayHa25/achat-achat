import useStore from '../store/useStore';

export const loadMockData = () => {
  const store = useStore.getState();
  
  // Set mock business
  store.setBusiness({
    id: 'business-1',
    name: 'קליניקת היופי של מיכל',
    ownerId: 'user-1',
    address: 'רחוב הרצל 123, תל אביב',
    phone: '03-1234567',
    email: 'info@beauty-clinic.co.il',
    logo: '',
    description: 'קליניקת יופי וטיפוח מתקדמת',
    businessType: 'beauty'
  });
  
  // Set mock services
  store.setServices([
    { 
      id: 'service-1', 
      businessId: 'business-1', 
      name: 'טיפול פנים', 
      description: 'טיפול פנים מקיף לניקוי וחידוש העור', 
      duration: 60, 
      price: 250, 
      active: true 
    },
    { 
      id: 'service-2', 
      businessId: 'business-1', 
      name: 'עיסוי שוודי', 
      description: 'עיסוי מרגיע לשחרור מתחים', 
      duration: 45, 
      price: 200, 
      active: true 
    },
    { 
      id: 'service-3', 
      businessId: 'business-1', 
      name: 'מניקור', 
      description: 'טיפול ידיים וציפורניים', 
      duration: 30, 
      price: 120, 
      active: true 
    },
    { 
      id: 'service-4', 
      businessId: 'business-1', 
      name: 'פדיקור', 
      description: 'טיפול רגליים וציפורניים', 
      duration: 45, 
      price: 150, 
      active: true 
    }
  ]);
  
  // Set mock clients
  store.setClients([
    {
      id: 'client-1',
      businessId: 'business-1',
      name: 'שירה לוי',
      phone: '050-1234567',
      email: 'shira@example.com',
      notes: 'רגישה לחומצה',
      created: new Date(2023, 1, 15),
      lastVisit: new Date(2023, 5, 20)
    },
    {
      id: 'client-2',
      businessId: 'business-1',
      name: 'דני כהן',
      phone: '052-7654321',
      email: 'danny@example.com',
      notes: '',
      created: new Date(2023, 3, 10),
      lastVisit: new Date(2023, 6, 5)
    },
    {
      id: 'client-3',
      businessId: 'business-1',
      name: 'מיכל ברקוביץ',
      phone: '054-9876543',
      email: 'michal@example.com',
      notes: 'מעדיפה טיפולים בבוקר',
      created: new Date(2022, 11, 3),
      lastVisit: new Date(2023, 7, 12)
    }
  ]);
  
  // Set mock appointments
  store.setAppointments([
    {
      id: 'appointment-1',
      businessId: 'business-1',
      clientId: 'client-1',
      serviceId: 'service-1',
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(11, 0, 0, 0)),
      status: 'confirmed',
      notes: '',
      paymentStatus: 'paid',
      paymentMethod: 'credit'
    },
    {
      id: 'appointment-2',
      businessId: 'business-1',
      clientId: 'client-2',
      serviceId: 'service-2',
      startTime: new Date(new Date().setHours(13, 0, 0, 0)),
      endTime: new Date(new Date().setHours(13, 45, 0, 0)),
      status: 'confirmed',
      notes: '',
      paymentStatus: 'pending'
    },
    {
      id: 'appointment-3',
      businessId: 'business-1',
      clientId: 'client-3',
      serviceId: 'service-3',
      startTime: new Date(new Date().setDate(new Date().getDate() + 1)),
      endTime: new Date(new Date().setDate(new Date().getDate() + 1)),
      status: 'pending',
      notes: 'לקוחה חדשה',
      paymentStatus: 'pending'
    }
  ]);
  
  // Set mock availabilities
  store.setAvailabilities([
    { id: 'avail-1', businessId: 'business-1', dayOfWeek: 0, startTime: '09:00', endTime: '18:00', available: true },
    { id: 'avail-2', businessId: 'business-1', dayOfWeek: 1, startTime: '09:00', endTime: '18:00', available: true },
    { id: 'avail-3', businessId: 'business-1', dayOfWeek: 2, startTime: '09:00', endTime: '18:00', available: true },
    { id: 'avail-4', businessId: 'business-1', dayOfWeek: 3, startTime: '09:00', endTime: '18:00', available: true },
    { id: 'avail-5', businessId: 'business-1', dayOfWeek: 4, startTime: '09:00', endTime: '18:00', available: true },
    { id: 'avail-6', businessId: 'business-1', dayOfWeek: 5, startTime: '09:00', endTime: '14:00', available: true },
    { id: 'avail-7', businessId: 'business-1', dayOfWeek: 6, startTime: '00:00', endTime: '00:00', available: false }
  ]);
  
  // Set mock blocked times
  store.setBlockedTimes([
    {
      id: 'blocked-1',
      businessId: 'business-1',
      startTime: new Date(new Date().setDate(new Date().getDate() + 3)),
      endTime: new Date(new Date().setDate(new Date().getDate() + 3)),
      reason: 'חופשה'
    },
    {
      id: 'blocked-2',
      businessId: 'business-1',
      startTime: new Date(new Date().setDate(new Date().getDate() + 7)),
      endTime: new Date(new Date().setDate(new Date().getDate() + 10)),
      reason: 'השתלמות מקצועית'
    }
  ]);
};