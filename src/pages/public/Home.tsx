// src/pages/Home.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Calendar, Check, Clock, CreditCard, X } from 'lucide-react';

const Home: React.FC = () => {
  const { t } = useTranslation();

  // state ל־Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    selfRegister: false,
  });

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: שליחת ה־form ל־API או לשירות חיצוני
    console.log('submitted', form);
    closeModal();
  };

  const features = [
    {
      icon: <Calendar className="w-8 h-8 text-primary-400" />,
      title: 'ניהול תורים קל ונוח',
      description: 'נהל את התורים שלך בצורה חכמה, הגדר זמנים פנויים ותן ללקוחות לקבוע תורים בקלות.'
    },
    {
      icon: <Check className="w-8 h-8 text-primary-400" />,
      title: 'תזכורות אוטומטיות',
      description: 'שלח תזכורות אוטומטיות ללקוחות לפני התור שלהם כדי להפחית ביטולים.'
    },
    {
      icon: <Clock className="w-8 h-8 text-primary-400" />,
      title: 'ניהול זמינות',
      description: 'הגדר את שעות העבודה שלך, חסום זמנים לחופשה ושמור על יומן מסודר.'
    },
    {
      icon: <CreditCard className="w-8 h-8 text-primary-400" />,
      title: 'תשלומים וחשבוניות',
      description: 'קבל תשלומים באופן מקוון והפק חשבוניות דיגיטליות מיד לאחר התשלום.'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-500 to-primary-400 text-white py-20">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3865557/pexels-photo-3865557.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center mix-blend-overlay opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="md:w-2/3 lg:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              נהל את העסק שלך בקלות עם מערכת ניהול תורים חכמה
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              מערכת מתקדמת לניהול תורים, לקוחות ותשלומים לבעלי קליניקות ועסקים בתחום הטיפולים
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/book" 
                className="px-6 py-3 bg-secondary-100 text-primary-600 rounded-md font-medium hover:bg-secondary-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-100"
              >
                {t('book_appointment')}
              </Link>
              <button
                onClick={openModal}
                className="px-6 py-3 bg-white bg-opacity-10 text-white rounded-md font-medium hover:bg-opacity-20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                התחל עכשיו
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-primary-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-primary-600">למה לבחור במערכת שלנו?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              המערכת שלנו מספקת את כל הכלים שאתה צריך כדי לנהל את העסק שלך ביעילות ולהעניק ללקוחות שלך חוויה נהדרת
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-lg shadow-md border border-primary-100 transition-all hover:shadow-lg hover:border-primary-200"
              >
                <div className="mb-4 bg-primary-50 w-16 h-16 rounded-full flex items-center justify-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-primary-600">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section – נשמר כמות שהוא */}
      {/* ... */}

      {/* Testimonials Section – נשמר כמות שהוא */}
      {/* ... */}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4">השאר פרטים</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">שם העסק</label>
                <input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  required
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">שם איש קשר</label>
                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  required
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">טלפון</label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">אימייל</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="flex items-center">
                <input
                  id="selfRegister"
                  name="selfRegister"
                  type="checkbox"
                  checked={form.selfRegister}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="selfRegister">אני רוצה להירשם ולשלם בעצמי</label>
              </div>
              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition"
              >
                שלח
              </button>
            </form>
            {form.selfRegister && (
              <p className="mt-4 text-sm text-gray-600">
                לאחר שליחת הפרטים תקבלי קישור לתשלום מאובטח דרך Stripe.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
