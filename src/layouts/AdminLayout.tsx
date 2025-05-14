import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Tag,
  Clock,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Bell
} from 'lucide-react';
import useStore from '../store/useStore';

const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, setUser } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { name: t('nav_dashboard'), path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: t('nav_appointments'), path: '/admin/appointments', icon: <Calendar className="w-5 h-5" /> },
    { name: t('nav_clients'), path: '/admin/clients', icon: <Users className="w-5 h-5" /> },
    { name: t('nav_services'), path: '/admin/services', icon: <Tag className="w-5 h-5" /> },
    { name: t('nav_availability'), path: '/admin/availability', icon: <Clock className="w-5 h-5" /> },
    { name: t('nav_payments'), path: '/admin/payments', icon: <CreditCard className="w-5 h-5" /> },
    { name: t('nav_settings'), path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className={`hidden md:block bg-primary-900 text-white w-64 flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out fixed md:relative z-40 h-full`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Calendar className="h-7 w-7 text-white" />
            <span className="font-bold text-xl">{t('app_name')}</span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary-800 text-white'
                    : 'text-gray-300 hover:bg-primary-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-primary-800 hover:text-white rounded-md transition-colors mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('logout')}</span>
            </button>
          </nav>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`md:hidden fixed inset-y-0 right-0 bg-primary-900 text-white w-64 flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out z-40`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Calendar className="h-7 w-7 text-white" />
              <span className="font-bold text-xl">{t('app_name')}</span>
            </div>
            <button onClick={toggleSidebar} className="text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary-800 text-white'
                    : 'text-gray-300 hover:bg-primary-800 hover:text-white'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-primary-800 hover:text-white rounded-md transition-colors mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('logout')}</span>
            </button>
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
          <button className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100" onClick={toggleSidebar}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800 hidden md:block">
            {navItems.find(item => item.path === location.pathname)?.name || t('nav_dashboard')}
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative" onClick={() => setShowNotifications(prev => !prev)}>
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 bg-error-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-50">
                  <div className="p-4 border-b font-semibold text-gray-700">התראות</div>
                  <ul className="divide-y divide-gray-100">
                    <li className="p-3 text-sm text-gray-600 hover:bg-gray-50">לקוחה חדשה קבעה תור</li>
                    <li className="p-3 text-sm text-gray-600 hover:bg-gray-50">הזמנה אושרה</li>
                    <li className="p-3 text-sm text-gray-600 hover:bg-gray-50">המלאי עודכן</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setShowUserMenu(prev => !prev)} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-gray-700 hidden md:block">{user?.name || 'Admin'}</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50">
                  <ul className="text-sm text-gray-700">
                    <li className="p-3 hover:bg-gray-50 cursor-pointer">פרופיל</li>
                    <li className="p-3 hover:bg-gray-50 cursor-pointer">הגדרות</li>
                    <li className="p-3 hover:bg-gray-50 cursor-pointer" onClick={handleLogout}>התנתק</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;