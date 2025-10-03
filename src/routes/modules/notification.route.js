import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
  broadcastNotification,
  getAllNotifications,
  adminDeleteNotification,
  createTestNotification,
  getNotificationStats,
} from '../../controllers/notification.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// ***      User routes     ***
router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/:id/read', authenticate, markAsRead);
router.put('/read-all', authenticate, markAllAsRead);
router.delete('/:id', authenticate, deleteNotification);
router.delete('/', authenticate, deleteAllNotifications);

// ***      Admin routes    ***
router.post('/', authenticate, authorize('ADMIN'), createNotification);

router.post(
  '/broadcast',
  authenticate,
  authorize('ADMIN'),
  broadcastNotification
);

router.get('/all', authenticate, authorize('ADMIN'), getAllNotifications);

router.delete(
  '/:id/admin',
  authenticate,
  authorize('ADMIN'),
  adminDeleteNotification
);

// ***      Test routes (Admin only) ***
router.post('/test', authenticate, authorize('ADMIN'), createTestNotification);
router.get('/stats', authenticate, authorize('ADMIN'), getNotificationStats);

export default router;
