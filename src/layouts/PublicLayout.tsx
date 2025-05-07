import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Menu, X } from 'lucide-react';

const PublicLayout: React.FC = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary-600" />
            <span className="font-bold text-xl text-gray-900">{t('app_name')}</span>
          </Link>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden bg-white p-2 rounded-md"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/book" className="font-medium text-gray-700 hover:text-primary-600 transition-colors">
              {t('book_appointment')}
            </Link>
            <Link to="/login" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
              {t('login')}
            </Link>
          </nav>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white pb-4 px-4">
            <nav className="flex flex-col gap-4">
              <Link 
                to="/book" 
                className="font-medium text-gray-700 hover:text-primary-600 transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('book_appointment')}
              </Link>
              <Link 
                to="/login" 
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('login')}
              </Link>
            </nav>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">{t('app_name')}</h3>
              <p className="text-gray-400">
                מערכת מתקדמת לניהול תורים, לקוחות ותשלומים לבעלי מרפאות וקליניקות.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">קישורים מהירים</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                    דף הבית
                  </Link>
                </li>
                <li>
                  <Link to="/book" className="text-gray-400 hover:text-white transition-colors">
                    {t('book_appointment')}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-400 hover:text-white transition-colors">
                    {t('login')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">צור קשר</h3>
              <div className="space-y-2 text-gray-400">
                <p className="flex items-center">
                  <span>טלפון: 03-1234567</span>
                </p>
                <p className="flex items-center">
                  <span>מייל: info@clinic-booking.co.il</span>
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} {t('app_name')} - כל הזכויות שמורות</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;