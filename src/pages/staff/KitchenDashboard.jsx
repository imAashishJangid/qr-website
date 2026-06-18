// frontend/src/pages/staff/KitchenDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { FaCheck, FaClock, FaUtensils, FaBell, FaSpinner, FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { Howl } from 'howler';

const KitchenDashboard = () => {
  const { socket } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending'); // pending, preparing, ready

  // Sound for new orders
  const [sound, setSound] = useState(null);

  useEffect(() => {
    // Initialize sound
    const newOrderSound = new Howl({
      src: ['/sounds/new-order.mp3'],
      volume: 0.5,
    });
    setSound(newOrderSound);

    return () => {
      if (newOrderSound) {
        newOrderSound.unload();
      }
    };
  }, []);

  useEffect(() => {
    // ✅ Check if socket exists
    if (!socket) {
      console.warn('Socket not connected yet');
      setLoading(false);
      return;
    }

    // Fetch initial orders
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/kitchen/orders');
        const data = await response.json();
        setOrders(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    };

    fetchOrders();

    // Listen for new orders
    const handleNewOrder = (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      
      // Play sound notification
      if (sound) {
        sound.play();
      }
      
      toast.success(`📦 New order #${newOrder.orderNumber} received!`);
      
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Order!', {
          body: `Order #${newOrder.orderNumber} has been placed`,
          icon: '/logo192.png'
        });
      }
    };

    // Listen for order updates
    const handleOrderUpdate = (updatedOrder) => {
      setOrders(prev => 
        prev.map(order => 
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderUpdated', handleOrderUpdate);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup
    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderUpdated', handleOrderUpdate);
    };
  }, [socket, sound]); // ✅ Added socket and sound as dependencies

  const updateOrderStatus = (orderId, status) => {
    if (!socket) {
      toast.error('Socket not connected');
      return;
    }

    socket.emit('updateOrderStatus', { orderId, status });
    toast.success(`Order status updated to ${status}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'preparing':
        return 'bg-blue-500';
      case 'ready':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'preparing':
        return <FaUtensils className="text-blue-500" />;
      case 'ready':
        return <FaCheck className="text-green-500" />;
      default:
        return <FaSpinner className="text-gray-500" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (selectedTab === 'all') return true;
    return order.status === selectedTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaUtensils className="text-2xl text-red-500" />
            <div>
              <h1 className="text-xl font-display font-bold text-gray-800 dark:text-white">
                Kitchen Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {orders.length} total orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-700" />}
            </button>
            
            <div className="relative">
              <FaBell className="text-2xl text-gray-700 dark:text-white" />
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {['pending', 'preparing', 'ready', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedTab === tab
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab !== 'all' && (
                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {orders.filter(o => o.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <FaUtensils className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
              No orders in {selectedTab} status
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mt-2">
              Waiting for new orders to arrive...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
                >
                  {/* Order Header */}
                  <div className={`p-4 ${getStatusColor(order.status)} bg-opacity-10`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Table {order.tableId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4">
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-800 dark:text-white">Total</span>
                        <span className="text-red-500">₹{order.total}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'preparing')}
                          className="flex-1 bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 transition-colors text-sm font-semibold"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'ready')}
                          className="flex-1 bg-green-500 text-white py-2 rounded-xl hover:bg-green-600 transition-colors text-sm font-semibold"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'completed')}
                          className="flex-1 bg-gray-500 text-white py-2 rounded-xl hover:bg-gray-600 transition-colors text-sm font-semibold"
                        >
                          Complete Order
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

export default KitchenDashboard; // ✅ Default export