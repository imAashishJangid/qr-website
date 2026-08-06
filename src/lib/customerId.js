// frontend/src/lib/customerId.js
// A persistent, anonymous per-device id (no login involved). Sent with every
// order so the backend can tell "my orders" apart from other customers who
// scan the same table's QR code on a different day.

const STORAGE_KEY = 'customerId';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `cust_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

export const getCustomerId = () => {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
};
