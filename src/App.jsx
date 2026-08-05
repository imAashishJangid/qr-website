// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css'; // ✅ Import CSS here


// Providers
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';

import AndroidBackButton from './components/AndroidBackButton';
import LandingPage from './pages/customer/LandingPage';

// Pages
import MenuPage from "./pages/customer/MenuPage";
import CartPage from "./pages/customer/CartPage";
import OrderStatusPage from "./pages/customer/OrderStatusPage";
import VendorSignup from "./pages/vendor/VendorSignup";
import VendorLogin from "./pages/vendor/VendorLogin";
import VendorLayout from "./pages/vendor/VendorLayout";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorProfile from "./pages/vendor/VendorProfile";

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CartProvider>
          <SocketProvider>
            <AuthProvider>
              <Router>
                <AndroidBackButton />
                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#4ade80',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 4000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
                
                <Routes>
                  {/* Customer Routes */}
                  <Route path="/menu/:vendorId/:tableId" element={<MenuPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/order-status/:orderId" element={<OrderStatusPage />} />

                  {/* Vendor Routes */}
                  <Route path="/vendor/signup" element={<VendorSignup />} />
                  <Route path="/vendor/login" element={<VendorLogin />} />
                  <Route path="/vendor" element={<VendorLayout />}>
                    <Route index element={<Navigate to="/vendor/dashboard" replace />} />
                    <Route path="dashboard" element={<VendorDashboard />} />
                    <Route path="products" element={<VendorProducts />} />
                    <Route path="orders" element={<VendorOrders />} />
                    <Route path="profile" element={<VendorProfile />} />
                  </Route>

                  <Route path="/" element={<LandingPage />} />
                </Routes>
              </Router>
            </AuthProvider>
          </SocketProvider>
        </CartProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;