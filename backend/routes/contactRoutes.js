import express from 'express';
import { submitEnquiry } from '../controllers/contactController.js';

const router = express.Router();

router.post('/', submitEnquiry);

export default router;
