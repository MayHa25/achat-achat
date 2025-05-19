import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

const testimonials = [
  { name: 'ענבר לוי', feedback: 'המערכת שינתה לי את החיים! ניהול התורים הפך לפשוט ומהיר.' },
  { name: 'דנה כהן', feedback: 'חסכתי המון זמן בעזרת המערכת. ממליצה בחום!' },
  { name: 'מיכאל ישראלי', feedback: 'תמיכה מעולה וחווית משתמש מדהימה.' },
];

const Home: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    selfRegister: false,
  });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingButton(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setFeedback(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFeedback(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setFeedback('הפרטים נשלחו בהצלחה! נחזור אליך בקרוב.');
      setForm({ businessName: '', contactName: '', phone: '', email: '', selfRegister: false });
    } catch {
      setFeedback('אירעה שגיאה בשליחה. נסה שוב.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white flex flex-col min-h-screen scroll-smooth">
      <section className="relative bg-gradient-to-r from-primary-500 to-primary-400 text-white py-20">
        <div
          className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3865557/pexels-photo-3865557.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center mix-blend-overlay opacity-10"
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="md:w-2/3 lg:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              נהל את העסק שלך בקלות עם מערכת ניהול תורים חכמה
            </h1>
            <p className="text-xl mb-8 text-primary-100">
              מערכת מתקדמת לניהול תורים, לקוחות ותשלומים לבעלי קליניקות ועסקים בתחום הטיפולים
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#info"
                className="px-6 py-3 bg-secondary-100 text-primary-600 rounded-md font-medium hover:bg-secondary-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-100"
              >
                עוד פרטים
              </a>
            </div>
            <div className="mt-6">
              <Link
                to="/public/RegisterBusinessPage"
                className="inline-block bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-500 transition"
              >
                להרשמה מיידית למערכת
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="info" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">מהי מערכת ניהול התורים?</h2>
          <p className="mb-6 text-gray-700">
            מערכת ניהול תורים חכמה שמספקת פתרון מקיף לניהול לוחות זמנים, לקוחות ותשלומים בעסק שלך.
            הכל במקום אחד, עם דוחות וניתוחים בזמן אמת ותמיכה מקצועית 24/7.
          </p>
          <h3 className="text-2xl font-semibold mb-3">למה לבחור בנו?</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>ממשק משתמש אינטואיטיבי ופשוט לתפעול</li>
            <li>התאמה מלאה לצרכי העסק שלך</li>
            <li>התראות ותזכורות אוטומטיות בזמן אמת</li>
            <li>דוחות וניתוחים מתקדמים לשיפור ביצועים והכנסות</li>
            <li>תמחור משתלם וללא עלויות נסתרות</li>
            <li>תמיכה ומענה מקצועי 24/7</li>
          </ul>
        </div>
      </section>

      <section id="pricing" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">בחרי את המסלול שלך</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'בסיסי',
                price: '89 ₪',
                sms: '30 הודעות בחודש',
                extra: '1.5 ₪ להודעה נוספת',
                features: 'ניהול תורים בסיסי + שליחת SMS'
              },
              {
                title: 'מתקדם',
                price: '129 ₪',
                sms: '60 הודעות בחודש',
                extra: '1.5 ₪ להודעה נוספת',
                features: 'ניהול תורים + שליחת SMS + ממשק נוח יותר'
              },
              {
                title: 'פרימיום',
                price: '179 ₪',
                sms: '100 הודעות בחודש',
                extra: '1.5 ₪ להודעה נוספת',
                features: 'ניהול תורים + שליחת SMS + ממשק נרחב יותר'
              }
            ].map((plan, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-2xl font-bold mb-2">מסלול {plan.title}</h3>
                <p className="text-3xl font-bold mb-2">{plan.price}</p>
                <p className="text-gray-700 mb-1">{plan.sms}</p>
                <p className="text-gray-700 mb-1">{plan.extra}</p>
                <p className="text-sm text-gray-600 mb-4">{plan.features}</p>
                <Link
                  to="/public/RegisterBusinessPage"
                  className="inline-block bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl hover:bg-yellow-500 transition"
                >
                  הירשמי למסלול זה
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">מה הלקוחות שלנו אומרים</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-800 mb-4">"{t.feedback}"</p>
                <p className="font-bold text-primary-600">- {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showFloatingButton && (
        <Link
          to="/public/RegisterBusinessPage"
          className="fixed bottom-6 left-6 z-50 bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded-full shadow-lg transition"
        >
          הרשמי עכשיו!
        </Link>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4">השאר פרטים</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="businessName" value={form.businessName} onChange={handleChange} required className="w-full border px-3 py-2 rounded" placeholder="שם העסק" />
              <input name="contactName" value={form.contactName} onChange={handleChange} required className="w-full border px-3 py-2 rounded" placeholder="שם איש קשר" />
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} required className="w-full border px-3 py-2 rounded" placeholder="טלפון" />
              <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border px-3 py-2 rounded" placeholder="אימייל" />
              <div className="flex items-center">
                <input id="selfRegister" name="selfRegister" type="checkbox" checked={form.selfRegister} onChange={handleChange} className="mr-2" />
                <label htmlFor="selfRegister">אני רוצה להירשם ולשלם בעצמי</label>
              </div>
              <button type="submit" disabled={sending} className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition">
                {sending ? 'שולח...' : 'שלח'}
              </button>
            </form>
            {feedback && (
              <p className={`mt-4 text-center ${feedback.includes('שגיאה') ? 'text-red-600' : 'text-green-600'}`}>{feedback}</p>
            )}
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
