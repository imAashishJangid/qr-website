import { Capacitor } from '@capacitor/core';

// Admin's WhatsApp (6378868503). wa.me needs the full international number without "+" —
// the bare 10 digits would be read as a +63 (Philippines) number — so India's 91 is prefixed.
export const ADMIN_WHATSAPP_URL = 'https://wa.me/916378868503';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOT_AVAILABLE = 'Not available';

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (d) => (d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : NOT_AVAILABLE);

// e.g. "365 days (12 days left)", "30 days (Expired)", or just the remaining days if the purchase date is unknown.
const planValidity = (purchase, expiry, now = Date.now()) => {
  if (!expiry) return NOT_AVAILABLE;
  const msLeft = expiry.getTime() - now;
  const daysLeft = Math.ceil(msLeft / DAY_MS);
  const remaining = msLeft <= 0 ? 'Expired' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
  if (!purchase || purchase > expiry) return remaining;
  const totalDays = Math.round((expiry - purchase) / DAY_MS);
  return `${totalDays} day${totalDays === 1 ? '' : 's'} (${remaining})`;
};

// Pre-filled from the vendor's own data so they don't have to type their details to the admin.
export const buildAdminMessage = (user, now = Date.now()) => {
  const purchase = toDate(user?.planPurchaseDate);
  const expiry = toDate(user?.planExpiryDate);
  return [
    'Hello Admin,',
    'I need help with my HiaQr vendor account.',
    '',
    `Store Name: ${user?.restaurantName || NOT_AVAILABLE}`,
    `Email Address: ${user?.email || NOT_AVAILABLE}`,
    `Mobile Number: ${user?.phone || NOT_AVAILABLE}`,
    `Current Plan: ${user?.plan || 'No plan'}`,
    `Plan Validity: ${planValidity(purchase, expiry, now)}`,
    `Plan Purchase Date: ${formatDate(purchase)}`,
    `Plan Expiry Date: ${formatDate(expiry)}`,
  ].join('\n');
};

export const adminWhatsAppUrl = (user) => `${ADMIN_WHATSAPP_URL}?text=${encodeURIComponent(buildAdminMessage(user))}`;

// In the Capacitor app, navigating the WebView to wa.me hands the link to Android, which opens
// the WhatsApp app (or the browser if it isn't installed). A new tab is right for web/iOS Safari.
export const openAdminWhatsApp = (user) => {
  const url = adminWhatsAppUrl(user);
  if (Capacitor.isNativePlatform()) {
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
