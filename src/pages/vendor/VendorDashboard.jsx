import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
  FaUsers,
  FaUtensils,
  FaMoneyBillWave,
  FaBoxOpen,
  FaMoon,
  FaSun,
  FaSpinner,
  FaClock,
  FaQrcode,
  FaPlus,
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import axios from '../../lib/api';
import toast from 'react-hot-toast';

const VendorDashboard = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState('');
  const [addingTable, setAddingTable] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, tablesRes] = await Promise.all([
        axios.get('/api/vendor/stats'),
        axios.get('/api/vendor/recent-orders'),
        axios.get('/api/vendor/tables'),
      ]);

      setStats(statsRes.data);
      setRecentOrders(ordersRes.data);
      setTables(tablesRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTable.trim()) return;

    setAddingTable(true);
    try {
      const { data } = await axios.post('/api/vendor/tables', { number: newTable.trim() });
      setTables(data);
      setNewTable('');
      toast.success(`Table ${newTable.trim()} added!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add table');
    } finally {
      setAddingTable(false);
    }
  };

  const menuLink = (table) => `${window.location.origin}/menu/${user?.id}/${table}`;

  const statCards = [
    { title: 'Total Orders', value: stats.totalOrders, icon: <FaUtensils className="text-2xl" />, color: 'bg-blue-500' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue}`, icon: <FaMoneyBillWave className="text-2xl" />, color: 'bg-green-500' },
    { title: 'Total Products', value: stats.totalProducts, icon: <FaBoxOpen className="text-2xl" />, color: 'bg-purple-500' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: <FaClock className="text-2xl" />, color: 'bg-yellow-500' },
  ];

  return (
    <div>
      <header className="safe-top sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-display font-bold text-gray-800 dark:text-white truncate">
              {user?.restaurantName || 'Dashboard'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              Welcome back, {user?.name || 'Vendor'} 👋
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            {theme === 'dark' ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-700" />}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{stat.title}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white mt-1">
                    {loading ? <FaSpinner className="animate-spin inline" /> : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-xl text-white flex-shrink-0`}>{stat.icon}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tables & QR Codes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FaQrcode className="text-red-500" /> Tables & QR Codes
          </h2>

          <form onSubmit={handleAddTable} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTable}
              onChange={(e) => setNewTable(e.target.value)}
              placeholder="Table number, e.g. 5"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              disabled={addingTable}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {addingTable ? <FaSpinner className="animate-spin" /> : <FaPlus />}
              Add Table
            </button>
          </form>

          {tables.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-6">
              No tables yet. Add a table number to generate its QR code.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map((table) => (
                <div
                  key={table}
                  className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center gap-2"
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(menuLink(table))}`}
                    alt={`QR code for table ${table}`}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-lg bg-white p-1"
                  />
                  <p className="font-semibold text-gray-800 dark:text-white">Table {table}</p>
                  <a
                    href={menuLink(table)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-red-500 hover:underline break-all text-center"
                  >
                    {menuLink(table)}
                  </a>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent Orders</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <FaSpinner className="text-3xl text-red-500 animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No recent orders</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Order #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Table</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Items</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-white">#{order.orderNumber}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">Table {order.tableId}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{order.items?.length} items</td>
                      <td className="py-3 px-4 font-semibold text-red-500">₹{order.total}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'ready' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default VendorDashboard;
