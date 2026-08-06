import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPaperPlane, FaSpinner, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../lib/api';

const EMPTY_FORM = { name: '', email: '', phone: '', message: '' };

const ContactSection = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/api/contact', form);
      toast.success("Thanks! We'll get back to you soon.");
      setForm(EMPTY_FORM);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-20 sm:py-28 px-4 sm:px-6 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-800 dark:text-white">
            Get in <span className="text-gradient">touch</span>
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-md">
            Want to bring Smart QR Food to your restaurant or cafe? Send us your details and
            we'll reach out to get you set up.
          </p>

          <div className="mt-8 space-y-4">
            <a href="tel:+916378868503" className="flex items-center gap-3 text-gray-700 dark:text-gray-200 hover:text-red-500 transition-colors">
              <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500"><FaPhoneAlt /></span>
              +91 63788 68503
            </a>
            <a href="tel:+919636402026" className="flex items-center gap-3 text-gray-700 dark:text-gray-200 hover:text-red-500 transition-colors">
              <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500"><FaPhoneAlt /></span>
              +91 96364 02026
            </a>
            <a href="mailto:kumawath649@gmail.com" className="flex items-center gap-3 text-gray-700 dark:text-gray-200 hover:text-red-500 transition-colors">
              <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500"><FaEnvelope /></span>
              kumawath649@gmail.com
            </a>
            <a href="mailto:ashishjangid006@gmail.com" className="flex items-center gap-3 text-gray-700 dark:text-gray-200 hover:text-red-500 transition-colors">
              <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500"><FaEnvelope /></span>
              ashishjangid006@gmail.com
            </a>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Ramesh Kumar"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@restaurant.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="98765 43210"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tell us about your restaurant</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Restaurant name, number of tables, which plan you're interested in..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <FaSpinner className="animate-spin" /> Sending...
              </>
            ) : (
              <>
                <FaPaperPlane /> Send Enquiry
              </>
            )}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactSection;
