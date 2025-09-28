import { Router } from 'express';
import {
  createRenter,
  deleteRenter,
  getRenters,
  getRenterById,
  softDeleteRenter,
  updateRenter,
  updateRenterPassword,
} from '../../controllers/renter.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.post('/', authenticate, authorize('ADMIN'), createRenter);
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), getRenters);
router.get('/:id', authenticate, authorize('ADMIN', 'STAFF'), getRenterById);
router.put('/:id', authenticate, authorize('ADMIN'), updateRenter);
router.patch(
  '/:id/password',
  authenticate,
  authorize('ADMIN'),
  updateRenterPassword
);
router.patch(
  '/:id/soft-delete',
  authenticate,
  authorize('ADMIN', 'RENTER'),
  softDeleteRenter
);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteRenter);

export default router;
