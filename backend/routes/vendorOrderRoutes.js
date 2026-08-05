import express from 'express';
import { getVendorOrders, updateOrderStatus } from '../controllers/vendorOrderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/orders', getVendorOrders);
router.put('/orders/:id/status', updateOrderStatus);

export default router;
