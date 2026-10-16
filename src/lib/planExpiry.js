const DAY_MS = 24 * 60 * 60 * 1000;
export const PLAN_REMINDER_WINDOW_DAYS = 15;
export const PLAN_REMINDER_INTERVAL_MS = 60 * 60 * 1000;

// Whole days until the plan expires (a partial day counts as 1), or null when no reminder is due:
// inactive vendor, no plan, plan already expired, a renewal pushed expiry beyond the window,
// or a missing/invalid expiry date.
export const getPlanDaysLeft = (user, now = Date.now()) => {
  if (!user?.isActive || !user.plan || user.subscriptionStatus === 'expired' || !user.planExpiryDate) return null;
  const expiry = new Date(user.planExpiryDate).getTime();
  if (Number.isNaN(expiry) || expiry <= now) return null;
  const days = Math.ceil((expiry - now) / DAY_MS);
  return days <= PLAN_REMINDER_WINDOW_DAYS ? days : null;
};

export const planExpiryMessage = (days) =>
  `Your plan will expire in ${days} day${days === 1 ? '' : 's'}. Please contact the admin to renew your plan.`;
