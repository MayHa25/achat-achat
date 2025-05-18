import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './i18n';
import { loadMockData } from './utils/mockData';

// Layouts & Guards
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages – Public
import Home from './pages/public/Home';
import BookPage from './pages/public/BookPage';
import ConfirmationPage from './pages/public/ConfirmationPage';
import LoginPage from './pages/public/LoginPage';
import RegisterBusinessPage from './pages/public/RegisterBusinessPage';

// Pages – Admin
import DashboardPage from './pages/admin/DashboardPage';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import ClientsPage from './pages/admin/ClientsPage';
import ServicesPage from './pages/admin/ServicesPage';
import AvailabilityPage from './pages/admin/AvailabilityPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import SettingsPage from './pages/admin/SettingsPage';

const App: React.FC = () => {
  useEffect(() => {
    loadMockData();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path=":businessId/book" element={<BookPage />} />
          <Route path="confirmation" element={<ConfirmationPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="public/RegisterBusinessPage" element={<RegisterBusinessPage />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>

      {/* Footer – מופיע פעם אחת בלבד */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="container mx-auto px-4 py-8 grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-bold text-lg mb-2">צור קשר</h3>
            <p>טלפון: 0505393611</p>
            <p>מייל: may.hakimi010@gmail.com</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">קישורים מהירים</h3>
            <ul className="space-y-1">
              <li><a href="/" className="hover:underline">דף הבית</a></li>
              <li><a href="#info" className="hover:underline">עוד פרטים</a></li>
              <li><a href="/login" className="hover:underline">התחברות</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">אודות המערכת</h3>
            <p className="mb-2">
              מערכת ניהול תורים חכמה שמספקת פתרון מקיף לניהול לוחות זמנים, לקוחות ותשלומים בעסק שלך.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>ממשק משתמש אינטואיטיבי ופשוט</li>
              <li>התאמה אישית לצרכי העסק שלך</li>
              <li>דוחות וניתוחים בזמן אמת</li>
              <li>תמיכה ומענה מקצועי 24/7</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-gray-500 mt-8">
          © 2025 מערכת ניהול תורים - כל הזכויות שמורות
        </div>
      </footer>
    </Router>
  );
};

export default App;
