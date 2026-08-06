import React from 'react';
import { motion } from 'framer-motion';

const SHOTS = [
  {
    src: '/screenshots/dashboard.png',
    title: 'Dashboard & Table QR codes',
    desc: 'See today\'s orders, revenue and pending orders at a glance, and generate a unique QR code for every table with one tap.',
  },
  {
    src: '/screenshots/orders.png',
    title: 'Live order queue',
    desc: 'Every new order shows up instantly — table number, items and total — sorted by Pending, Preparing and Ready.',
  },
  {
    src: '/screenshots/profile.png',
    title: 'Sales & menu overview',
    desc: 'Track total sales, product count and a full breakdown of your menu by category, right from your profile.',
  },
];

const Screenshots = () => (
  <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-800">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-800 dark:text-white">
          Built for the <span className="text-gradient">vendor side</span> too
        </h2>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          A clean, simple vendor app that runs on the web and as an Android app — here's what
          managing your restaurant looks like.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-8">
        {SHOTS.map((shot, i) => (
          <motion.div
            key={shot.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-3 mb-5 mx-auto max-w-[240px] border border-gray-100 dark:border-gray-700">
              <img
                src={shot.src}
                alt={shot.title}
                className="w-full rounded-2xl object-cover"
              />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">{shot.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 px-2">{shot.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Screenshots;
