// frontend/src/pages/customer/CartPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import axios from '../../lib/api';
import { getCustomerId } from '../../lib/customerId';
import { FaTrash, FaArrowLeft, FaCreditCard, FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';


const CartPage = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const subtotal = getTotal();
  const gst = subtotal * 0.05; // 5% GST
  const total = subtotal + gst;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    setIsPlacingOrder(true);
    try {
      const orderData = {
        vendorId: localStorage.getItem('vendorId'),
        tableId: localStorage.getItem('tableId'),
        customerId: getCustomerId(),
        items: items.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        gst,
        total,
      };

      const { data } = await axios.post('/api/orders', orderData);

      localStorage.setItem('lastOrderId', data.order._id);
      setOrderDetails(data.order);
      setShowSuccess(true);
      clearCart();

      // Navigate to order status after celebration
      setTimeout(() => {
        setShowSuccess(false);
        navigate(`/order-status/${data.order._id}`);
      }, 4000);
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <>
      {showSuccess && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all text-gray-700 dark:text-white flex-shrink-0"
              aria-label="Go back"
            >
              <FaArrowLeft />
            </button>
            <h1 className="text-xl sm:text-3xl font-display font-bold text-gray-800 dark:text-white">
              Your Cart
            </h1>
          </div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Looks like you haven't added any items yet.
              </p>
              <button
                onClick={() => navigate(-1)}
                className="mt-6 bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-3 rounded-full hover:shadow-lg transition-all"
              >
                Browse Menu
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 shadow-md flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 sm:flex-1 min-w-0">
                        <img
                          src={item.image || 'https://placehold.co/80/FF6B6B/FFFFFF?text=Food'}
                          alt={item.name}
                          className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            ₹{item.price} each
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="sm:hidden text-red-500 hover:text-red-700 transition-colors p-2 flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <FaTrash />
                        </button>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => updateQuantity(item._id, -1)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-sm sm:text-base"
                          >
                            -
                          </button>
                          <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base text-gray-800 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, 1)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-sm sm:text-base"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="hidden sm:inline-flex text-red-500 hover:text-red-700 transition-colors p-2 flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-md h-fit lg:sticky lg:top-24"
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">
                  Order Summary
                </h2>
                
                <div className="space-y-3 text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span>₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-800 dark:text-white">
                      <span>Total</span>
                      <span className="text-red-500">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || items.length === 0}
                  className="w-full mt-6 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <FaCreditCard /> Place Order
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                  By placing order, you agree to our terms and conditions
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartPage;