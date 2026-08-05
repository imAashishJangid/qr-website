import express from 'express';
import { getMenu, getCategories, searchMenu } from '../controllers/menuController.js';

const router = express.Router();

router.get('/:vendorId/categories', getCategories);
router.get('/:vendorId/search', searchMenu);
router.get('/:vendorId/:tableId', getMenu);

export default router;
