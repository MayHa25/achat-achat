import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import useStore from '../../store/useStore';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('אנא הזן את כל השדות');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userAuth = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', userAuth.uid));
      const userData = userDoc.data();

      if (!userData) {
        setError('לא נמצאו פרטי משתמש');
        return;
      }

      setUser({
        id: userAuth.uid,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        businessId: userData.businessId
      });

      navigate('/admin');
    } catch (err) {
      setError('פרטי ההתחברות שגויים או שגיאה בשרת');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">{t('login_header', 'התחברות')}</h1>

          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-1">{t('email', 'אימייל')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2"
                required
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="text-gray-700">{t('password', 'סיסמה')}</label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-800">
                  {t('forgot_password', 'שכחת סיסמה?')}
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? t('loading', 'טוען...') : (
                <>
                  <LogIn className="w-5 h-5" />
                  {t('login', 'התחברות')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-gray-600">
            <p>
              עדיין אין לך חשבון?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-800">
                {t('register', 'להרשמה')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
