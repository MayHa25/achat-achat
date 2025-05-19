import React, { useState } from 'react';
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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-yellow-400 to-yellow-300 text-black py-20">
        <div
          className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3865557/pexels-photo-3865557.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center mix-blend-overlay opacity-10"
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="md:w-2/3 lg:w-1/2">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              נהל את העסק שלך בקלות עם מערכת ניהול תורים חכמה
            </h1>
            <p className="text-lg md:text-xl mb-8 text-gray-800">
              מערכת מתקדמת לניהול תורים, לקוחות ותשלומים – במיוחד לבעלות קליניקות ועסקים עצמאיים
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#info"
                className="px-6 py-3 bg-white text-yellow-700 rounded-md font-semibold hover:bg-yellow-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                עוד פרטים
              </a>
              <Link
                to="/public/RegisterBusinessPage"
                className="inline-block bg-black text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-900 transition"
              >
                להרשמה מיידית
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section id="info" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4 text-center">למה דווקא "אחת אחת"?</h2>
          <p className="mb-6 text-gray-700 text-center max-w-xl mx-auto">
            כי את לא צריכה להתאים את עצמך למערכת – המערכת שלנו מתאימה את עצמה לעסק שלך. בלי כאב ראש, בלי עלויות נסתרות, ועם שליטה מלאה בקצות האצבעות.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>התאמה אישית לעסק שלך</li>
              <li>התראות אוטומטיות ללקוחות ובעלות העסק</li>
              <li>ניהול תורים, לקוחות ותשלומים במקום אחד</li>
            </ul>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>ממשק פשוט ונוח גם בטלפון</li>
              <li>דוחות מתקדמים לשיפור העסק</li>
              <li>תמיכה אנושית וזמינה לאורך כל הדרך</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">מה הלקוחות שלנו אומרות</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-800 mb-4">"{t.feedback}"</p>
                <p className="font-bold text-yellow-600">- {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal – שמור לשימוש עתידי */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4">השאירי פרטים ונחזור אליך</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="businessName"
                placeholder="שם העסק"
                value={form.businessName}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                name="contactName"
                placeholder="שם איש קשר"
                value={form.contactName}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                name="phone"
                type="tel"
                placeholder="טלפון"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                name="email"
                type="email"
                placeholder="אימייל"
                value={form.email}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
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
                disabled={sending}
                className="w-full bg-yellow-500 text-black py-2 rounded hover:bg-yellow-600 transition"
              >
                {sending ? 'שולחת...' : 'שלחי'}
              </button>
            </form>
            {feedback && (
              <p
                className={`mt-4 text-center ${
                  feedback.includes('שגיאה') ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {feedback}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
