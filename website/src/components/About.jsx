import React from 'react';
import { motion } from 'framer-motion';
import { FaQrcode, FaUtensils, FaBell, FaChartLine, FaMobileAlt, FaShieldAlt } from 'react-icons/fa';

const STEPS = [
  {
    icon: FaQrcode,
    title: '1. Generate a QR per table',
    desc: 'From your vendor dashboard, create as many tables as you like — each gets its own unique QR code, ready to print and stick on the table.',
  },
  {
    icon: FaUtensils,
    title: '2. Customer scans & orders',
    desc: "The moment a customer scans the table's QR code, your live menu opens on their phone — no app download needed. They browse, add items to cart and place the order in seconds.",
  },
  {
    icon: FaBell,
    title: '3. You receive it instantly',
    desc: 'The order lands on your dashboard and Android app in real time, with the table number, items and any special notes — ready for you to accept and prepare.',
  },
];

const FEATURES = [
  { icon: FaChartLine, title: 'Live dashboard', desc: 'Track orders, revenue and top-selling items as they happen.' },
  { icon: FaMobileAlt, title: 'Android app included', desc: 'Manage your restaurant on the go with your own vendor app.' },
  { icon: FaShieldAlt, title: 'Secure & reliable', desc: 'Your menu, orders and customer data stay safe and always available.' },
];

const About = () => (
  <section id="about" className="py-20 sm:py-28 px-4 sm:px-6 bg-white dark:bg-gray-900">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-800 dark:text-white">
          How <span className="text-gradient">Smart QR Food</span> works
        </h2>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          A complete contactless ordering system for restaurants, cafes and food courts — from the
          QR code on the table to the order on your kitchen screen.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-6 mb-20">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xl mb-4">
              <step.icon />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex items-start gap-4">
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-lg">
              <f.icon />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white">{f.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default About;
