// frontend/src/pages/customer/LandingPage.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

// If this browser already scanned a table QR before (vendorId/tableId saved by
// MenuPage), send it straight back to that menu instead of the generic scan message —
// this is what makes "Home" buttons elsewhere feel like they go home, not to a dead end.
const LandingPage = () => {
  const vendorId = localStorage.getItem('vendorId');
  const tableId = localStorage.getItem('tableId');

  if (vendorId && tableId) {
    return <Navigate to={`/menu/${vendorId}/${tableId}`} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div>
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">Scan a table QR code to view the menu.</p>
        <a href="/vendor/login" className="text-red-500 font-semibold hover:underline">Are you a vendor? Login here</a>
      </div>
    </div>
  );
};

export default LandingPage;
