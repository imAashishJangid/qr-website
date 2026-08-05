// frontend/src/lib/api.js
import axios from 'axios';

// In the browser (Vite dev/build) relative "/api" works via the dev proxy or same-origin deploy.
// Inside the Capacitor Android app there is no same-origin backend, so VITE_API_URL must point
// to the deployed backend (set it in .env before running `npm run build` for the APK).
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vendorToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
