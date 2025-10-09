// In your routes file:
import { Router } from 'express';
import {
  createPromotion,
  deletePromotion,
  getActivePromotions,
  getPromotionByCode,
  getPromotionById,
  getPromotions,
  updatePromotion,
} from '../../controllers/promotion.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import {
  createPromotionValidation,
  deletePromotionValidation,
  getPromotionByCodeValidation,
  getPromotionByIdValidation,
  updatePromotionValidation,
} from '../../middleware/promotion.middleware.js';

const router = Router();

// POST /api/promotions - Create new promotion
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  createPromotionValidation,
  createPromotion
);

// GET /api/promotions - Get all promotions
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), getPromotions);

// GET /api/promotions/active - Get active promotions only
router.get(
  '/active',
  authenticate,
  authorize('ADMIN', 'STAFF', 'RENTER'),
  getActivePromotions
);

// GET /api/promotions/:id - Get promotion by ID
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getPromotionByIdValidation,
  getPromotionById
);

// GET /api/promotions/code/:code - Get promotion by code
router.get(
  '/code/:code',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getPromotionByCodeValidation,
  getPromotionByCode
);

// PUT /api/promotions/:id - Update promotion
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  updatePromotionValidation,
  updatePromotion
);

// DELETE /api/promotions/:id - Delete promotion
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  deletePromotionValidation,
  deletePromotion
);

export default router;
