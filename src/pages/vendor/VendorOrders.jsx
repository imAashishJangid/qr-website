import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { FaCheck, FaCheckDouble, FaClock, FaUtensils, FaBell, FaSpinner, FaInbox, FaCommentDots } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { playNotificationChime } from '../../lib/notificationSound';
import axios, { notifyError } from '../../lib/api';
import Skeleton from '../../components/Skeleton';

// Order flow tabs: New → Preparing → Ready → Completed. Declined orders leave the board.
const ORDER_TABS = ['pending', 'preparing', 'ready', 'completed'];

// Shown on the order card — "pending" is presented as "New" to match the New Orders tab.
const STATUS_DISPLAY = { pending: 'New', preparing: 'Preparing', ready: 'Ready', completed: 'Completed', declined: 'Cancelled' };

const OTHER_REASON = 'Other';
const DECLINE_REASONS = [
  'Item unavailable',
  'Kitchen is closed',
  'Too busy right now',
  'Restaurant is closing soon',
  OTHER_REASON,
];

const VendorOrders = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [updating, setUpdating] = useState(null);
  const [decliningOrder, setDecliningOrder] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [customDeclineReason, setCustomDeclineReason] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get('/api/vendor/orders');
        setOrders(data);
      } catch (error) {
        notifyError(error, 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    if (!socket || !user?.id) return;

    socket.emit('join-vendor', localStorage.getItem('vendorToken'));

    const handleNewOrder = (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
      playNotificationChime();
      toast.success(`📦 New order #${newOrder.orderNumber} received!`);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('New Order!', { body: `Order #${newOrder.orderNumber} has been placed` });
      }
    };

    const handleOrderUpdate = (updatedOrder) => {
      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderUpdated', handleOrderUpdate);

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderUpdated', handleOrderUpdate);
    };
  }, [socket, user?.id]);

  const updateOrderStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const { data } = await axios.put(`/api/vendor/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data : o)));
      toast.success(status === 'preparing' ? 'Order accepted!' : `Order marked as ${status}`);
    } catch (error) {
      notifyError(error, 'Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const openDeclineModal = (orderId) => {
    setDeclineReason('');
    setCustomDeclineReason('');
    setDecliningOrder(orderId);
  };

  // The reason the customer will see: a preset, or the vendor's own text for "Other".
  const finalDeclineReason = (declineReason === OTHER_REASON ? customDeclineReason : declineReason).trim();

  const confirmDecline = async () => {
    if (!finalDeclineReason) {
      toast.error('Please select a reason for declining this order');
      return;
    }
    setUpdating(decliningOrder);
    try {
      const { data } = await axios.put(`/api/vendor/orders/${decliningOrder}/decline`, {
        reason: finalDeclineReason,
      });
      setOrders((prev) => prev.map((o) => (o._id === decliningOrder ? data : o)));
      toast.success('Order declined');
      setDecliningOrder(null);
      setDeclineReason('');
      setCustomDeclineReason('');
    } catch (error) {
      notifyError(error, 'Failed to decline order');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusIcon = (status) => ({
    pending: <FaClock className="text-gray-500 dark:text-gray-400" />,
    preparing: <FaUtensils className="text-gray-700 dark:text-gray-200" />,
    ready: <FaCheck className="text-gray-900 dark:text-white" />,
    completed: <FaCheckDouble className="text-gray-500 dark:text-gray-400" />,
  }[status] || <FaSpinner className="text-gray-500" />);

  const tabLabels = { pending: 'New Orders', preparing: 'Preparing', ready: 'Ready', completed: 'Completed' };

  const filteredOrders = orders.filter((order) => order.status === selectedTab);

  return (
    <div>
      <header className="lg:hidden safe-top sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <FaUtensils className="text-xl sm:text-2xl text-gray-800 dark:text-white flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-display font-bold text-gray-800 dark:text-white truncate">Orders</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{orders.length} total orders</p>
            </div>
          </div>
          <div className="relative flex-shrink-0">
            <FaBell className="text-xl sm:text-2xl text-gray-700 dark:text-white" />
            {orders.filter((o) => o.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 dark:bg-red-500 text-white dark:text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {orders.filter((o) => o.status === 'pending').length}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Desktop: title, tabs and bell in one row */}
        <div className="hidden lg:flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <FaUtensils className="text-2xl text-gray-800 dark:text-white" />
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-800 dark:text-white">Orders</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{orders.length} total orders</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1.5">
            {ORDER_TABS.map((tab) => {
              const count = orders.filter((o) => o.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedTab === tab
                      ? 'bg-red-500 dark:bg-red-500 text-white dark:text-white shadow-lg shadow-red-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{tabLabels[tab]}</span>
                  <span
                    className={`text-xs px-1.5 rounded-full ${
                      selectedTab === tab ? 'bg-white/20 dark:bg-black/10' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative flex-shrink-0">
            <FaBell className="text-2xl text-gray-700 dark:text-white" />
            {orders.filter((o) => o.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 dark:bg-red-500 text-white dark:text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {orders.filter((o) => o.status === 'pending').length}
              </span>
            )}
          </div>
        </div>

        {/* Mobile: tab bar */}
        <div className="lg:hidden grid grid-cols-4 gap-1 sm:gap-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1.5">
          {ORDER_TABS.map((tab) => {
            const count = orders.filter((o) => o.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`min-w-0 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 px-1 py-1.5 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold transition-all ${
                  selectedTab === tab
                    ? 'bg-red-500 dark:bg-red-500 text-white dark:text-white shadow-lg shadow-red-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="truncate max-w-full">{tabLabels[tab]}</span>
                <span
                  className={`text-[10px] sm:text-xs px-1.5 rounded-full flex-shrink-0 ${
                    selectedTab === tab ? 'bg-white/20 dark:bg-black/10' : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl lg:rounded-none shadow-lg overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-700 space-y-2">
                  <Skeleton className="h-6 w-24 rounded-lg" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <div className="p-4 lg:p-6 space-y-3">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-2/3 rounded" />
                  <Skeleton className="h-10 w-full rounded-xl lg:rounded-none mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 lg:py-24">
            <FaInbox className="text-6xl lg:text-7xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl lg:text-2xl font-semibold text-gray-600 dark:text-gray-400">No orders in {tabLabels[selectedTab]}</h3>
            <p className="text-gray-500 dark:text-gray-500 mt-2">{selectedTab === 'completed' ? 'Completed orders will show up here.' : 'Waiting for new orders to arrive...'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl lg:rounded-none shadow-lg hover:shadow-xl lg:hover:-translate-y-0.5 transition-all overflow-hidden lg:flex lg:flex-col"
                >
                  <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-block text-lg sm:text-xl lg:text-2xl font-extrabold text-gray-900 dark:text-white bg-white/70 dark:bg-black/20 px-2.5 py-0.5 rounded-lg lg:rounded-none">
                          Table {order.tableId}
                        </span>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">#{order.orderNumber}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {getStatusIcon(order.status)}
                        <span className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300">{STATUS_DISPLAY[order.status] || order.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 lg:p-6 lg:flex lg:flex-col lg:flex-1">
                    <div className="space-y-2 lg:space-y-3">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm lg:text-base">
                          <span className="text-gray-700 dark:text-gray-300">{item.quantity}x {item.name}</span>
                          <span className="text-gray-500 dark:text-gray-400">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {order.note && (
                      <div className="mt-3 flex items-start gap-2 text-sm bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200 border-l-2 border-red-500 dark:border-red-500 rounded-lg lg:rounded-none p-2.5">
                        <FaCommentDots className="mt-0.5 flex-shrink-0" />
                        <span>{order.note}</span>
                      </div>
                    )}

                    <div className="mt-4 lg:mt-6 pt-4 lg:pt-5 border-t border-gray-200 dark:border-gray-700 lg:flex-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-800 dark:text-white lg:text-lg">Total</span>
                        <span className="text-gray-900 dark:text-white lg:text-lg">₹{order.total}</span>
                      </div>
                    </div>

                    <div className="mt-4 lg:mt-6 flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openDeclineModal(order._id)}
                            disabled={updating === order._id}
                            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 lg:py-3.5 rounded-xl lg:rounded-none hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm lg:text-base font-semibold disabled:opacity-50"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order._id, 'preparing')}
                            disabled={updating === order._id}
                            className="flex-1 bg-red-500 dark:bg-red-500 text-white dark:text-white py-2.5 lg:py-3.5 rounded-xl lg:rounded-none hover:bg-red-600 dark:hover:bg-red-600 transition-colors text-sm lg:text-base font-semibold disabled:opacity-50"
                          >
                            {updating === order._id ? <FaSpinner className="animate-spin mx-auto" /> : 'Accept & Prepare'}
                          </button>
                        </>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'ready')}
                          disabled={updating === order._id}
                          className="flex-1 bg-red-500 dark:bg-red-500 text-white dark:text-white py-2.5 lg:py-3.5 rounded-xl lg:rounded-none hover:bg-red-600 dark:hover:bg-red-600 transition-colors text-sm lg:text-base font-semibold disabled:opacity-50"
                        >
                          {updating === order._id ? <FaSpinner className="animate-spin mx-auto" /> : 'Ready'}
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'completed')}
                          disabled={updating === order._id}
                          className="flex-1 bg-gray-700 dark:bg-gray-600 text-white py-2.5 lg:py-3.5 rounded-xl lg:rounded-none hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors text-sm lg:text-base font-semibold disabled:opacity-50"
                        >
                          {updating === order._id ? <FaSpinner className="animate-spin mx-auto" /> : 'Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {decliningOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setDecliningOrder(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Decline this order?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                The order will be cancelled. Select a reason — the customer will see it.
              </p>
              <div className="space-y-2" role="radiogroup" aria-label="Reason for declining">
                {DECLINE_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer text-sm transition-colors ${
                      declineReason === reason
                        ? 'border-red-500 dark:border-red-500 bg-gray-100 dark:bg-gray-700 text-red-500 dark:text-white font-semibold'
                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decline-reason"
                      value={reason}
                      checked={declineReason === reason}
                      onChange={() => setDeclineReason(reason)}
                      className="accent-red-500 dark:accent-white"
                    />
                    {reason}
                  </label>
                ))}
              </div>
              {declineReason === OTHER_REASON && (
                <textarea
                  autoFocus
                  value={customDeclineReason}
                  onChange={(e) => setCustomDeclineReason(e.target.value)}
                  placeholder="Type the reason for the customer"
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500"
                />
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setDecliningOrder(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDecline}
                  disabled={updating === decliningOrder || !finalDeclineReason}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 dark:bg-red-500 text-white dark:text-white font-semibold hover:bg-red-600 dark:hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {updating === decliningOrder ? <FaSpinner className="animate-spin mx-auto" /> : 'Confirm Decline'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VendorOrders;
