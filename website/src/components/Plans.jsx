import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaCrown } from 'react-icons/fa';

const PLANS = [
  {
    name: 'Free Trial',
    price: '₹0',
    period: '1 month',
    tagline: 'Try everything, no card needed',
    highlight: false,
  },
  {
    name: '3 Month Plan',
    price: '₹399',
    period: '3 months',
    tagline: 'Best for getting started',
    highlight: false,
  },
  {
    name: '6 Month Plan',
    price: '₹599',
    period: '6 months',
    tagline: 'Most popular with vendors',
    highlight: true,
  },
  {
    name: '1 Year Plan',
    price: '₹999',
    period: '12 months',
    tagline: 'Best value, save the most',
    highlight: false,
  },
];

const INCLUDED = [
  'Unlimited table QR codes',
  'Live order dashboard',
  'Menu & category management',
  'Android vendor app (APK)',
  'Real-time order notifications',
  'Revenue & sales reports',
];

const Plans = () => {
  const scrollToContact = () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="plans" className="py-20 sm:py-28 px-4 sm:px-6 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-800 dark:text-white">
            Simple, honest <span className="text-gradient">pricing</span>
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Start with a free month. Every paid plan includes the full dashboard, unlimited QR
            codes and the Android vendor app.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-2xl shadow-red-500/30 scale-105'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white shadow-md'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-red-500 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <FaCrown className="text-yellow-500" /> Popular
                </span>
              )}

              <h3 className="font-bold text-lg">{plan.name}</h3>
              <p className={`text-sm mt-1 ${plan.highlight ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                {plan.tagline}
              </p>

              <div className="mt-6 mb-2">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className={`text-sm ml-1 ${plan.highlight ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                  / {plan.period}
                </span>
              </div>

              <button
                onClick={scrollToContact}
                className={`mt-6 w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.highlight
                    ? 'bg-white text-red-500 hover:shadow-lg'
                    : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg'
                }`}
              >
                Get This Plan
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-14 max-w-2xl mx-auto grid sm:grid-cols-2 gap-3">
          {INCLUDED.map((item) => (
            <div key={item} className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">
                <FaCheck className="text-xs" />
              </span>
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Plans;
