import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  FaSignOutAlt,
  FaLock,
  FaSpinner,
  FaMoneyBillWave,
  FaBoxOpen,
  FaPlus,
  FaStore,
  FaEnvelope,
  FaMoon,
  FaSun,
  FaCamera,
  FaChevronDown,
  FaTimes,
  FaPen,
  FaLeaf,
  FaDrumstickBite,
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import axios from '../../lib/api';
import toast from 'react-hot-toast';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const VendorProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProducts: 0,
    vegCount: 0,
    nonVegCount: 0,
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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

  return (
    <div className="flex-1 flex flex-col">
      <header className="safe-top sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-display font-bold text-gray-800 dark:text-white">Profile</h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'dark' ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-700" />}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-3 sm:px-4 py-5 sm:py-6 flex-1 flex flex-col gap-5 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-10"
        >
          <button
            onClick={() => setShowEditModal(true)}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <FaPen className="text-xs" /> Edit
          </button>

          <div className="flex flex-col items-center text-center gap-1 py-2 sm:py-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white flex items-center justify-center text-3xl sm:text-4xl font-bold overflow-hidden ring-4 ring-red-50 dark:ring-gray-700 mb-3">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'V'
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white truncate max-w-full">
              {user?.name}
            </h2>
            <p className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1.5 truncate max-w-full">
              <FaStore className="flex-shrink-0 text-red-400 text-xs" /> {user?.restaurantName}
            </p>
            <p className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-full">
              <FaEnvelope className="flex-shrink-0 text-red-400 text-xs" /> {user?.email}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setShowRevenueModal(true)}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-4 sm:p-5 flex items-center gap-3 text-left"
          >
            <div className="bg-green-500 p-3 rounded-xl text-white flex-shrink-0"><FaMoneyBillWave /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Total Sell</p>
              <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
                {loading ? <FaSpinner className="animate-spin" /> : `₹${stats.totalRevenue}`}
              </p>
            </div>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate('/vendor/products')}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-4 sm:p-5 flex items-center gap-3 text-left"
          >
            <div className="bg-purple-500 p-3 rounded-xl text-white flex-shrink-0"><FaBoxOpen /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Total Products</p>
              <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
                {loading ? <FaSpinner className="animate-spin" /> : stats.totalProducts}
              </p>
            </div>
          </motion.button>
        </div>

        {!loading && (stats.totalProducts > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
              Menu Breakdown
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <FaLeaf className="text-xs" /> Veg: {stats.vegCount}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                <FaDrumstickBite className="text-xs" /> Non-Veg: {stats.nonVegCount}
              </span>
              {stats.categories.map((c) => (
                <span
                  key={c.name}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <span>{c.icon}</span> {c.name}: {c.count}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/vendor/products', { state: { openAdd: true } })}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all"
        >
          <FaPlus /> Add Products
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => setShowPasswordModal(true)}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 flex items-center justify-between"
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <FaLock className="text-red-500" /> Reset Password
          </h3>
          <FaChevronDown className="text-gray-400 -rotate-90" />
        </motion.button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 border-2 border-red-500 text-red-500 font-semibold py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all mt-auto"
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {showPasswordModal && <ResetPasswordModal onClose={() => setShowPasswordModal(false)} />}
      {showRevenueModal && <RevenueModal onClose={() => setShowRevenueModal(false)} />}
      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            updateUser(updated);
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
};

const ResetPasswordModal = ({ onClose }) => {
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [changing, setChanging] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChanging(true);
    try {
      await axios.put('/api/vendor/change-password', passwords);
      toast.success('Password changed successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaLock className="text-red-500" /> Reset Password
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <input
            type="password"
            placeholder="Current password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
            required
            autoFocus
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
    </motion.div>
  );
};

const EditProfileModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    restaurantName: user?.restaurantName || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(await fileToBase64(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put('/api/vendor/profile', {
        ...form,
        image: imageFile ? imagePreview : undefined,
      });
      toast.success('Profile updated');
      onSaved(data.user);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col items-center gap-2">
            <label className="relative cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden ring-2 ring-gray-200 dark:ring-gray-600">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FaCamera className="text-2xl text-gray-400" />
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                <FaCamera />
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">Tap to change photo</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Restaurant Name
            </label>
            <input
              name="restaurantName"
              value={form.restaurantName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <FaSpinner className="animate-spin" /> : 'Save Changes'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const RevenueModal = ({ onClose }) => {
  const [period, setPeriod] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (period === 'date' && !customDate) {
      setSummary(null);
      return;
    }

    setLoading(true);
    axios
      .get('/api/vendor/revenue', { params: { period, ...(period === 'date' ? { date: customDate } : {}) } })
      .then(({ data }) => setSummary(data))
      .catch(() => toast.error('Failed to load revenue'))
      .finally(() => setLoading(false));
  }, [period, customDate]);

  const periodLabel = { today: "Today's Sales", month: "This Month's Sales", date: 'Sales on this date' }[period];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Total Sell</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'today', label: 'Today' },
              { key: 'month', label: 'This Month' },
              { key: 'date', label: 'Pick Date' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={`py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                  period === opt.key
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {period === 'date' && (
            <input
              type="date"
              value={customDate}
              max={todayStr}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          )}

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 text-center">
            {loading ? (
              <FaSpinner className="text-2xl text-red-500 animate-spin mx-auto" />
            ) : period === 'date' && !customDate ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Pick a date to see revenue</p>
            ) : (
              <>
                <p className="text-xs text-gray-500 dark:text-gray-400">{periodLabel}</p>
                <p className="text-3xl font-bold text-red-500 mt-1">₹{summary?.totalRevenue ?? 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{summary?.totalOrders ?? 0} orders</p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VendorProfile;
