import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaUserLock, FaWhatsapp, FaSyncAlt, FaSignOutAlt, FaSpinner, FaMoon, FaSun, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { VENDOR_INACTIVE_MESSAGE } from '../lib/api';
import { openAdminWhatsApp } from '../lib/contact';

// Re-checks the account with the server so a vendor the admin just activated gets in without
// logging out and back in.
const useCheckStatus = () => {
  const { refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const check = async () => {
    setChecking(true);
    const fresh = await refreshUser();
    setChecking(false);
    if (fresh?.isActive) toast.success('Your account is active now 🎉');
    else if (fresh) toast.error(VENDOR_INACTIVE_MESSAGE, { id: 'vendor-inactive' });
    else toast.error('Could not reach the server. Please try again.');
  };
  return { checking, check };
};

// Message plus "contact admin" / "check again" actions; shared by the locked screen and the
// banner on the Profile page.
const InactiveActions = () => {
  const { user } = useAuth();
  const { checking, check } = useCheckStatus();
  return (
    <>
      <button
        onClick={() => openAdminWhatsApp(user)}
        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        <FaWhatsapp className="text-lg" /> Contact Admin on WhatsApp
      </button>
      <button
        onClick={check}
        disabled={checking}
        className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-semibold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
      >
        {checking ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />} Check status again
      </button>
    </>
  );
};

// Shown at the top of the Profile page, the one screen an inactive vendor can open.
export const InactiveAccountBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    role="alert"
    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-6 border-l-4 border-red-500"
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center flex-shrink-0">
        <FaUserLock />
      </div>
      <div className="min-w-0">
        <h2 className="font-bold text-gray-800 dark:text-white">Account inactive</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{VENDOR_INACTIVE_MESSAGE}</p>
      </div>
    </div>
    <div className="mt-4 grid sm:grid-cols-2 gap-3">
      <InactiveActions />
    </div>
  </motion.div>
);

// Shown in place of every vendor screen except Profile while the account is inactive, so no
// dashboard data, stats, products or QR codes are requested or shown.
const InactiveVendorNotice = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/vendor/login');
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="lg:hidden safe-top sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 overflow-hidden rounded-xl shadow-md shadow-red-500/30 flex-shrink-0">
              <img src="/applogo.jpeg" alt="HiaQr" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-lg sm:text-2xl font-display font-bold text-gray-800 dark:text-white truncate">
              {user?.restaurantName || 'Dashboard'}
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            {theme === 'dark' ? <FaSun className="text-red-400" /> : <FaMoon className="text-gray-700" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4">
            <FaUserLock className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Account inactive</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{VENDOR_INACTIVE_MESSAGE}</p>

          <div className="mt-6 space-y-3">
            <InactiveActions />
            <button
              onClick={() => navigate('/vendor/profile')}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              <FaUserCircle /> View my profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 border-2 border-red-500 text-red-500 font-semibold py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InactiveVendorNotice;
