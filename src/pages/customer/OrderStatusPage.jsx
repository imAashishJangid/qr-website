// frontend/src/pages/customer/OrderStatusPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useCart } from '../../context/CartContext';
import api from '../../lib/api';
import { getCustomerId } from '../../lib/customerId';
import { playNotificationChime } from '../../lib/notificationSound';
import { FaCheckCircle, FaClock, FaUtensils, FaSpinner, FaHome, FaReceipt, FaCommentDots } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Skeleton from '../../components/Skeleton';

const STATUS_LABELS = {
  pending: 'Order Placed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
};

const STATUS_BADGE_CLASSES = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  preparing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ready: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
      return <FaClock className="text-yellow-500 text-4xl sm:text-6xl lg:text-4xl animate-pulse" />;
    case 'preparing':
      return <FaUtensils className="text-blue-500 text-4xl sm:text-6xl lg:text-4xl animate-bounce" />;
    case 'ready':
      return <FaCheckCircle className="text-green-500 text-4xl sm:text-6xl lg:text-4xl animate-pulse" />;
    case 'completed':
      return <FaCheckCircle className="text-green-500 text-4xl sm:text-6xl lg:text-4xl" />;
    default:
      return <FaSpinner className="text-gray-500 text-4xl sm:text-6xl lg:text-4xl animate-spin" />;
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Order Placed';
    case 'preparing':
      return 'Order Received! Preparing, Please Wait...';
    case 'ready':
      return 'Order Ready for Pickup!';
    case 'completed':
      return 'Order Completed';
    default:
      return 'Processing...';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500';
    case 'preparing':
      return 'bg-blue-500';
    case 'ready':
      return 'bg-green-500';
    case 'completed':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

const getProgress = (status) => {
  const steps = { pending: 25, preparing: 50, ready: 75, completed: 100 };
  return steps[status] || 0;
};

const OrderStatusPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { socket } = useSocket();
  const { clearCart } = useCart();
  const [activeOrders, setActiveOrders] = useState([]);
  const [activeLoading, setActiveLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('now');
  const [previousOrders, setPreviousOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const joinedRoomsRef = useRef(new Set());

  // Load every currently-active (non-completed) order for this device, not just
  // the one in the URL — a customer can have several orders in flight at once.
  const fetchActiveOrders = () => {
    setActiveLoading(true);
    api.get(`/api/orders/history/${getCustomerId()}`)
      .then(({ data }) => {
        const active = (data.orders || []).filter((o) => o.status !== 'completed');

        if (orderId && !active.some((o) => o._id === orderId)) {
          return api.get(`/api/orders/${orderId}`)
            .then(({ data: order }) => {
              setActiveOrders(order.status !== 'completed' ? [order, ...active] : active);
            })
            .catch(() => setActiveOrders(active));
        }

        setActiveOrders(active);
      })
      .catch(() => toast.error('Could not load your orders'))
      .finally(() => setActiveLoading(false));
  };

  useEffect(() => {
    fetchActiveOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Join each active order's room (once) and listen for live status updates.
  // A status change on any joined order re-syncs the whole active list, since
  // the event doesn't carry enough info to patch a single entry in place.
  useEffect(() => {
    if (!socket) return;
    activeOrders.forEach((order) => {
      if (!joinedRoomsRef.current.has(order._id)) {
        socket.emit('join-order', order._id);
        joinedRoomsRef.current.add(order._id);
      }
    });
  }, [socket, activeOrders]);

  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data) => {
      playNotificationChime();

      if (data.status === 'preparing') {
        toast.success('👨‍🍳 Order received! Preparing your food.');
      }
      if (data.status === 'ready') {
        toast.success('🎉 Your order is ready for pickup!');
      }
      if (data.status === 'completed') {
        toast.success('✅ Order completed! Thank you for dining with us.');
        clearCart();
        localStorage.removeItem('lastOrderId');
      }

      fetchActiveOrders();
    };

    socket.on('orderStatusUpdate', handleStatusUpdate);
    return () => {
      socket.off('orderStatusUpdate', handleStatusUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Lazily load this device's order history (scoped server-side by customerId)
  // the first time the "Previous" tab is opened, so a completed order never
  // really disappears — and so it only ever shows orders from THIS customer,
  // not anyone else who ordered from the same table on a different day.
  useEffect(() => {
    if (activeTab !== 'previous' || historyLoaded) return;

    setHistoryLoading(true);
    api.get(`/api/orders/history/${getCustomerId()}`)
      .then(({ data }) => setPreviousOrders((data.orders || []).filter((o) => o.status === 'completed')))
      .finally(() => {
        setHistoryLoading(false);
        setHistoryLoaded(true);
      });
  }, [activeTab, historyLoaded]);

  // Route "Home" back to the menu the customer scanned into, not the generic landing page
  const backToMenu = () => {
    const vendorId = localStorage.getItem('vendorId');
    const tableId = localStorage.getItem('tableId');
    navigate(vendorId && tableId ? `/menu/${vendorId}/${tableId}` : '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="max-w-2xl lg:max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-800 dark:text-white">
            Order Status
          </h1>
          <button
            onClick={backToMenu}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-all text-gray-700 dark:text-white text-sm sm:text-base"
          >
            <FaHome /> Home
          </button>
        </div>

        {/* Now / Previous Tabs */}
        <div className="flex gap-2 mb-6 bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-md w-fit mx-auto sm:mx-0">
          {[
            { key: 'now', label: 'Now' },
            { key: 'previous', label: 'Previous' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 sm:px-6 py-2 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'previous' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Previous Orders
            </h3>

            {historyLoading ? (
              <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl lg:rounded-none border border-gray-200 dark:border-gray-600 bg-gray-50/60 dark:bg-gray-700/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Skeleton className="h-4 w-20 rounded" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-2/3 rounded" />
                    <div className="flex items-center justify-between mt-2">
                      <Skeleton className="h-3 w-24 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : previousOrders.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No previous orders yet on this device.
              </p>
            ) : (
              <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-4">
                {previousOrders.map((order) => (
                  <div
                    key={order._id}
                    className="p-4 lg:p-4 rounded-xl lg:rounded-none border border-gray-200 dark:border-gray-600 shadow-sm bg-gray-50/60 dark:bg-gray-700/40 lg:flex lg:flex-col"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FaReceipt className="text-gray-400 flex-shrink-0" />
                        <span className="font-semibold text-gray-800 dark:text-white truncate">
                          #{order.orderNumber}
                          {order.tableId && <span className="font-normal text-gray-500 dark:text-gray-400"> · Table {order.tableId}</span>}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full lg:rounded-none flex-shrink-0 ${STATUS_BADGE_CLASSES[order.status] || STATUS_BADGE_CLASSES.pending}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    {order.items?.length > 0 && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate mt-1.5">
                        {order.items.map((item) => item.name).join(', ')}
                      </p>
                    )}
                    {order.note && (
                      <div className="flex items-start gap-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg lg:rounded-none p-2 mt-2">
                        <FaCommentDots className="mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{order.note}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400 lg:mt-auto lg:pt-2">
                      <span className="truncate">
                        {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'} ·{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-semibold text-red-500 flex-shrink-0">₹{order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : activeLoading ? (
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:items-start">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl lg:rounded-none shadow-xl lg:shadow-lg p-6 sm:p-8 lg:p-5">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-10 w-10 rounded-full mb-4 lg:mb-3" />
                  <Skeleton className="h-5 w-32 rounded mb-2" />
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-10 w-full rounded-xl lg:rounded-none mt-4" />
                  <Skeleton className="h-2 w-full rounded-full mt-6" />
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No active orders right now.</p>
            <button
              onClick={backToMenu}
              className="mt-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:items-start">
            {activeOrders.map((order) => (
              <div key={order._id} className="lg:flex lg:flex-col lg:h-full">
                {/* Order Card — status + summary combined so it's obviously one order */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl lg:rounded-none shadow-xl lg:shadow-lg p-6 sm:p-8 lg:p-5 lg:flex lg:flex-col lg:flex-1"
                >
                  <div className="text-center">
                    {/* Status Icon */}
                    <div className="mb-4 lg:mb-3">
                      {getStatusIcon(order.status)}
                    </div>

                    {/* Status Text */}
                    <h2 className="text-xl sm:text-2xl lg:text-base font-bold text-gray-800 dark:text-white mb-2">
                      {getStatusText(order.status)}
                    </h2>

                    {/* Order Number & Table */}
                    <p className="text-sm lg:text-xs text-gray-500 dark:text-gray-400">
                      Order #{order.orderNumber || 'N/A'}
                      {order.tableId && ` · Table ${order.tableId}`}
                    </p>

                    {/* Estimated Time */}
                    {order.status !== 'completed' && (
                      <div className="mt-4 lg:mt-3 p-3 lg:p-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl lg:rounded-none">
                        <p className="text-sm lg:text-xs text-gray-600 dark:text-gray-300">
                          ⏰ Estimated Time: <span className="font-bold text-red-500">{order.estimatedTime || 15} minutes</span>
                        </p>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-6 lg:mt-4">
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded-full lg:rounded-none bg-gray-200 dark:bg-gray-700">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgress(order.status)}%` }}
                            transition={{ duration: 0.5 }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getStatusColor(order.status)}`}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs lg:text-[10px] text-gray-500 dark:text-gray-400">
                        <span>Order Placed</span>
                        <span>Preparing</span>
                        <span>Ready</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="mt-6 lg:mt-4 pt-6 lg:pt-4 border-t border-gray-100 dark:border-gray-700 lg:flex-1 lg:flex lg:flex-col">
                    <h3 className="text-lg lg:text-sm font-semibold text-gray-800 dark:text-white mb-4 lg:mb-3">
                      Order Summary
                    </h3>

                    <div className="space-y-3 lg:space-y-2 lg:flex-1">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 lg:py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <div className="flex items-center gap-3 lg:gap-2">
                            <span className="text-sm lg:text-xs font-medium text-gray-700 dark:text-gray-300">
                              {item.quantity}x
                            </span>
                            <span className="text-gray-800 dark:text-white lg:text-xs">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-sm lg:text-xs font-semibold text-red-500">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.note && (
                      <div className="mt-3 lg:mt-2 flex items-start gap-2 text-sm lg:text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg lg:rounded-none p-2.5">
                        <FaCommentDots className="mt-0.5 flex-shrink-0" />
                        <span>{order.note}</span>
                      </div>
                    )}

                    <div className="mt-4 lg:mt-3 pt-4 lg:pt-3 border-t-2 border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-lg lg:text-base font-bold">
                        <span className="text-gray-800 dark:text-white">Total</span>
                        <span className="text-red-500">₹{order.total}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Ready Notice */}
                {order.status === 'ready' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full mt-6 lg:mt-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 sm:py-4 lg:py-2.5 rounded-xl lg:rounded-none shadow-lg text-center text-sm lg:text-xs sm:text-base"
                  >
                    ✅ Order Ready for Pickup! Please Collect
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ IMPORTANT: Default export add karo
export default OrderStatusPage;
