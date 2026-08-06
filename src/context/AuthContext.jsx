// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../lib/api';
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

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get('/api/vendor/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('vendorToken');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/vendor/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('vendorToken', token);
      setToken(token);
      setUser(user);
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
      setToken(token);
      setUser(user);
      toast.success(`Welcome, ${user.name}! Your vendor account is ready 🎉`);
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('vendorToken');
    setToken(null);
    setUser(null);
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
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
