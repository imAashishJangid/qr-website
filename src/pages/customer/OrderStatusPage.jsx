// frontend/src/pages/customer/OrderStatusPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useCart } from '../../context/CartContext';
import api from '../../lib/api';
import { getCustomerId } from '../../lib/customerId';
import { FaCheckCircle, FaClock, FaUtensils, FaSpinner, FaHome, FaReceipt } from 'react-icons/fa';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  pending: 'Order Received',
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

const OrderStatusPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { socket } = useSocket();
  const { clearCart } = useCart();
  const [orderStatus, setOrderStatus] = useState('pending');
  const [orderDetails, setOrderDetails] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(15);
  const [activeTab, setActiveTab] = useState('now');
  const [previousOrders, setPreviousOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Fetch the order from the backend on load
  useEffect(() => {
    if (!orderId) return;

    api.get(`/api/orders/${orderId}`)
      .then(({ data }) => {
        setOrderDetails(data);
        setOrderStatus(data.status || 'pending');
        setEstimatedTime(data.estimatedTime || 15);
      })
      .catch(() => {
        toast.error('Could not load this order');
      });
  }, [orderId]);

  // Join the order's room and listen for live status updates
  useEffect(() => {
    if (!socket || !orderId) return;

    socket.emit('join-order', orderId);

    const handleStatusUpdate = (data) => {
      setOrderStatus(data.status);
      setEstimatedTime(data.estimatedTime || 15);

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
    };

    socket.on('orderStatusUpdate', handleStatusUpdate);

    return () => {
      socket.off('orderStatusUpdate', handleStatusUpdate);
    };
  }, [socket, orderId, clearCart]);

  // Lazily load this device's order history (scoped server-side by customerId)
  // the first time the "Previous" tab is opened, so a completed order never
  // really disappears — and so it only ever shows orders from THIS customer,
  // not anyone else who ordered from the same table on a different day.
  useEffect(() => {
    if (activeTab !== 'previous' || historyLoaded) return;

    setHistoryLoading(true);
    api.get(`/api/orders/history/${getCustomerId()}`)
      .then(({ data }) => setPreviousOrders(data.orders || []))
      .finally(() => {
        setHistoryLoading(false);
        setHistoryLoaded(true);
      });
  }, [activeTab, historyLoaded]);

  const viewOrder = (id) => {
    setActiveTab('now');
    navigate(`/order-status/${id}`);
  };

  const getStatusIcon = () => {
    switch (orderStatus) {
      case 'pending':
        return <FaClock className="text-yellow-500 text-4xl sm:text-6xl animate-pulse" />;
      case 'preparing':
        return <FaUtensils className="text-blue-500 text-4xl sm:text-6xl animate-bounce" />;
      case 'ready':
        return <FaCheckCircle className="text-green-500 text-4xl sm:text-6xl animate-pulse" />;
      case 'completed':
        return <FaCheckCircle className="text-green-500 text-4xl sm:text-6xl" />;
      default:
        return <FaSpinner className="text-gray-500 text-4xl sm:text-6xl animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (orderStatus) {
      case 'pending':
        return 'Order Received';
      case 'preparing':
        return 'Preparing Your Order';
      case 'ready':
        return 'Order Ready for Pickup!';
      case 'completed':
        return 'Order Completed';
      default:
        return 'Processing...';
    }
  };

  const getStatusColor = () => {
    switch (orderStatus) {
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

  const getProgress = () => {
    const steps = {
      pending: 25,
      preparing: 50,
      ready: 75,
      completed: 100
    };
    return steps[orderStatus] || 0;
  };

  // Route "Home" back to the menu the customer scanned into, not the generic landing page
  const backToMenu = () => {
    const vendorId = localStorage.getItem('vendorId');
    const tableId = localStorage.getItem('tableId');
    navigate(vendorId && tableId ? `/menu/${vendorId}/${tableId}` : '/');
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
          <FaSpinner className="text-4xl text-red-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Loading Order...
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Please wait while we fetch your order details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
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
              <div className="flex items-center justify-center py-10">
                <FaSpinner className="text-3xl text-red-500 animate-spin" />
              </div>
            ) : previousOrders.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No previous orders yet on this device.
              </p>
            ) : (
              <div className="space-y-3">
                {previousOrders.map((order) => (
                  <button
                    key={order._id}
                    onClick={() => viewOrder(order._id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md ${
                      order._id === orderId
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10'
                        : 'border-gray-100 dark:border-gray-700 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FaReceipt className="text-gray-400 flex-shrink-0" />
                        <span className="font-semibold text-gray-800 dark:text-white truncate">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_BADGE_CLASSES[order.status] || STATUS_BADGE_CLASSES.pending}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="truncate">
                        {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'} ·{' '}
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-semibold text-red-500 flex-shrink-0">₹{order.total}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <>
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6"
        >
          <div className="text-center">
            {/* Status Icon */}
            <div className="mb-4">
              {getStatusIcon()}
            </div>

            {/* Status Text */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {getStatusText()}
            </h2>
            
            {/* Order Number */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Order #{orderDetails.orderNumber || 'N/A'}
            </p>

            {/* Estimated Time */}
            {orderStatus !== 'completed' && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  ⏰ Estimated Time: <span className="font-bold text-red-500">{estimatedTime} minutes</span>
                </p>
              </div>
            )}

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgress()}%` }}
                    transition={{ duration: 0.5 }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getStatusColor()}`}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Order Placed</span>
                <span>Preparing</span>
                <span>Ready</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Order Summary
          </h3>
          
          <div className="space-y-3">
            {orderDetails.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.quantity}x
                  </span>
                  <span className="text-gray-800 dark:text-white">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-red-500">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-800 dark:text-white">Total</span>
              <span className="text-red-500">₹{orderDetails.total}</span>
            </div>
          </div>
        </motion.div>

        {/* Action Button */}
        {orderStatus === 'ready' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-3 sm:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
            onClick={() => {
              toast.success('Thank you for dining with us! 🍽️');
              clearCart();
              localStorage.removeItem('lastOrderId');
              backToMenu();
            }}
          >
            ✅ Collect Order
          </motion.button>
        )}
          </>
        )}
      </div>
    </div>
  );
};

// ✅ IMPORTANT: Default export add karo
export default OrderStatusPage;