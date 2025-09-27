// In your routes file:
import {
  createPromotion,
  getPromotions,
  getPromotionById,
  getPromotionByCode,
  getActivePromotions,
  updatePromotion,
  deletePromotion,
} from '../../controllers/promotion.controller.js';

// POST /api/promotions - Create new promotion
router.post('/promotions', createPromotion);

// GET /api/promotions - Get all promotions
router.get('/promotions', getPromotions);

// GET /api/promotions/active - Get active promotions only
router.get('/promotions/active', getActivePromotions);

// GET /api/promotions/:id - Get promotion by ID
router.get('/promotions/:id', getPromotionById);

// GET /api/promotions/code/:code - Get promotion by code
router.get('/promotions/code/:code', getPromotionByCode);

// PUT /api/promotions/:id - Update promotion
router.put('/promotions/:id', updatePromotion);

// DELETE /api/promotions/:id - Delete promotion
router.delete('/promotions/:id', deletePromotion);
