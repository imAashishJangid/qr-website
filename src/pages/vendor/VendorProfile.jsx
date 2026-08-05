import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { FaSignOutAlt, FaLock, FaSpinner, FaMoneyBillWave, FaBoxOpen, FaPlus, FaUserCircle } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import axios from '../../lib/api';
import toast from 'react-hot-toast';

const VendorProfile = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalRevenue: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    axios
      .get('/api/vendor/stats')
      .then(({ data }) => setStats(data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/vendor/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChanging(true);
    try {
      await axios.put('/api/vendor/change-password', passwords);
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div>
      <header className="safe-top sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-display font-bold text-gray-800 dark:text-white">Profile</h1>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center gap-4"
        >
          <FaUserCircle className="text-5xl text-red-500 flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white truncate">{user?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.restaurantName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 flex items-center gap-3"
          >
            <div className="bg-green-500 p-3 rounded-xl text-white"><FaMoneyBillWave /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Sell</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {loading ? <FaSpinner className="animate-spin" /> : `₹${stats.totalRevenue}`}
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 flex items-center gap-3"
          >
            <div className="bg-purple-500 p-3 rounded-xl text-white"><FaBoxOpen /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Products</p>
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {loading ? <FaSpinner className="animate-spin" /> : stats.totalProducts}
              </p>
            </div>
          </motion.div>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/vendor/products')}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all"
        >
          <FaPlus /> Add Products
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FaLock className="text-red-500" /> Reset Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input
              type="password"
              placeholder="Current password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="password"
              placeholder="New password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              disabled={changing}
              className="w-full bg-gray-800 dark:bg-gray-700 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {changing ? <FaSpinner className="animate-spin mx-auto" /> : 'Update Password'}
            </button>
          </form>
        </motion.div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 border-2 border-red-500 text-red-500 font-semibold py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  );
};

export default VendorProfile;
