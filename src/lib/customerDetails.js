// Name + phone the customer enters at checkout. Remembered on this device so
// repeat orders (cart or "Order Now") don't make them type it again.
const STORAGE_KEY = 'customerDetails';

export const loadCustomerDetails = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { name: saved.name || '', phone: saved.phone || '' };
  } catch {
    return { name: '', phone: '' };
  }
};

export const saveCustomerDetails = ({ name, phone }) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: name.trim(), phone: phone.trim() }));
};

// Indian mobile number: 10 digits starting 6-9, optionally prefixed with +91 / 0.
export const isValidPhone = (phone) => {
  const digits = String(phone).replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits);
};
