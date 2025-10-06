import { Router } from 'express';
import TestController from '../../controllers/test.controller.js';

const router = Router();

router.get('/imagekit', TestController.testImageKitConnection);
router.get('/transform', TestController.testImageTransformations);

export default router;