import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';
import { FaChartPie, FaUtensils, FaClipboardList, FaUserCircle, FaMoon, FaSun } from 'react-icons/fa';
import Skeleton from '../../components/Skeleton';

const tabs = [
  { to: '/vendor/dashboard', label: 'Dashboard', icon: FaChartPie },
  { to: '/vendor/products', label: 'Products', icon: FaUtensils },
  { to: '/vendor/orders', label: 'Orders', icon: FaClipboardList },
  { to: '/vendor/profile', label: 'Profile', icon: FaUserCircle },
];

const VendorLayout = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { socket } = useSocket();
  const navigate = useNavigate();
  // Ids of orders still waiting for the vendor to accept or decline. The Orders
  // nav dot shows while this is non-empty and disappears once nothing is pending.
  const [pendingOrderIds, setPendingOrderIds] = useState(() => new Set());
  const hasNewOrder = pendingOrderIds.size > 0;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/vendor/login');
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    axios.get('/api/vendor/orders')
      .then(({ data }) => {
        setPendingOrderIds(new Set(data.filter((o) => o.status === 'pending').map((o) => o._id)));
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket || !user?.id) return;
    socket.emit('join-vendor', user.id);

    const trackOrder = (order) => {
      setPendingOrderIds((prev) => {
        const isPending = order.status === 'pending';
        if (isPending === prev.has(order._id)) return prev;
        const next = new Set(prev);
        if (isPending) next.add(order._id);
        else next.delete(order._id);
        return next;
      });
    };

    socket.on('newOrder', trackOrder);
    socket.on('orderUpdated', trackOrder);
    return () => {
      socket.off('newOrder', trackOrder);
      socket.off('orderUpdated', trackOrder);
    };
  }, [socket, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="sticky top-0 bg-white/90 dark:bg-gray-800/90 border-b border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="h-4 w-28 rounded hidden sm:block" />
          </div>
          <div className="hidden lg:flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 lg:h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-2xl mt-6 sm:mt-8" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-20 lg:pb-0">
      {/* Desktop top nav */}
      <nav className="hidden lg:block sticky top-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/vendor/dashboard')}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 flex items-center justify-center text-lg bg-gradient-to-r from-gray-800 to-black dark:from-gray-100 dark:to-white rounded-xl shadow-md shadow-black/20">
              🍽️
            </div>
            <span className="font-display font-bold text-gray-800 dark:text-white">Smart QR Food</span>
          </button>
          <div className="flex items-center gap-1">
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`
                }
              >
                <Icon className="text-base" />
                {label}
                {to === '/vendor/orders' && hasNewOrder && (
                  <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-gray-900 dark:bg-white" />
                )}
              </NavLink>
            ))}
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-gray-700" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>

      {/* Mobile bottom nav */}
      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-700 shadow-2xl lg:hidden">
        <div className="max-w-lg mx-auto grid grid-cols-4">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`
              }
            >
              <span className="relative">
                <Icon className="text-lg" />
                {to === '/vendor/orders' && hasNewOrder && (
                  <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-gray-900 dark:bg-white" />
                )}
              </span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default VendorLayout;
