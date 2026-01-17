import { Response } from 'express';
import { notificationsService } from '../services/notifications.service';
import { AuthenticatedRequest } from '../types/common.types';
import { NotificationFilters } from '../types/notification.types';

export class NotificationsController {
  /**
   * GET /api/notifications
   * Get all notifications for the authenticated user
   */
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    const filters: NotificationFilters = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined,
      isRead:
        req.query.isRead !== undefined
          ? req.query.isRead === 'true'
          : undefined,
      type: req.query.type as any,
      relatedEntityType: req.query.relatedEntityType as string | undefined,
      relatedEntityId: req.query.relatedEntityId as string | undefined,
    };

    const userId = req.user!.id;
    const result = await notificationsService.getNotifications(userId, filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    });
  }

  /**
   * GET /api/notifications/unread-count
   * Get unread notification count
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.id;
    const count = await notificationsService.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  }

  /**
   * PUT /api/notifications/:id/read
   * Mark notification as read
   */
  async markAsRead(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!.id;

    await notificationsService.markAsRead(id, userId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  }

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.id;
    const count = await notificationsService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `All notifications marked as read (${count} notifications)`,
      count,
    });
  }
}

export const notificationsController = new NotificationsController();

