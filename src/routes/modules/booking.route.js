import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import {
  getBookings,
  getBookingsValidation,
  getBookingById,
  getBookingByIdValidation,
  getUserBookings,
  getUserBookingsValidation,
  updateBooking,
  updateBookingValidation,
  updateBookingStatus,
  updateBookingStatusValidation,
  cancelBooking,
  cancelBookingValidation,
  getBookingAnalytics,
  getBookingAnalyticsValidation,
  createBooking,
  createBookingValidation,
  completeBooking,
  completeBookingValidation,
} from '../../controllers/booking.controller.js';

const router = Router();

// Get all bookings (Admin/Staff only)
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getBookingsValidation,
  getBookings
);

// Get booking analytics (Admin/Staff only)
router.get(
  '/analytics',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getBookingAnalyticsValidation,
  getBookingAnalytics
);

// Get user's bookings
router.get(
  '/user/:userId',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  getUserBookingsValidation,
  getUserBookings
);

// Get booking by ID
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  getBookingByIdValidation,
  getBookingById
);

// Create new booking
router.post(
  '/',
  authenticate,
  authorize('RENTER'),
  createBookingValidation,
  createBooking
);

// Update booking
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  updateBookingValidation,
  updateBooking
);

// Update booking status (Admin/Staff only)
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  updateBookingStatusValidation,
  updateBookingStatus
);

// Cancel booking
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  cancelBookingValidation,
  cancelBooking
);

// Complete booking
router.post(
  '/:id/complete',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  completeBookingValidation,
  completeBooking
);

export default router;
