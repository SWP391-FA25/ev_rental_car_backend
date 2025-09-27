import { Router } from 'express';
import {
  createRentalHistory,
  deleteRentalHistory,
  getRentalHistories,
  getRentalHistoriesByUserId,
  getRentalHistoryByBookingId,
  getRentalHistoryById,
  getRentalStatistics,
  updateRentalHistory,
} from '../../controllers/rental.history.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// CREATE - Create new rental history (when booking is completed)
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  createRentalHistory
);

// READ - Get all rental histories with pagination and filtering
router.get(
  '/',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  getRentalHistories
);

// READ - Get rental statistics (must be before /:id route)
router.get(
  '/statistics',
  authenticate,
  authorize(['ADMIN', 'STAFF']),
  getRentalStatistics
);

// READ - Get rental histories by user ID
router.get(
  '/user/:userId',
  authenticate,
  authorize(['RENTER', 'ADMIN', 'STAFF']),
  getRentalHistoriesByUserId
);

// READ - Get rental history by booking ID
router.get(
  '/booking/:bookingId',
  authenticate,
  authorize(['RENTER', 'ADMIN', 'STAFF']),
  getRentalHistoryByBookingId
);

// READ - Get rental history by ID
router.get(
  '/:id',
  authenticate,
  authorize(['RENTER', 'ADMIN', 'STAFF']),
  getRentalHistoryById
);

// UPDATE - Update rental history (mainly for rating and feedback)
router.put(
  '/:id',
  authenticate,
  authorize(['RENTER', 'ADMIN', 'STAFF']),
  updateRentalHistory
);

// DELETE - Delete rental history
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteRentalHistory);

export default router;
