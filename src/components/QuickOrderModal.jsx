import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSpinner, FaClock, FaMinus, FaPlus } from 'react-icons/fa';
import axios from '../lib/api';
import { getCustomerId } from '../lib/customerId';
import toast from 'react-hot-toast';

const ESTIMATED_MINUTES = '15-20';

const QuickOrderModal = ({ item, vendorId, tableId, onClose }) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [tableNumber, setTableNumber] = useState(tableId || '');
  const [placing, setPlacing] = useState(false);

  const totalPrice = item.price * quantity;

  const handleConfirm = async () => {
    if (!tableNumber.trim()) {
      toast.error('Please enter your table number');
      return;
    }

    setPlacing(true);
    try {
      const { data } = await axios.post('/api/orders', {
        vendorId,
        tableId: tableNumber.trim(),
        customerId: getCustomerId(),
        items: [{ menuItemId: item._id, quantity }],
        note,
      });

      localStorage.setItem('lastOrderId', data.order._id);
      toast.success('Order sent! Please wait...');
      onClose();
      navigate(`/order-status/${data.order._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Order Now</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <FaTimes className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex items-center gap-4">
              <img
                src={item.image || 'https://placehold.co/80'}
                alt={item.name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 dark:text-white truncate">{item.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">₹{item.price} each</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <FaMinus className="text-xs" />
                </button>
                <span className="w-8 text-center font-semibold text-gray-800 dark:text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <FaPlus className="text-xs" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Table Number
              </label>
              <input
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Any message? (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="e.g. less spicy, no onions..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-2">
                <FaClock className="text-red-400" /> Estimated time
              </span>
              <span className="font-semibold">{ESTIMATED_MINUTES} mins</span>
            </div>

            <div className="flex items-center justify-between text-lg font-bold text-gray-800 dark:text-white">
              <span>Total</span>
              <span className="text-red-500">₹{totalPrice}</span>
            </div>

            <button
              onClick={handleConfirm}
              disabled={placing}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {placing ? (
                <>
                  <FaSpinner className="animate-spin" /> Sending order...
                </>
              ) : (
                'Confirm Order'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickOrderModal;
