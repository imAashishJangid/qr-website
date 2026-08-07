import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { FaCheck, FaClock, FaUtensils, FaBell, FaSpinner, FaInbox, FaCommentDots } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { playNotificationChime } from '../../lib/notificationSound';
import axios from '../../lib/api';
import Skeleton from '../../components/Skeleton';

const VendorOrders = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await axios.get('/api/vendor/orders');
        setOrders(data);
      } catch (error) {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    if (!socket || !user?.id) return;

    socket.emit('join-vendor', user.id);

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
      toast.success(status === 'preparing' ? 'Order received!' : `Order marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusIcon = (status) => ({
    pending: <FaClock className="text-yellow-500" />,
    preparing: <FaUtensils className="text-blue-500" />,
    ready: <FaCheck className="text-green-500" />,
  }[status] || <FaSpinner className="text-gray-500" />);

  const filteredOrders = orders.filter((order) => selectedTab === 'all' || order.status === selectedTab);

  return (
    <div>
      <header className="lg:hidden safe-top sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <FaUtensils className="text-xl sm:text-2xl text-red-500 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-display font-bold text-gray-800 dark:text-white truncate">Orders</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{orders.length} total orders</p>
            </div>
          </div>
          <div className="relative flex-shrink-0">
            <FaBell className="text-xl sm:text-2xl text-gray-700 dark:text-white" />
            {orders.filter((o) => o.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
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
            <FaUtensils className="text-2xl text-red-500" />
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-800 dark:text-white">Orders</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{orders.length} total orders</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1.5">
            {['pending', 'preparing', 'ready', 'all'].map((tab) => {
              const count = tab === 'all' ? orders.length : orders.filter((o) => o.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedTab === tab
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="capitalize">{tab}</span>
                  <span
                    className={`text-xs px-1.5 rounded-full ${
                      selectedTab === tab ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
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
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {orders.filter((o) => o.status === 'pending').length}
              </span>
            )}
          </div>
        </div>

        {/* Mobile: tab bar */}
        <div className="lg:hidden grid grid-cols-4 gap-1.5 sm:gap-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1.5">
          {['pending', 'preparing', 'ready', 'all'].map((tab) => {
            const count = tab === 'all' ? orders.length : orders.filter((o) => o.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  selectedTab === tab
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="capitalize truncate">{tab}</span>
                <span
                  className={`text-[10px] sm:text-xs px-1.5 rounded-full flex-shrink-0 ${
                    selectedTab === tab ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
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
            <h3 className="text-xl lg:text-2xl font-semibold text-gray-600 dark:text-gray-400">No orders in {selectedTab}</h3>
            <p className="text-gray-500 dark:text-gray-500 mt-2">Waiting for new orders to arrive...</p>
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
                        <span className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 capitalize">{order.status}</span>
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
                      <div className="mt-3 flex items-start gap-2 text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg lg:rounded-none p-2.5">
                        <FaCommentDots className="mt-0.5 flex-shrink-0" />
                        <span>{order.note}</span>
                      </div>
                    )}

                    <div className="mt-4 lg:mt-6 pt-4 lg:pt-5 border-t border-gray-200 dark:border-gray-700 lg:flex-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-800 dark:text-white lg:text-lg">Total</span>
                        <span className="text-red-500 lg:text-lg">₹{order.total}</span>
                      </div>
                    </div>

                    <div className="mt-4 lg:mt-6 flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'preparing')}
                          disabled={updating === order._id}
                          className="flex-1 bg-blue-500 text-white py-2.5 lg:py-3.5 rounded-xl lg:rounded-none hover:bg-blue-600 transition-colors text-sm lg:text-base font-semibold disabled:opacity-50"
                        >
                          {updating === order._id ? <FaSpinner className="animate-spin mx-auto" /> : 'Receive'}
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'ready')}
                          disabled={updating === order._id}
                          className="flex-1 bg-green-500 text-white py-2.5 lg:py-3.5 rounded-xl lg:rounded-none hover:bg-green-600 transition-colors text-sm lg:text-base font-semibold disabled:opacity-50"
                        >
                          {updating === order._id ? <FaSpinner className="animate-spin mx-auto" /> : 'Mark Ready'}
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'completed')}
                          disabled={updating === order._id}
                          className="flex-1 bg-gray-700 dark:bg-gray-600 text-white py-2.5 lg:py-3.5 rounded-xl lg:rounded-none hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors text-sm lg:text-base font-semibold disabled:opacity-50"
                        >
                          {updating === order._id ? <FaSpinner className="animate-spin mx-auto" /> : 'Complete Order'}
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
    </div>
  );
};

export default VendorOrders;
