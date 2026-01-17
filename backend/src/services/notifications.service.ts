import { NotificationType } from '@prisma/client';
import { notificationsRepository } from '../repositories/notifications.repository';
import { NotFoundError } from '../utils/errors';
import {
  NotificationFilters,
  NotificationResponse,
  CreateNotificationDto,
} from '../types/notification.types';
import prisma from '../config/database';

export class NotificationsService {
  /**
   * Get all notifications for a user
   */
  async getNotifications(
    userId: string,
    filters: NotificationFilters = {},
  ): Promise<{
    data: NotificationResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    unreadCount: number;
  }> {
    const result = await notificationsRepository.findAll(userId, filters);

    return {
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      unreadCount: result.unreadCount,
    };
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(
    id: string,
    userId: string,
  ): Promise<NotificationResponse> {
    const notification = await notificationsRepository.findById(id);

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Verify notification belongs to user
    if (notification.userId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  /**
   * Create notification
   */
  async createNotification(
    data: CreateNotificationDto,
  ): Promise<NotificationResponse> {
    return notificationsRepository.create(data);
  }

  /**
   * Create notification for multiple users
   */
  async createNotificationForUsers(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType,
    relatedEntityType?: string,
    relatedEntityId?: string,
  ): Promise<number> {
    const notifications: CreateNotificationDto[] = userIds.map((userId) => ({
      userId,
      title,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
    }));

    return notificationsRepository.createMany(notifications);
  }

  /**
   * Create notification for users by role
   */
  async createNotificationForRole(
    role: string,
    title: string,
    message: string,
    type: NotificationType,
    relatedEntityType?: string,
    relatedEntityId?: string,
  ): Promise<number> {
    // Get all users with the specified role
    const users = await prisma.user.findMany({
      where: {
        role: role as any,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (users.length === 0) {
      return 0;
    }

    const userIds = users.map((user) => user.id);
    return this.createNotificationForUsers(
      userIds,
      title,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
    );
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<void> {
    await notificationsRepository.markAsRead(id, userId);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    return notificationsRepository.markAllAsRead(userId);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return notificationsRepository.getUnreadCount(userId);
  }

  // Notification trigger methods

  /**
   * Notify Approver when PR is created
   */
  async notifyPRCreated(prId: string, prNumber: string): Promise<void> {
    await this.createNotificationForRole(
      'Approver',
      'New PR Created',
      `Purchase Requisition ${prNumber} has been created and is awaiting your approval`,
      NotificationType.Info,
      'PR',
      prId,
    );
  }

  /**
   * Notify NPD when PR is approved
   */
  async notifyPRApproved(prId: string, prNumber: string): Promise<void> {
    await this.createNotificationForRole(
      'NPD',
      'PR Approved',
      `Purchase Requisition ${prNumber} has been approved`,
      NotificationType.Success,
      'PR',
      prId,
    );
  }

  /**
   * Notify NPD when quotation is received
   */
  async notifyQuotationReceived(
    quotationId: string,
    prNumber: string,
    supplierName: string,
  ): Promise<void> {
    await this.createNotificationForRole(
      'NPD',
      'Quotation Received',
      `New quotation received from ${supplierName} for PR ${prNumber}`,
      NotificationType.Info,
      'Quotation',
      quotationId,
    );
  }

  /**
   * Notify Maintenance when handover is pending inspection
   */
  async notifyHandoverPending(
    handoverId: string,
    handoverNumber: string,
  ): Promise<void> {
    await this.createNotificationForRole(
      'Maintenance',
      'Handover Pending Inspection',
      `Tool handover ${handoverNumber} is pending your inspection`,
      NotificationType.Warning,
      'Handover',
      handoverId,
    );
  }

  /**
   * Notify Spares when stock is low
   */
  async notifyLowStock(
    inventoryItemId: string,
    itemName: string,
    currentStock: number,
    minStockLevel: number,
  ): Promise<void> {
    await this.createNotificationForRole(
      'Spares',
      'Low Stock Alert',
      `${itemName} is running low. Current stock: ${currentStock}, Minimum required: ${minStockLevel}`,
      NotificationType.Warning,
      'InventoryItem',
      inventoryItemId,
    );
  }

  /**
   * Notify Spares when request is created
   */
  async notifyRequestCreated(
    requestId: string,
    requestNumber: string,
    itemName: string,
  ): Promise<void> {
    await this.createNotificationForRole(
      'Spares',
      'New Spares Request',
      `New spares request ${requestNumber} for ${itemName}`,
      NotificationType.Info,
      'SparesRequest',
      requestId,
    );
  }
}

export const notificationsService = new NotificationsService();

