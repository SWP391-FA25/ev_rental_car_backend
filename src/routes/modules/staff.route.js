import { Router } from 'express';
import {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  softDeleteStaff,
  deleteStaff,
} from '../controllers/staff.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Get all staff
router.get('/', authenticate, authorize('ADMIN'), getStaff);
// Get staff by id
router.get('/:id', authenticate, authorize('ADMIN'), getStaffById);
// Create staff
router.post('/', authenticate, authorize('ADMIN'), createStaff);
// Update staff
router.put('/:id', authenticate, authorize('ADMIN'), updateStaff);
// Soft delete staff
router.patch(
  '/soft-delete/:id',
  authenticate,
  authorize('ADMIN'),
  softDeleteStaff
);
// Hard delete staff
router.delete('/:id', authenticate, authorize('ADMIN'), deleteStaff);

export default router;
