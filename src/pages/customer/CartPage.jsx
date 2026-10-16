// frontend/src/pages/customer/CartPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import axios from '../../lib/api';
import { getCustomerId } from '../../lib/customerId';
import { getScanSession } from '../../lib/scanSession';
import { loadCustomerDetails, saveCustomerDetails, isValidPhone } from '../../lib/customerDetails';
import { FaTrash, FaArrowLeft, FaCheck, FaUser, FaPhoneAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import ProductImage from '../../components/ProductImage';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customer, setCustomer] = useState(loadCustomerDetails);
  const [phoneTouched, setPhoneTouched] = useState(false);

  // No GST: the bill is just the items (the server calculates the same total itself).
  const total = Number(getTotal().toFixed(2));

  const nameValid = customer.name.trim().length > 0;
  const phoneValid = isValidPhone(customer.phone);
  const canOrder = items.length > 0 && nameValid && phoneValid && !isPlacingOrder;

  const handlePlaceOrder = async () => {
    if (!canOrder) return;

    setIsPlacingOrder(true);
    try {
      const orderData = {
        ...getScanSession(),
        customerId: getCustomerId(),
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        items: items.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        total,
      };

      const { data } = await axios.post('/api/orders', orderData);

      saveCustomerDetails(customer);
      localStorage.setItem('lastOrderId', data.order._id);
      setShowSuccess(true);
      clearCart();

      // Navigate to order status after celebration
      setTimeout(() => {
        setShowSuccess(false);
        navigate(`/order-status/${data.order._id}`);
      }, 4000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const inputClass = (invalid) =>
    `w-full pl-10 pr-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-colors ${
      invalid ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'
    }`;

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
        <div className="max-w-3xl mx-auto px-3 sm:px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-gray-700 dark:text-white flex-shrink-0"
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
                {showSuccess ? 'Order placed!' : 'Your cart is empty'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {showSuccess ? 'Taking you to your order status...' : "Looks like you haven't added any items yet."}
              </p>
              {!showSuccess && (
                <button
                  onClick={() => navigate(-1)}
                  className="mt-6 bg-red-500 dark:bg-red-500 text-white dark:text-white px-8 py-3 rounded-full hover:bg-red-600 dark:hover:bg-red-600 hover:shadow-lg transition-all"
                >
                  Browse Menu
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Cart Items */}
              <div className="space-y-3 sm:space-y-4">
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
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            ₹{item.price} × {item.quantity}
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
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm sm:text-base"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base text-gray-800 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, 1)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm sm:text-base"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span className="w-20 text-right font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
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

              {/* Customer details + Bill */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-md"
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4">
                  Your Details
                </h2>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        id="customer-name"
                        type="text"
                        autoComplete="name"
                        value={customer.name}
                        onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name"
                        className={inputClass(false)}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="customer-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FaPhoneAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        id="customer-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={16}
                        value={customer.phone}
                        onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                        onBlur={() => setPhoneTouched(true)}
                        placeholder="10-digit mobile number"
                        className={inputClass(phoneTouched && customer.phone && !phoneValid)}
                      />
                    </div>
                    {phoneTouched && customer.phone && !phoneValid && (
                      <p className="text-xs text-red-500 mt-1.5">Please enter a valid 10-digit mobile number</p>
                    )}
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mt-6 mb-3">
                  Bill Details
                </h2>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between pt-3 mt-1 border-t border-dashed border-gray-200 dark:border-gray-600 text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    <span>To Pay</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={!canOrder}
                  className="w-full mt-6 bg-red-500 dark:bg-red-500 text-white dark:text-white py-3 rounded-xl font-semibold hover:bg-red-600 dark:hover:bg-red-600 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-900 dark:disabled:hover:bg-white flex items-center justify-center gap-2"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <FaCheck /> Confirm &amp; Order
                    </>
                  )}
                </button>

                {!canOrder && !isPlacingOrder && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                    Enter your name and a valid phone number to place the order
                  </p>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartPage;
