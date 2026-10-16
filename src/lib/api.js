// frontend/src/lib/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// In the browser (Vite dev/build) relative "/api" works via the dev proxy or same-origin deploy.
// Inside the Capacitor Android app there is no same-origin backend, so VITE_API_URL must point
// to the deployed backend (set it in .env before running `npm run build` for the APK).
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL });

export const VENDOR_INACTIVE_MESSAGE = 'Your account is inactive. Please contact the admin for assistance.';
// Fired when any API call reports the vendor was deactivated; AuthContext listens and flips the UI.
export const VENDOR_INACTIVE_EVENT = 'vendor-inactive';

export const isVendorInactiveError = (error) => error?.response?.data?.code === 'VENDOR_INACTIVE';

// The server's message when it sent one, otherwise the fallback.
export const getErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

// Toast an API error. Inactive-vendor errors are skipped (the interceptor already showed one), and
// the message doubles as the toast id so parallel/repeated requests failing alike show one toast.
export const notifyError = (error, fallback) => {
  if (isVendorInactiveError(error)) return;
  const message = getErrorMessage(error, fallback);
  toast.error(message, { id: message });
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vendorToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isVendorInactiveError(error)) {
      toast.error(VENDOR_INACTIVE_MESSAGE, { id: 'vendor-inactive' });
      window.dispatchEvent(new Event(VENDOR_INACTIVE_EVENT));
    }
    return Promise.reject(error);
  }
);

export default api;
