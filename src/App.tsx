import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';

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
import RegisterPage from './pages/public/RegisterPage';
import AppointmentSentPage from './pages/public/AppointmentSentPage';

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
  const { t } = useTranslation();

  React.useEffect(() => {
    loadMockData();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes with layout */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path=":ownerId/book" element={<BookPage />} />  {/* נתיב דינמי שכולל את ownerId */}
          <Route path="confirmation" element={<ConfirmationPage />} />
          <Route path="thank-you" element={<ThankYouPage />} />
          <Route path="appointment-sent" element={<AppointmentSentPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Admin routes with protection */}
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

        {/* fallback if no route matched */}
        <Route path="*" element={<div style={{ padding: '2rem' }}>הדף לא נמצא</div>} />
      </Routes>
    </Router>
  );
}

export default App;
