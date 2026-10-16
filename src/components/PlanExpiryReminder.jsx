import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FaHourglassHalf, FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { openAdminWhatsApp } from '../lib/contact';
import { getPlanDaysLeft, planExpiryMessage, PLAN_REMINDER_INTERVAL_MS } from '../lib/planExpiry';

const CHECK_EVERY_MS = 60 * 1000;
// User data loaded this recently (e.g. on app start) is trusted as-is instead of re-verified.
const FRESH_ENOUGH_MS = 60 * 1000;

const readTime = (key) => {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
};

const writeTime = (key, value) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable: the reminder just falls back to once per app session.
  }
};

// Pops up at most once an hour while the plan is within 15 days of expiry. The last-shown time
// lives in localStorage, so reloads and app restarts don't re-trigger it early.
const PlanExpiryReminder = () => {
  const { user, refreshUser } = useAuth();
  const [daysLeft, setDaysLeft] = useState(null);
  const userRef = useRef(user);
  const checking = useRef(false);
  userRef.current = user;

  const inWindow = getPlanDaysLeft(user) !== null;

  useEffect(() => {
    if (!inWindow || !user?.id) return undefined;
    const key = `planReminderShownAt:${user.id}`;

    const check = async () => {
      if (checking.current || document.hidden) return;
      if (Date.now() - readTime(key) < PLAN_REMINDER_INTERVAL_MS) return;
      checking.current = true;
      try {
        // One verify per reminder (max once an hour) so a renewal or deactivation by the admin
        // is picked up before nagging. Falls back to known data if the server is unreachable.
        const fresh = await refreshUser({ maxAgeMs: FRESH_ENOUGH_MS });
        writeTime(key, Date.now());
        const days = getPlanDaysLeft(fresh || userRef.current);
        if (days !== null) setDaysLeft(days);
      } finally {
        checking.current = false;
      }
    };

    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [inWindow, user?.id, refreshUser]);

  // Renewed, expired or deactivated while open: close it.
  useEffect(() => {
    if (!inWindow) setDaysLeft(null);
  }, [inWindow]);

  if (daysLeft === null) return null;

  const close = () => setDaysLeft(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={close}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-labelledby="plan-expiry-title"
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4">
          <FaHourglassHalf className="text-2xl" />
        </div>
        <h2 id="plan-expiry-title" className="text-lg font-bold text-gray-800 dark:text-white">
          Plan expiring soon
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{planExpiryMessage(daysLeft)}</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={close}
            className="flex-1 py-2.5 rounded-xl font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Later
          </button>
          <button
            onClick={() => {
              openAdminWhatsApp(user);
              close();
            }}
            className="flex-1 py-2.5 rounded-xl font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <FaWhatsapp className="text-lg" /> Contact
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PlanExpiryReminder;
