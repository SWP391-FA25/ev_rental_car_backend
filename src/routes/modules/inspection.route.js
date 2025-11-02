import { Router } from 'express';
import {
  createInspection,
  deleteInspection,
  getInspectionById,
  getInspectionsByBooking,
  getInspectionsByStaff,
  getInspectionsByVehicle,
  updateInspection,
  getInspectionStats,
  getInspectionsByBookingForRenter,
  uploadInspectionImage,
  uploadInspectionImageHandler,
  deleteInspectionImage,
} from '../../controllers/inspection.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Create a new inspection record
router.post('/', authenticate, authorize('STAFF', 'ADMIN'), createInspection);

// Upload inspection image
router.post(
  '/:id/upload-image',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  uploadInspectionImage,
  uploadInspectionImageHandler
);

// Delete inspection image
router.delete(
  '/:id/image/:imageIndex',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  deleteInspectionImage
);

// Get inspection by ID
router.get(
  '/:id',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  getInspectionById
);

// Update inspection record
router.put('/:id', authenticate, authorize('STAFF', 'ADMIN'), updateInspection);

// Delete inspection record
router.delete('/:id', authenticate, authorize('ADMIN'), deleteInspection);

// Get inspections for a specific booking (staff/admin version)
router.get(
  '/booking/:bookingId',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  getInspectionsByBooking
);

// Get inspections for a specific booking (renter version)
router.get(
  '/booking/:bookingId/renter',
  authenticate,
  authorize('RENTER'),
  getInspectionsByBookingForRenter
);

// Get inspections for a specific vehicle
router.get(
  '/vehicle/:vehicleId',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  getInspectionsByVehicle
);

// Get inspections conducted by a specific staff member
router.get(
  '/staff/:staffId',
  authenticate,
  authorize('STAFF', 'ADMIN'),
  getInspectionsByStaff
);

// Get inspection statistics
router.get('/stats', authenticate, authorize('ADMIN'), getInspectionStats);

export default router;
