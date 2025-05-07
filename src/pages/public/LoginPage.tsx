import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('אנא הזן את כל השדות');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // In a real app, we would authenticate against a backend
    // For demo purposes, we'll use a dummy login
    setTimeout(() => {
      setIsLoading(false);
      
      if (email === 'admin@example.com' && password === 'password') {
        setUser({
          id: 'user-1',
          name: 'ישראל ישראלי',
          email: 'admin@example.com',
          phone: '050-1234567',
          role: 'admin',
          businessId: 'business-1'
        });
        navigate('/admin');
      } else {
        setError('פרטי ההתחברות שגויים');
      }
    }, 1000);
  };
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">{t('login_header')}</h1>
          
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-1">{t('email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="text-gray-700">{t('password')}</label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-800 transition-colors">
                  {t('forgot_password')}
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? t('loading') : (
                <>
                  <LogIn className="w-5 h-5" />
                  {t('login')}
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-gray-600">
            <p>
              עדיין אין לך חשבון?{' '}
              <a href="#" className="text-primary-600 hover:text-primary-800 transition-colors">{t('register')}</a>
            </p>
            
            {/* Temporary demo login info */}
            <div className="mt-6 p-3 bg-gray-50 rounded-md text-sm">
              <p className="font-semibold mb-1">פרטי התחברות לדמו:</p>
              <p>דוא״ל: admin@example.com</p>
              <p>סיסמה: password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;