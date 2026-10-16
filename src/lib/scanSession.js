// The table a customer scanned, remembered so Cart / Order Status can get back to the menu and
// place orders. The QR token proves the scan came from a live (not deleted) QR code.
const KEYS = { vendorId: 'vendorId', tableId: 'tableId', qrToken: 'qrToken' };

export const getScanSession = () => ({
  vendorId: localStorage.getItem(KEYS.vendorId),
  tableId: localStorage.getItem(KEYS.tableId),
  qrToken: localStorage.getItem(KEYS.qrToken) || '',
});

export const saveScanSession = ({ vendorId, tableId, qrToken }) => {
  localStorage.setItem(KEYS.vendorId, vendorId);
  localStorage.setItem(KEYS.tableId, tableId);
  if (qrToken) localStorage.setItem(KEYS.qrToken, qrToken);
  else localStorage.removeItem(KEYS.qrToken);
};

export const menuPath = ({ vendorId, tableId, qrToken }) =>
  `/menu/${vendorId}/${encodeURIComponent(tableId)}${qrToken ? `?qr=${encodeURIComponent(qrToken)}` : ''}`;

// Path back to the last scanned menu, or null if nothing was scanned on this device.
export const storedMenuPath = () => {
  const session = getScanSession();
  return session.vendorId && session.tableId ? menuPath(session) : null;
};
