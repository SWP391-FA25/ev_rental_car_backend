import express from 'express';
import TestController from '../../controllers/test.controller.js';

const router = express.Router();

// Test routes for ImageKit integration
router.get('/imagekit/connection', TestController.testImageKitConnection);
router.get(
  '/imagekit/transformations',
  TestController.testImageTransformations
);

export default router;
