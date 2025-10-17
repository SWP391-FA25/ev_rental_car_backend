import { Router } from 'express';
import {
  cancelBooking,
  checkInBooking,
  completeBooking,
  createBooking,
  getBookingAnalytics,
  getBookingById,
  getBookings,
  getDepositStatus,
  getMyManagedBookings,
  getUserBookings,
  updateBooking,
  updateBookingStatus,
} from '../../controllers/booking.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import {
  cancelBookingValidation,
  checkInBookingValidation,
  completeBookingValidation,
  createBookingValidation,
  getBookingAnalyticsValidation,
  getBookingByIdValidation,
  getBookingsValidation,
  getUserBookingsValidation,
  updateBookingStatusValidation,
  updateBookingValidation,
} from '../../middleware/booking.middleware.js';

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

// Get my managed bookings (Staff/Admin only)
router.get(
  '/my-managed',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getBookingsValidation, // Reuse the same validation as getBookings
  getMyManagedBookings
);

// Get user's bookings (Admin/Staff only)
router.get(
  '/user/:userId',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  getUserBookingsValidation,
  getUserBookings
);

// Get booking by ID (Admin/Staff only)
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  getBookingByIdValidation,
  getBookingById
);

// Create new booking (Renter, Staff, Admin can create)
router.post(
  '/',
  authenticate,
  authorize('RENTER', 'STAFF', 'ADMIN'),
  createBookingValidation,
  createBooking
);

// Update booking (Admin/Staff only)
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
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

// Cancel booking (Admin/Staff only)
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  cancelBookingValidation,
  cancelBooking
);

// Check-in booking (start rental) (Admin/Staff only)
router.post(
  '/:id/checkin',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  checkInBookingValidation,
  checkInBooking
);

// Complete booking (Admin/Staff only)
router.post(
  '/:id/complete',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  completeBookingValidation,
  completeBooking
);

// Get deposit status and confirm booking (Admin/Staff only)
router.get(
  '/:id/deposit-status',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getBookingByIdValidation, // Reuse the same validation as getBookingById
  getDepositStatus
);

export default router;
