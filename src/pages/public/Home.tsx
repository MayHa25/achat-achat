import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Calendar, Check, Clock, CreditCard } from 'lucide-react';

const Home: React.FC = () => {
  const { t } = useTranslation();

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
              <Link 
                to="/login" 
                className="px-6 py-3 bg-white bg-opacity-10 text-white rounded-md font-medium hover:bg-opacity-20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                {t('login')}
              </Link>
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
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-400 to-primary-500 py-16 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-2/3">
              <h2 className="text-3xl font-bold mb-4">מוכנים להתחיל?</h2>
              <p className="text-lg text-primary-100">
                הצטרפו היום למערכת שלנו ותתחילו לנהל את העסק שלכם בצורה טובה יותר. קלה להתקנה, פשוטה לשימוש.
              </p>
            </div>
            <div className="md:w-1/3 flex justify-center md:justify-end">
              <Link 
                to="/login" 
                className="px-8 py-4 bg-secondary-100 text-primary-600 rounded-md font-medium text-lg hover:bg-secondary-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-100"
              >
                התחל עכשיו
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 bg-primary-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-primary-600">מה הלקוחות שלנו אומרים</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "המערכת חסכה לי המון זמן בניהול התורים שלי. הלקוחות מרוצים מהאפשרות לקבוע תורים אונליין.",
                author: "ד״ר רונית כהן",
                title: "פסיכולוגית קלינית"
              },
              {
                quote: "מאז שהתחלתי להשתמש במערכת, כמות הביטולים ירדה משמעותית בזכות מערכת התזכורות האוטומטית.",
                author: "מיכל לוי",
                title: "קוסמטיקאית"
              },
              {
                quote: "ניהול הלקוחות והתשלומים מסודר ופשוט. אני ממליץ בחום לכל בעל קליניקה.",
                author: "אייל גולן",
                title: "פיזיותרפיסט"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md border border-primary-100">
                <div className="mb-4 text-secondary-400">
                  {Array(5).fill(0).map((_, i) => (
                    <span key={i} className="text-2xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-primary-600">{testimonial.author}</p>
                  <p className="text-gray-600">{testimonial.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;