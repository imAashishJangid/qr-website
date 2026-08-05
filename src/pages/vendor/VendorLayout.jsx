import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaChartPie, FaUtensils, FaClipboardList, FaUserCircle, FaSpinner } from 'react-icons/fa';

const tabs = [
  { to: '/vendor/dashboard', label: 'Dashboard', icon: FaChartPie },
  { to: '/vendor/products', label: 'Products', icon: FaUtensils },
  { to: '/vendor/orders', label: 'Orders', icon: FaClipboardList },
  { to: '/vendor/profile', label: 'Profile', icon: FaUserCircle },
];

const VendorLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/vendor/login');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <FaSpinner className="text-4xl text-red-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-20">
      <Outlet />

      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-700 shadow-2xl">
        <div className="max-w-lg mx-auto grid grid-cols-4">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-red-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-red-400'
                }`
              }
            >
              <Icon className="text-lg" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default VendorLayout;
