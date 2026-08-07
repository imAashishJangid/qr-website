import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FaChartPie, FaUtensils, FaClipboardList, FaUserCircle, FaMoon, FaSun } from 'react-icons/fa';
import Skeleton from '../../components/Skeleton';

const tabs = [
  { to: '/vendor/dashboard', label: 'Dashboard', icon: FaChartPie },
  { to: '/vendor/products', label: 'Products', icon: FaUtensils },
  { to: '/vendor/orders', label: 'Orders', icon: FaClipboardList },
  { to: '/vendor/profile', label: 'Profile', icon: FaUserCircle },
];

const VendorLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/vendor/login');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="sticky top-0 bg-white/90 dark:bg-gray-800/90 border-b border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="h-4 w-28 rounded hidden sm:block" />
          </div>
          <div className="hidden lg:flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 lg:h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-2xl mt-6 sm:mt-8" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-20 lg:pb-0">
      {/* Desktop top nav */}
      <nav className="hidden lg:block sticky top-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 flex items-center justify-center text-lg bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-md shadow-red-500/30">
              🍽️
            </div>
            <span className="font-display font-bold text-gray-800 dark:text-white">Smart QR Food</span>
          </div>
          <div className="flex items-center gap-1">
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`
                }
              >
                <Icon className="text-base" />
                {label}
              </NavLink>
            ))}
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-700" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>

      {/* Mobile bottom nav */}
      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-700 shadow-2xl lg:hidden">
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
