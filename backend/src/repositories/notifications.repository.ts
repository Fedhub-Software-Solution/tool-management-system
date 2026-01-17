import { Prisma, NotificationType } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import {
  NotificationFilters,
  NotificationResponse,
  CreateNotificationDto,
} from '../types/notification.types';
import { PAGINATION } from '../utils/constants';

export class NotificationsRepository {
  /**
   * Find notification by ID
   */
  async findById(id: string): Promise<NotificationResponse | null> {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return null;
    }

    return this.mapToNotificationResponse(notification);
  }

  /**
   * Find all notifications for a user with filtering and pagination
   */
  async findAll(
    userId: string,
    filters: NotificationFilters = {},
  ): Promise<{
    data: NotificationResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  }> {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      isRead,
      type,
      relatedEntityType,
      relatedEntityId,
    } = filters;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, PAGINATION.MAX_LIMIT);

    // Build where clause
    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    if (relatedEntityType) {
      where.relatedEntityType = relatedEntityType;
    }

    if (relatedEntityId) {
      where.relatedEntityId = relatedEntityId;
    }

    // Get total count and unread count
    const [total, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          ...where,
          isRead: false,
        },
      }),
    ]);

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const data = notifications.map((notification) =>
      this.mapToNotificationResponse(notification),
    );

    return {
      data,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
      unreadCount,
    };
  }

  /**
   * Create notification
   */
  async create(
    data: CreateNotificationDto,
  ): Promise<NotificationResponse> {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
      },
    });

    return this.mapToNotificationResponse(notification);
  }

  /**
   * Create multiple notifications
   */
  async createMany(
    data: CreateNotificationDto[],
  ): Promise<number> {
    const result = await prisma.notification.createMany({
      data: data.map((d) => ({
        userId: d.userId,
        title: d.title,
        message: d.message,
        type: d.type,
        relatedEntityType: d.relatedEntityType,
        relatedEntityId: d.relatedEntityId,
      })),
    });

    return result.count;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<NotificationResponse> {
    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.mapToNotificationResponse(updated);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Map Prisma notification to NotificationResponse
   */
  private mapToNotificationResponse(
    notification: any,
  ): NotificationResponse {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}

export const notificationsRepository = new NotificationsRepository();

