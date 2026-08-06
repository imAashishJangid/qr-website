import express from 'express';
import { createOrder, getOrder, getActiveOrderForTable, getOrderHistoryForCustomer } from '../controllers/orderController.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/active/:vendorId/:tableId', getActiveOrderForTable);
router.get('/history/:customerId', getOrderHistoryForCustomer);
router.get('/:id', getOrder);

export default router;
