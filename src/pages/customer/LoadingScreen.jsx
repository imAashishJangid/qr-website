// frontend/src/pages/customer/LoadingScreen.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';

const foodEmojis = ['🍕', '🍔', '🍟', '☕', '🥪', '🍝', '🥟', '🥤'];

// ✅ PNG Images (Direct download URLs)
const foodImages = [
  'https://cdn-icons-png.flaticon.com/512/3132/3132694.png',
  'https://cdn-icons-png.flaticon.com/512/3132/3132694.png',
  'https://cdn-icons-png.flaticon.com/512/3075/3075977.png',
  'https://cdn-icons-png.flaticon.com/512/1046/1046779.png',
  'https://cdn-icons-png.flaticon.com/512/2413/2413092.png',
  'https://cdn-icons-png.flaticon.com/512/3670/3670664.png',
  'https://cdn-icons-png.flaticon.com/512/3627/3627484.png',
];

// ✅ Alternative - More food PNGs
const foodPngs = [
  'https://cdn-icons-png.flaticon.com/512/3132/3132694.png', // Pizza
  'https://cdn-icons-png.flaticon.com/512/1046/1046779.png', // Burger
  'https://cdn-icons-png.flaticon.com/512/3075/3075977.png', // Fries
  'https://cdn-icons-png.flaticon.com/512/2413/2413092.png', // Coffee
  'https://cdn-icons-png.flaticon.com/512/3670/3670664.png', // Pasta
  'https://cdn-icons-png.flaticon.com/512/3627/3627484.png', // Sandwich
  'https://cdn-icons-png.flaticon.com/512/3025/3025222.png', // Donut
  'https://cdn-icons-png.flaticon.com/512/741/741125.png', // Salad
];

const LoadingScreen = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // Redirect if no tableId
    if (!tableId) {
      navigate('/');
      return;
    }

    // Rotate food emojis
    const emojiInterval = setInterval(() => {
      setCurrentEmojiIndex((prev) => (prev + 1) % foodEmojis.length);
    }, 400);

    // Rotate food images
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % foodImages.length);
    }, 2000);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    // Navigate to menu after loading
    const timer = setTimeout(() => {
      navigate(`/menu/${tableId}`);
    }, 3500);

    // Socket connection
    if (socket) {
      socket.emit('join-table', tableId);
    }

    return () => {
      clearInterval(emojiInterval);
      clearInterval(imageInterval);
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [tableId, navigate, socket]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl mx-auto">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-full blur-3xl opacity-20 animate-pulse" />
        
        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/20">
          
          <div className="text-center">
            
            {/* ✅ PNG Image Carousel */}
            <div className="relative w-full max-w-xs sm:max-w-sm mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl aspect-square bg-gradient-to-br from-red-100 to-orange-100 dark:from-gray-700 dark:to-gray-800">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={foodImages[currentImageIndex]}
                  alt="Delicious Food"
                  className="w-full h-full object-contain p-4"
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.2, rotate: 10 }}
                  transition={{ duration: 0.6 }}
                  onError={(e) => {
                    // ✅ Fallback if image fails
                    e.target.src = 'https://cdn-icons-png.flaticon.com/512/3132/3132694.png';
                  }}
                />
              </AnimatePresence>
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              
              {/* Image Badge */}
              <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                <span className="text-base">🍽️</span>
                Delicious Food
              </div>

              {/* Image Counter */}
              <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs">
                {currentImageIndex + 1}/{foodImages.length}
              </div>
            </div>

            {/* Animated Logo */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse" />
              <div className="absolute inset-1 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">🍽️</span>
              </div>
            </motion.div>

            {/* Restaurant Name */}
            <h1 className="text-2xl sm:text-3xl font-display font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-1">
              Smart QR Food
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
              Loading your delicious menu...
            </p>

            {/* Floating Food Emojis */}
            <div className="relative h-12 mb-4 max-w-xs mx-auto">
              <AnimatePresence>
                {foodEmojis.slice(0, 6).map((emoji, index) => (
                  <motion.span
                    key={index}
                    className="absolute text-2xl sm:text-3xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: currentEmojiIndex === index ? 1 : 0.2,
                      y: currentEmojiIndex === index ? 0 : -5,
                      scale: currentEmojiIndex === index ? 1.2 : 0.8,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      left: `${(index / 5) * 100}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mx-auto">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Progress Percentage */}
            <div className="mt-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              {progress}% loaded
            </div>

            {/* Table Info */}
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-full inline-block">
              🪑 Table #{tableId}
            </div>

            {/* Animated Dots */}
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-1.5 h-1.5 bg-red-500 rounded-full"
              />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-1.5 h-1.5 bg-orange-500 rounded-full"
              />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-1.5 h-1.5 bg-red-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;