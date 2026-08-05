import express from 'express';
import {
  signup,
  login,
  verify,
  changePassword,
  getStats,
  getRecentOrders,
  listTables,
  addTable,
} from '../controllers/vendorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify', protect, verify);
router.put('/change-password', protect, changePassword);
router.get('/stats', protect, getStats);
router.get('/recent-orders', protect, getRecentOrders);
router.get('/tables', protect, listTables);
router.post('/tables', protect, addTable);

export default router;
