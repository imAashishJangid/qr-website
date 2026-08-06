import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
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
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaReceipt,
  FaTrash,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import axios from '../../lib/api';
import toast from 'react-hot-toast';
import { playNotificationChime } from '../../lib/notificationSound';

const VendorDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
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
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [deleteTableTarget, setDeleteTableTarget] = useState(null);
  const [deletingTable, setDeletingTable] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const fetchRecentOrders = async (page = 1, date = '') => {
    try {
      setOrdersLoading(true);
      const { data } = await axios.get('/api/vendor/recent-orders', {
        params: { page, limit: 10, ...(date ? { date } : {}) },
      });
      setRecentOrders(data.orders || []);
      setOrdersTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load recent orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, tablesRes] = await Promise.all([
        axios.get('/api/vendor/stats'),
        axios.get('/api/vendor/tables'),
      ]);

      setStats(statsRes.data);
      setTables(tablesRes.data);
      await fetchRecentOrders(1, '');
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (loading) return;
    fetchRecentOrders(ordersPage, dateFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersPage, dateFilter]);

  // Live updates: new orders and status changes land instantly, no refresh needed.
  useEffect(() => {
    if (!socket || !user?.id) return;

    socket.emit('join-vendor', user.id);

    const refreshStats = () => {
      axios.get('/api/vendor/stats').then(({ data }) => setStats(data)).catch(() => {});
    };

    const handleNewOrder = (order) => {
      playNotificationChime();
      toast.success(`📦 New order #${order.orderNumber} received!`);
      refreshStats();
      if (ordersPage === 1) fetchRecentOrders(1, dateFilter);
    };

    const handleOrderUpdated = () => {
      refreshStats();
      fetchRecentOrders(ordersPage, dateFilter);
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderUpdated', handleOrderUpdated);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderUpdated', handleOrderUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user?.id, ordersPage, dateFilter]);

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setOrdersPage(1);
  };

  const orderDateLabel = (dateInput) => {
    const d = new Date(dateInput).toISOString().slice(0, 10);
    if (d === todayStr) return 'Today';
    if (d === yesterdayStr) return 'Yesterday';
    return new Date(dateInput).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const groupedOrders = recentOrders.reduce((groups, order) => {
    const label = orderDateLabel(order.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.orders.push(order);
    } else {
      groups.push({ label, orders: [order] });
    }
    return groups;
  }, []);

  const itemsSummary = (items = []) => {
    const names = items.map((i) => i.name);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
  };

  const menuLink = (table) => `${window.location.origin}/menu/${user?.id}/${table}`;

  const statCards = [
    { title: 'Total Orders', value: stats.totalOrders, icon: <FaUtensils className="text-2xl lg:text-3xl" />, color: 'bg-blue-500' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue}`, icon: <FaMoneyBillWave className="text-2xl lg:text-3xl" />, color: 'bg-green-500' },
    { title: 'Total Products', value: stats.totalProducts, icon: <FaBoxOpen className="text-2xl lg:text-3xl" />, color: 'bg-purple-500' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: <FaClock className="text-2xl lg:text-3xl" />, color: 'bg-yellow-500' },
  ];

  return (
    <div>
      <header className="lg:hidden safe-top sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 flex items-center justify-center text-base bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-md shadow-red-500/30 flex-shrink-0">
              🍽️
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-display font-bold text-gray-800 dark:text-white truncate">
                {user?.restaurantName || 'Dashboard'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                Welcome back, {user?.name || 'Vendor'} 👋
              </p>
            </div>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg lg:hover:shadow-xl lg:hover:-translate-y-0.5 transition-all p-4 sm:p-6 lg:p-7"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 truncate">{stat.title}</p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mt-1 lg:mt-2">
                    {loading ? <FaSpinner className="animate-spin inline" /> : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 lg:p-4 rounded-xl lg:rounded-2xl text-white flex-shrink-0`}>{stat.icon}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tables & QR Codes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <FaQrcode className="text-red-500" /> Tables & QR Codes
            </h2>
            <button
              onClick={() => setShowAddTableModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold text-sm sm:text-base hover:shadow-lg transition-all flex-shrink-0"
            >
              <FaPlus /> Add Table
            </button>
          </div>

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
                  <button
                    onClick={() => setDeleteTableTarget(table)}
                    className="flex items-center gap-1.5 mt-1 px-3 py-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-xs font-medium"
                  >
                    <FaTrash className="text-xs" /> Delete
                  </button>
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
          className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">Recent Orders</h2>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDateFilterChange('')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  dateFilter === '' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleDateFilterChange(todayStr)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  dateFilter === todayStr ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleDateFilterChange(yesterdayStr)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  dateFilter === yesterdayStr ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Yesterday
              </button>
              <div className="relative">
                <FaCalendarAlt className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                <input
                  type="date"
                  value={dateFilter}
                  max={todayStr}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  className="pl-7 pr-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {loading || ordersLoading ? (
            <div className="flex justify-center py-8">
              <FaSpinner className="text-3xl text-red-500 animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No orders {dateFilter ? 'on this date' : 'yet'}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 pb-2 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                <span className="flex-1">Order</span>
                <span className="flex-shrink-0 w-14 sm:w-20 text-right">Price</span>
                <span className="flex-shrink-0 w-14 sm:w-20 text-right">Details</span>
              </div>

              <div className="space-y-5">
                {groupedOrders.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                      {group.label}
                    </p>
                    <div className="space-y-2">
                      {group.orders.map((order) => (
                        <div
                          key={order._id}
                          className="flex items-center gap-2 p-3 lg:p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="min-w-0 flex-1 lg:flex lg:items-center lg:gap-6">
                            <div className="flex items-center gap-2 flex-wrap lg:flex-shrink-0">
                              <span className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">
                                Table {order.tableId}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  order.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.status === 'preparing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : order.status === 'ready'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {order.status}
                              </span>
                              <span className="hidden lg:inline text-xs text-gray-400 dark:text-gray-500">
                                #{order.orderNumber}
                              </span>
                            </div>
                            <p className="lg:hidden text-xs text-gray-400 dark:text-gray-500">#{order.orderNumber}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1 lg:mt-0 lg:flex-1">
                              {itemsSummary(order.items)}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 lg:mt-0 lg:flex-shrink-0">
                              {order.items?.length} items ·{' '}
                              {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex-shrink-0 w-14 sm:w-20 lg:w-24 text-right">
                            <span className="font-semibold text-red-500 text-sm sm:text-base lg:text-lg">₹{order.total}</span>
                          </div>
                          <div className="flex-shrink-0 w-14 sm:w-20 lg:w-24 text-right">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-red-500 hover:text-white transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {ordersTotalPages > 1 && (
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    disabled={ordersPage <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft className="text-xs" /> Prev
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Page {ordersPage} of {ordersTotalPages}
                  </span>
                  <button
                    onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
                    disabled={ordersPage >= ordersTotalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <FaChevronRight className="text-xs" />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
      {showAddTableModal && (
        <AddTableModal
          tables={tables}
          onClose={() => setShowAddTableModal(false)}
          onSaved={(updatedTables) => {
            setTables(updatedTables);
            setShowAddTableModal(false);
          }}
        />
      )}
      {deleteTableTarget && (
        <DeleteTableModal
          table={deleteTableTarget}
          deleting={deletingTable}
          onClose={() => setDeleteTableTarget(null)}
          onConfirm={async () => {
            setDeletingTable(true);
            try {
              const { data } = await axios.delete(`/api/vendor/tables/${encodeURIComponent(deleteTableTarget)}`);
              setTables(data);
              toast.success(`Table ${deleteTableTarget} deleted`);
              setDeleteTableTarget(null);
            } catch (error) {
              toast.error(error.response?.data?.message || 'Failed to delete table');
            } finally {
              setDeletingTable(false);
            }
          }}
        />
      )}
    </div>
  );
};

const AddTableModal = ({ tables, onClose, onSaved }) => {
  const [number, setNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const trimmed = number.trim();
  const isDuplicate = trimmed !== '' && tables.some((t) => t.trim().toLowerCase() === trimmed.toLowerCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trimmed || isDuplicate) return;

    setSaving(true);
    try {
      const { data } = await axios.post('/api/vendor/tables', { number: trimmed });
      toast.success(`Table ${trimmed} added!`);
      onSaved(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add table');
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
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaQrcode className="text-red-500" /> Add Table
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Table Number
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g. 5"
              autoFocus
              className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 ${
                isDuplicate
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-red-500'
              }`}
            />
            {isDuplicate && (
              <p className="text-xs text-red-500 mt-1.5">Table {trimmed} is already added</p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving || isDuplicate || !trimmed}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaPlus />}
            Add Table
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const DeleteTableModal = ({ table, deleting, onClose, onConfirm }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
    onClick={() => !deleting && onClose()}
  >
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6 text-center"
    >
      <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4">
        <FaExclamationTriangle className="text-2xl" />
      </div>
      <h2 className="text-lg font-bold text-gray-800 dark:text-white">Delete table?</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
        Table "{table}" and its QR code will be removed. This can't be undone.
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={deleting}
          className="flex-1 py-2.5 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {deleting ? <FaSpinner className="animate-spin" /> : 'Delete'}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const OrderDetailsModal = ({ order, onClose }) => {
  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
  }[order.status] || 'bg-gray-100 text-gray-800';

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
          <div className="flex items-center gap-2">
            <FaReceipt className="text-red-500" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Order #{order.orderNumber}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <FaTimes className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{order.status}</span>
            <span className="text-gray-500 dark:text-gray-400">Table {order.tableId}</span>
            <span className="text-gray-400 dark:text-gray-500">·</span>
            <span className="text-gray-500 dark:text-gray-400">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
              {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="space-y-2">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-gray-500 dark:text-gray-400">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {order.note && (
            <div className="text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg p-2.5">
              {order.note}
            </div>
          )}

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>GST</span>
              <span>₹{order.gst}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 dark:text-white text-base pt-1">
              <span>Total</span>
              <span className="text-red-500">₹{order.total}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VendorDashboard;
