import React from 'react';
import { motion } from 'framer-motion';
import { FaQrcode, FaAndroid, FaBolt } from 'react-icons/fa';

const Hero = () => {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section
      id="home"
      className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6 overflow-hidden bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
    >
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-red-300/30 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-orange-300/30 rounded-full blur-3xl animate-pulse-slow" />

      <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 shadow-md px-4 py-2 rounded-full text-sm font-semibold text-red-500 mb-6">
            <FaQrcode /> QR Ordering, Reimagined
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-gray-800 dark:text-white leading-tight">
            Turn every table into a{' '}
            <span className="text-gradient">self-ordering counter</span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-xl">
            Smart QR Food gives your restaurant or cafe a digital menu customers can scan and order
            from instantly — while you manage every order live from a dashboard or your own Android app.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => scrollTo('plans')}
              className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold px-7 py-3.5 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => scrollTo('about')}
              className="bg-white dark:bg-gray-800 text-gray-700 dark:text-white font-semibold px-7 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
            >
              See How It Works
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-2"><FaBolt className="text-orange-500" /> Live order updates</span>
            <span className="flex items-center gap-2"><FaAndroid className="text-green-600" /> Android app included</span>
            <span className="flex items-center gap-2"><FaQrcode className="text-red-500" /> Unlimited table QR codes</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative flex justify-center"
        >
          <div className="w-64 sm:w-72 aspect-[9/18] bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border-8 border-gray-900 dark:border-gray-700 p-3 flex flex-col items-center justify-center gap-4">
            <div className="text-7xl">📱</div>
            <div className="w-32 h-32 bg-white rounded-xl border-4 border-gray-800 flex items-center justify-center text-5xl">
              🔳
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 text-center px-4">
              Scan the table QR to open the live menu
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
