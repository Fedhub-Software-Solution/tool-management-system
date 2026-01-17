import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { notificationsController } from '../controllers/notifications.controller';

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 * Authorization: All roles (own notifications only)
 */
router.get(
  '/',
  authenticate,
  notificationsController.getNotifications.bind(notificationsController),
);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 * Authorization: All roles
 */
router.get(
  '/unread-count',
  authenticate,
  notificationsController.getUnreadCount.bind(notificationsController),
);

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 * Authorization: All roles (own notifications only)
 */
router.put(
  '/:id/read',
  authenticate,
  notificationsController.markAsRead.bind(notificationsController),
);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 * Authorization: All roles
 */
router.put(
  '/read-all',
  authenticate,
  notificationsController.markAllAsRead.bind(notificationsController),
);

export default router;

