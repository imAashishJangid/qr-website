// frontend/src/pages/customer/LandingPage.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

// If this browser already scanned a table QR before (vendorId/tableId saved by
// MenuPage), send it straight back to that menu instead of the vendor login —
// this is what makes "Home" buttons elsewhere feel like they go home, not to a dead end.
// Otherwise this app's base entry point is the vendor app, so go straight to vendor login;
// customers only ever land on /menu/:vendorId/:tableId via the printed table QR code.
const LandingPage = () => {
  const vendorId = localStorage.getItem('vendorId');
  const tableId = localStorage.getItem('tableId');

  if (vendorId && tableId) {
    return <Navigate to={`/menu/${vendorId}/${tableId}`} replace />;
  }

  return <Navigate to="/vendor/login" replace />;
};

export default LandingPage;
