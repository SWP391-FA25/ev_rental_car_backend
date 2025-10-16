import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import {
  createPayOSPayment,
  handlePayOSWebhook,
  getPayOSPaymentStatus,
  handlePayOSSuccess,
  handlePayOSFailure,
  createDepositPayment,
  createRentalFeePayment,
  createLateFeePayment,
  createDamageFeePayment,
  createExtensionFeePayment,
} from '../../controllers/payos.controller.js';

const router = Router();

// Create a payment link (requires authentication)
router.post('/create', authenticate, createPayOSPayment);

// Specific payment type endpoints (require authentication)
router.post('/create-deposit', authenticate, createDepositPayment);
router.post('/create-rental-fee', authenticate, createRentalFeePayment);
router.post('/create-late-fee', authenticate, createLateFeePayment);
router.post('/create-damage-fee', authenticate, createDamageFeePayment);
router.post('/create-extension-fee', authenticate, createExtensionFeePayment);

// Get payment status (requires authentication)
router.get('/status/:paymentId', authenticate, getPayOSPaymentStatus);

// Handle payment success redirect (no authentication needed)
router.get('/success', handlePayOSSuccess);

// Handle payment failure redirect (no authentication needed)
router.get('/failure', handlePayOSFailure);

// Webhook endpoint (no authentication needed)
router.post('/webhook', handlePayOSWebhook);

export default router;
