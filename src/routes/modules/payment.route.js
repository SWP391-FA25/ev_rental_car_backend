import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import {
  createCashPayment,
  processCashRefund,
  getPaymentDetails,
} from '../../controllers/payment.controller.js';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const router = Router();

// Create a cash payment for a booking (requires authentication)
// Supports file upload for evidence
router.post(
  '/cash-payment',
  authenticate,
  upload.single('evidence'),
  createCashPayment
);

// Process a cash refund for a booking (requires authentication, staff/admin only)
router.post('/cash-refund', authenticate, processCashRefund);

// Get payment details (requires authentication)
router.get('/details/:paymentId', authenticate, getPaymentDetails);

export default router;
