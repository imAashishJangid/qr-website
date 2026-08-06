import express from 'express';
import {
  signup,
  login,
  verify,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  updateProfile,
  getStats,
  getRecentOrders,
  getRevenueSummary,
  listTables,
  addTable,
  updateTable,
  deleteTable,
} from '../controllers/vendorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify', protect, verify);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.put('/profile', protect, updateProfile);
router.get('/stats', protect, getStats);
router.get('/recent-orders', protect, getRecentOrders);
router.get('/revenue', protect, getRevenueSummary);
router.get('/tables', protect, listTables);
router.post('/tables', protect, addTable);
router.put('/tables/:number', protect, updateTable);
router.delete('/tables/:number', protect, deleteTable);

export default router;
