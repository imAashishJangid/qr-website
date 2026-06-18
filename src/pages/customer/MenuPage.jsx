// frontend/src/pages/customer/MenuPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  FaSearch, 
  FaShoppingCart, 
  FaMoon, 
  FaSun, 
  FaFilter,
  FaLeaf,
  FaStar,
  FaClock,
  FaFire,
  FaArrowLeft,
  FaArrowRight,
  FaSpinner
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const MenuPage = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { addToCart, getTotalItems, cart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const categoriesRef = useRef(null);

  // Fetch menu items
  const { data: menuData, isLoading, error } = useQuery({
    queryKey: ['menu', tableId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/menu/${tableId}`);
      return data;
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories', tableId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/menu/categories/${tableId}`);
      return data;
    },
  });

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuantityChange = (itemId, change) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  const handleAddToCart = (item) => {
    const quantity = quantities[item._id] || 1;
    if (quantity > 0) {
      addToCart({ ...item, quantity });
      setQuantities(prev => ({ ...prev, [item._id]: 0 }));
      toast.success(`Added ${item.name} to cart!`, {
        icon: '🛒',
        duration: 2000,
      });
    }
  };

  const scrollCategories = (direction) => {
    if (categoriesRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      categoriesRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredItems = menuData?.items?.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get cart total items count
  const totalItems = getTotalItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-2xl sm:text-3xl bg-gradient-to-r from-red-500 to-orange-500 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-red-500/20"
              >
                🍽️
              </motion.div>
              <div>
                <h1 className="text-base sm:text-xl font-display font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  Smart QR Food
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <FaClock className="text-red-400 text-[10px]" />
                  Table #{tableId}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <FaSun className="text-yellow-500 text-base sm:text-xl" />
                ) : (
                  <FaMoon className="text-gray-700 text-base sm:text-xl" />
                )}
              </button>
              
              {/* Enhanced Cart Button */}
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 group"
                aria-label="View cart"
              >
                <div className="relative">
                  <FaShoppingCart className="text-xl sm:text-2xl text-gray-700 dark:text-white group-hover:text-red-500 transition-colors" />
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] sm:text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg shadow-red-500/50"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="mt-3 relative">
            <div className="relative group">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm group-hover:text-red-500 transition-colors" />
              <input
                type="text"
                placeholder="Search for delicious food..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-700/80 text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 backdrop-blur-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Categories with Scroll */}
      <div className="sticky top-[120px] sm:top-[140px] z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 relative">
          <div className="relative flex items-center">
            {/* Left Scroll Button */}
            <button
              onClick={() => scrollCategories('left')}
              className="absolute left-0 z-10 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 hidden sm:flex"
            >
              <FaArrowLeft className="text-xs text-gray-600 dark:text-gray-300" />
            </button>

            {/* Categories */}
            <div
              ref={categoriesRef}
              className="flex gap-2 sm:gap-3 pb-1 overflow-x-auto scrollbar-hide px-4 sm:px-8"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30 scale-105'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 hover:scale-105'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <FaFire className="text-xs" />
                  All Items
                </span>
              </button>
              {categories?.map(category => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategory(category._id)}
                  className={`flex-shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 whitespace-nowrap ${
                    selectedCategory === category._id
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30 scale-105'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 hover:scale-105'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {category.icon} {category.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => scrollCategories('right')}
              className="absolute right-0 z-10 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 hidden sm:flex"
            >
              <FaArrowRight className="text-xs text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FaSpinner className="text-red-500 text-2xl animate-pulse" />
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium animate-pulse">
              Loading delicious food...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😢</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Failed to load menu
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Please try again later
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredItems?.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              No items found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredItems?.length}</span> items
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaFilter /> Filtered
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              <AnimatePresence mode="wait">
                {filteredItems?.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ 
                      delay: index * 0.05,
                      duration: 0.4,
                      ease: "easeOut"
                    }}
                    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:transform hover:-translate-y-2 hover:scale-[1.01]"
                    whileHover={{ y: -4 }}
                  >
                    {/* Image Container */}
                    <div className="relative w-full pt-[75%] sm:pt-[66.67%] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                      <img
                        src={item.image || 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Food'}
                        alt={item.name}
                        className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Food';
                        }}
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                        {item.isBestseller && (
                          <motion.span
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-1"
                          >
                            <FaStar className="text-[8px] sm:text-[10px]" /> Bestseller
                          </motion.span>
                        )}
                        {item.isNew && (
                          <motion.span
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg"
                          >
                            New
                          </motion.span>
                        )}
                      </div>
                      
                      {/* Veg/Non-Veg Badge */}
                      <div className="absolute top-2 right-2">
                        {item.isVeg ? (
                          <span className="bg-green-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-lg flex items-center gap-1">
                            <FaLeaf className="text-[10px] sm:text-xs" /> Veg
                          </span>
                        ) : (
                          <span className="bg-red-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-lg">
                            Non-Veg
                          </span>
                        )}
                      </div>

                      {/* Quick Add Button */}
                      <button
                        onClick={() => {
                          setQuantities(prev => ({ ...prev, [item._id]: 1 }));
                          handleAddToCart(item);
                        }}
                        className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 p-1.5 sm:p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                        aria-label="Quick add"
                      >
                        <FaShoppingCart className="text-red-500 text-xs sm:text-sm" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-white line-clamp-1 flex-1">
                          {item.name}
                        </h3>
                        {item.rating && (
                          <span className="flex items-center gap-0.5 text-xs text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            <FaStar className="text-[10px]" /> {item.rating}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] leading-relaxed">
                        {item.description || 'Delicious food item prepared with fresh ingredients'}
                      </p>
                      
                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div>
                          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                            ₹{item.price}
                          </span>
                          {item.originalPrice && (
                            <span className="text-xs text-gray-400 line-through ml-2">
                              ₹{item.originalPrice}
                            </span>
                          )}
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-full p-1">
                          <button
                            onClick={() => handleQuantityChange(item._id, -1)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center text-sm sm:text-base shadow-sm"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base text-gray-800 dark:text-white">
                            {quantities[item._id] || 0}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item._id, 1)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center text-sm sm:text-base shadow-sm"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      {/* Add to Cart Button */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddToCart(item)}
                        disabled={!quantities[item._id]}
                        className={`w-full mt-3 font-semibold py-2 sm:py-2.5 text-sm sm:text-base rounded-xl transition-all duration-300 ${
                          quantities[item._id]
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02]'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {quantities[item._id] ? (
                          <span className="flex items-center justify-center gap-2">
                            <FaShoppingCart className="text-sm" />
                            Add to Cart
                          </span>
                        ) : (
                          'Select quantity'
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-red-500 to-orange-500 text-white p-3 sm:p-4 rounded-full shadow-2xl shadow-red-500/50 hover:shadow-red-500/70 transition-all duration-300 hover:scale-110"
          >
            <FaArrowLeft className="rotate-90 text-sm sm:text-base" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Cart Button (Mobile) */}
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 sm:hidden"
        >
          <button
            onClick={() => navigate('/cart')}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-2xl shadow-red-500/50 flex items-center gap-3"
          >
            <FaShoppingCart className="text-lg" />
            <span className="font-semibold">{totalItems} items in cart</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
              ₹{cart?.reduce((total, item) => total + item.price * item.quantity, 0) || 0}
            </span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default MenuPage;