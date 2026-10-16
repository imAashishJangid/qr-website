// frontend/src/pages/customer/LandingPage.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { storedMenuPath } from '../../lib/scanSession';

// If this browser already scanned a table QR before (vendorId/tableId saved by
// MenuPage), send it straight back to that menu instead of the vendor login —
// this is what makes "Home" buttons elsewhere feel like they go home, not to a dead end.
// Otherwise this app's base entry point is the vendor app, so go straight to vendor login;
// customers only ever land on /menu/:vendorId/:tableId via the printed table QR code.
const LandingPage = () => {
  const menu = storedMenuPath();
  if (menu) {
    return <Navigate to={menu} replace />;
  }

  return <Navigate to="/vendor/login" replace />;
};

export default LandingPage;
