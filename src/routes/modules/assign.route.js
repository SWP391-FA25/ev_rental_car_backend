import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from '../../controllers/assign.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Create assignment (Admin only)
router.post('/', authenticate, authorize('ADMIN'), createAssignment);
// Get all assignments (Admin and Staff)
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), getAssignments);
// Get assignment by ID (Admin and Staff)
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getAssignmentById
);
// Update assignment by ID (Admin only)
router.put('/:id', authenticate, authorize('ADMIN'), updateAssignment);
// Delete assignment by ID (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteAssignment);

export default router;
