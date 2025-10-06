import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import {
  createPayOSPayment,
  handlePayOSWebhook,
  getPayOSPaymentStatus,
} from '../../controllers/payos.controller.js';

const router = Router();

// Create a payment link (requires authentication)
router.post('/create', authenticate, createPayOSPayment);

// Get payment status (requires authentication)
router.get('/status/:paymentId', authenticate, getPayOSPaymentStatus);

// Webhook endpoint (no authentication needed)
router.post('/webhook', handlePayOSWebhook);

export default router;
