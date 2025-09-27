// In your routes file:
import { Router } from 'express';
import {
  createPromotion,
  getPromotions,
  getPromotionById,
  getPromotionByCode,
  getActivePromotions,
  updatePromotion,
  deletePromotion,
} from '../../controllers/promotion.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// POST /api/promotions - Create new promotion
router.post('/promotions', authenticate, authorize('ADMIN'), createPromotion);

// GET /api/promotions - Get all promotions
router.get(
  '/promotions',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getPromotions
);

// GET /api/promotions/active - Get active promotions only
router.get(
  '/promotions/active',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getActivePromotions
);

// GET /api/promotions/:id - Get promotion by ID
router.get(
  '/promotions/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getPromotionById
);

// GET /api/promotions/code/:code - Get promotion by code
router.get(
  '/promotions/code/:code',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  getPromotionByCode
);

// PUT /api/promotions/:id - Update promotion
router.put(
  '/promotions/:id',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  updatePromotion
);

// DELETE /api/promotions/:id - Delete promotion
router.delete(
  '/promotions/:id',
  authenticate,
  authorize('ADMIN'),
  deletePromotion
);
