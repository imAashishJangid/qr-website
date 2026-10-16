import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { motion } from 'framer-motion';
import {
  FaUtensils,
  FaMoneyBillWave,
  FaBoxOpen,
  FaMoon,
  FaSun,
  FaClock,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaReceipt,
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import axios, { notifyError } from '../../lib/api';
import toast from 'react-hot-toast';
import Skeleton from '../../components/Skeleton';
import { playNotificationChime } from '../../lib/notificationSound';
import QrCodesSection from '../../components/QrCodesSection';

const VendorDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [qrData, setQrData] = useState({ qrCodes: [], usage: null });
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
      notifyError(error, 'Failed to load recent orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    // Recent orders load alongside stats and tables instead of waiting for them.
    const recentOrdersRequest = fetchRecentOrders(1, '');
    try {
      const [statsRes, tablesRes] = await Promise.all([
        axios.get('/api/vendor/stats'),
        axios.get('/api/vendor/tables'),
      ]);

      setStats(statsRes.data);
      setQrData(tablesRes.data);
    } catch (error) {
      notifyError(error, 'Failed to load dashboard data');
    } finally {
      await recentOrdersRequest;
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

    socket.emit('join-vendor', localStorage.getItem('vendorToken'));

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

  const statCards = [
    { title: "Today's Orders", value: stats.todayOrders, icon: <FaUtensils className="text-2xl lg:text-3xl" />, color: 'bg-red-500' },
    { title: "Today's Revenue", value: `₹${stats.todayRevenue}`, icon: <FaMoneyBillWave className="text-2xl lg:text-3xl" />, color: 'bg-red-500' },
    { title: 'Total Products', value: stats.totalProducts, icon: <FaBoxOpen className="text-2xl lg:text-3xl" />, color: 'bg-red-500' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: <FaClock className="text-2xl lg:text-3xl" />, color: 'bg-red-500' },
  ];

  return (
    <div>
      <header className="lg:hidden safe-top sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('/vendor/dashboard')}
            className="flex items-center gap-2.5 min-w-0"
          >
            <div className="w-9 h-9 overflow-hidden rounded-xl shadow-md shadow-red-500/30 flex-shrink-0">
              <img src="/applogo.jpeg" alt="HiaQr" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 text-left">
              <h1 className="text-lg sm:text-2xl font-display font-bold text-gray-800 dark:text-white truncate">
                {user?.restaurantName || 'Dashboard'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                Welcome back, {user?.name || 'Vendor'} 👋
              </p>
            </div>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            {theme === 'dark' ? <FaSun className="text-red-400" /> : <FaMoon className="text-gray-700" />}
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
              className="bg-white dark:bg-gray-800 rounded-2xl lg:rounded-none shadow-lg lg:hover:shadow-xl lg:hover:-translate-y-0.5 transition-all p-4 sm:p-6 lg:p-7"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 truncate">{stat.title}</p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mt-1 lg:mt-2">
                    {loading ? <Skeleton className="h-6 lg:h-8 w-14 rounded-lg" /> : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 lg:p-4 rounded-xl lg:rounded-none text-white flex-shrink-0`}>{stat.icon}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <QrCodesSection data={qrData} onChange={setQrData} loading={loading} />

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-2xl lg:rounded-none shadow-lg p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">Recent Orders</h2>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDateFilterChange('')}
                className={`px-3 py-1.5 rounded-lg lg:rounded-none text-xs sm:text-sm font-medium transition-colors ${
                  dateFilter === '' ? 'bg-red-500 dark:bg-red-500 text-white dark:text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleDateFilterChange(todayStr)}
                className={`px-3 py-1.5 rounded-lg lg:rounded-none text-xs sm:text-sm font-medium transition-colors ${
                  dateFilter === todayStr ? 'bg-red-500 dark:bg-red-500 text-white dark:text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleDateFilterChange(yesterdayStr)}
                className={`px-3 py-1.5 rounded-lg lg:rounded-none text-xs sm:text-sm font-medium transition-colors ${
                  dateFilter === yesterdayStr ? 'bg-red-500 dark:bg-red-500 text-white dark:text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
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
                  className="pl-7 pr-2 py-1.5 rounded-lg lg:rounded-none border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {loading || ordersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-3 lg:p-4 rounded-xl lg:rounded-none border border-gray-100 dark:border-gray-700">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-3 w-40 rounded" />
                  </div>
                  <Skeleton className="h-4 w-14 rounded flex-shrink-0" />
                  <Skeleton className="h-7 w-16 rounded-lg flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No orders {dateFilter ? 'on this date' : 'yet'}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 lg:px-4 pb-2 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                <span className="flex-1">Order</span>
                <span className="flex-shrink-0 w-14 sm:w-20 lg:w-24 text-right">Price</span>
                <span className="flex-shrink-0 w-14 sm:w-20 lg:w-24 text-right">Details</span>
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
                          className="flex items-center gap-2 p-3 lg:p-4 rounded-xl lg:rounded-none border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="min-w-0 flex-1 lg:flex lg:items-center lg:gap-6">
                            <div className="flex items-center gap-2 flex-wrap lg:flex-shrink-0">
                              <span className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">
                                Table {order.tableId}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full lg:rounded-none text-xs font-semibold ${
                                  order.status === 'pending'
                                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                                    : order.status === 'preparing'
                                    ? 'bg-gray-300 text-gray-900 dark:bg-gray-500 dark:text-white'
                                    : order.status === 'ready'
                                    ? 'bg-red-500 text-white dark:bg-red-500 dark:text-white'
                                    : order.status === 'declined'
                                    ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
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
                            <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg">₹{order.total}</span>
                          </div>
                          <div className="flex-shrink-0 w-14 sm:w-20 lg:w-24 text-right">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-xs px-3 py-1.5 rounded-lg lg:rounded-none bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-colors"
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
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg lg:rounded-none text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft className="text-xs" /> Prev
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Page {ordersPage} of {ordersTotalPages}
                  </span>
                  <button
                    onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
                    disabled={ordersPage >= ordersTotalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg lg:rounded-none text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
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
    </div>
  );
};

const OrderDetailsModal = ({ order, onClose }) => {
  const statusColor = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    preparing: 'bg-gray-300 text-gray-900 dark:bg-gray-500 dark:text-white',
    ready: 'bg-red-500 text-white dark:bg-red-500 dark:text-white',
    declined: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    completed: order.status === 'declined'
                                    ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-gray-100 text-gray-800',
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
            <FaReceipt className="text-gray-800 dark:text-white" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Order #{order.orderNumber}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
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
            <div className="text-sm bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border-l-2 border-red-500 dark:border-red-500 rounded-lg p-2.5">
              {order.note}
            </div>
          )}

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5 text-sm">
            {order.gst > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
            )}
            {order.gst > 0 && (
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>GST</span>
                <span>₹{order.gst}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800 dark:text-white text-base pt-1">
              <span>Total</span>
              <span className="text-gray-900 dark:text-white">₹{order.total}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default VendorDashboard;
