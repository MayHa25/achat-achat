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

  useEffect(() => {
    const scrollHandler = () => {
      const btn = document.getElementById('floating-button');
      if (btn) btn.style.display = window.scrollY > 300 ? 'block' : 'none';
    };
    window.addEventListener('scroll', scrollHandler);
    return () => window.removeEventListener('scroll', scrollHandler);
  }, []);

  return (
    <div className="bg-white flex flex-col min-h-screen scroll-smooth relative">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-yellow-400 to-yellow-300 text-black py-20">
        <div
          className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3865557/pexels-photo-3865557.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center mix-blend-overlay opacity-10"
        />
        <div className="container mx-auto px-4 relative z-10 text-right">
          <div className="md:w-2/3 lg:w-1/2 ml-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">נהל את העסק שלך בקלות עם מערכת ניהול תורים חכמה</h1>
            <p className="text-xl mb-8">מערכת מתקדמת לניהול תורים, לקוחות ותשלומים לבעלי קליניקות ועסקים בתחום הטיפולים</p>
            <div className="flex flex-wrap gap-4">
              <a href="#info" className="px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-gray-200 transition-colors">עוד פרטים</a>
              <Link to="/public/RegisterBusinessPage" className="inline-block bg-black text-white font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition">להרשמה מיידית למערכת</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Button */}
      <Link
        to="/public/RegisterBusinessPage"
        id="floating-button"
        className="fixed bottom-6 left-6 bg-yellow-400 text-black font-bold px-5 py-3 rounded-full shadow-lg hover:bg-yellow-500 transition z-50 hidden"
      >
        הרשמי עכשיו
      </Link>

      {/* Remaining sections remain unchanged */}
    </div>
  );
};

export default Home;
