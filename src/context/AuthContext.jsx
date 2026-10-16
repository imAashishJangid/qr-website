// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios, { VENDOR_INACTIVE_EVENT } from '../lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('vendorToken'));
  // Token whose user came straight from login/signup, so it needn't be re-verified right away.
  const freshToken = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;
  // When the user was last loaded from the server, and the verify request currently in flight.
  const verifyState = useRef({ at: 0, request: null });

  const clearSession = useCallback(() => {
    localStorage.removeItem('vendorToken');
    setToken(null);
    setUser(null);
  }, []);

  const markVerified = (verifiedUser) => {
    verifyState.current.at = Date.now();
    setUser(verifiedUser);
  };

  // Re-reads the vendor (active status, plan expiry) from the server. Concurrent callers share one
  // request, and `maxAgeMs` reuses data loaded that recently. Only a rejected token ends the
  // session; a network error keeps the vendor signed in with what we already know.
  const refreshUser = useCallback(async ({ maxAgeMs = 0 } = {}) => {
    const state = verifyState.current;
    if (state.request) return state.request;
    if (maxAgeMs && Date.now() - state.at < maxAgeMs) return userRef.current;

    state.request = (async () => {
      try {
        const { data } = await axios.get('/api/vendor/verify');
        markVerified(data.user);
        return data.user;
      } catch (error) {
        if (error.response?.status === 401) clearSession();
        return null;
      } finally {
        state.request = null;
      }
    })();
    return state.request;
  }, [clearSession]);

  useEffect(() => {
    if (!token || token === freshToken.current) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [token, refreshUser]);

  // Any API call can report that the admin deactivated this vendor mid-session.
  useEffect(() => {
    const markInactive = () => setUser((prev) => (prev && prev.isActive ? { ...prev, isActive: false } : prev));
    window.addEventListener(VENDOR_INACTIVE_EVENT, markInactive);
    return () => window.removeEventListener(VENDOR_INACTIVE_EVENT, markInactive);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/vendor/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('vendorToken', token);
      freshToken.current = token;
      setToken(token);
      markVerified(user);
      toast.success(`Welcome back, ${user.name}! 🎉`);
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const signup = async ({ name, email, password, restaurantName }) => {
    try {
      const response = await axios.post('/api/vendor/signup', { name, email, password, restaurantName });
      const { token, user } = response.data;

      localStorage.setItem('vendorToken', token);
      freshToken.current = token;
      setToken(token);
      markVerified(user);
      toast.success(`Welcome, ${user.name}! Your vendor account is ready 🎉`);
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const logout = () => {
    clearSession();
    toast.success('Logged out successfully');
  };

  const updateUser = (patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const value = {
    user,
    loading,
    token,
    login,
    signup,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user && !!token,
    isVendorActive: !!user?.isActive,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
