import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './i18n'; // i18n מופעלת, אך לא דרוש שימוש ישיר ב־useTranslation אם לא משתמשים ב־t

// Components
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages - Public
import Home from './pages/public/Home';
import BookPage from './pages/public/BookPage';
import ConfirmationPage from './pages/public/ConfirmationPage';
import ThankYouPage from './pages/public/ThankYouPage';
import LoginPage from './pages/public/LoginPage';

// Pages - Admin
import DashboardPage from './pages/admin/DashboardPage';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import ClientsPage from './pages/admin/ClientsPage';
import ServicesPage from './pages/admin/ServicesPage';
import AvailabilityPage from './pages/admin/AvailabilityPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import SettingsPage from './pages/admin/SettingsPage';

// Mock data
import { loadMockData } from './utils/mockData';

function App() {
  // אין שימוש ב־t כרגע, ולכן לא נשתמש ב־useTranslation כדי למנוע אזהרה
  React.useEffect(() => {
    loadMockData();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path=":businessId/book" element={<BookPage />} />
          <Route path="confirmation" element={<ConfirmationPage />} />
          <Route path="thank-you" element={<ThankYouPage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>

        {/* Admin Routes */}
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
    </Router>
  );
}

export default App;
