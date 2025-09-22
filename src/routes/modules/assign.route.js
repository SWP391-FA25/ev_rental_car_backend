import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from '../../controllers/assign.controller.js';

const router = Router();

// Create assignment
router.post('/', createAssignment);
// Get all assignments
router.get('/', getAssignments);
// Get assignment by ID
router.get('/:id', getAssignmentById);
// Update assignment by ID
router.put('/:id', updateAssignment);
// Delete assignment by ID
router.delete('/:id', deleteAssignment);

export default router;
