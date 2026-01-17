import { TransactionType } from '@prisma/client';
import { inventoryRepository } from '../repositories/inventory.repository';
import { notificationsService } from './notifications.service';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../utils/errors';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  AdjustStockDto,
  InventoryFilters,
  InventoryItemResponse,
  InventoryItemWithHistoryResponse,
  LowStockItemResponse,
} from '../types/inventory.types';

export class InventoryService {
  /**
   * Get inventory item by ID
   */
  async getInventoryItemById(
    id: string,
  ): Promise<InventoryItemResponse> {
    const item = await inventoryRepository.findById(id);

    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    return item;
  }

  /**
   * Get inventory item by ID with transaction history
   */
  async getInventoryItemWithHistory(
    id: string,
  ): Promise<InventoryItemWithHistoryResponse> {
    const item = await inventoryRepository.findByIdWithHistory(id);

    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    return item;
  }

  /**
   * Get all inventory items with filtering and pagination
   */
  async getAllInventoryItems(filters: InventoryFilters = {}) {
    const result = await inventoryRepository.findAll(filters);

    return {
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Create inventory item
   */
  async createInventoryItem(
    data: CreateInventoryItemDto,
  ): Promise<InventoryItemResponse> {
    // Check if item already exists
    const existing = await inventoryRepository.findByUniqueKey(
      data.partNumber,
      data.toolNumber,
      data.itemCode,
    );

    if (existing) {
      throw new ConflictError(
        'Inventory item with this part number, tool number, and item code already exists',
      );
    }

    return inventoryRepository.create(data);
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(
    id: string,
    data: UpdateInventoryItemDto,
  ): Promise<InventoryItemResponse> {
    const item = await inventoryRepository.findById(id);

    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    const updatedItem = await inventoryRepository.update(id, data);

    // Check if stock is low after update
    if (
      updatedItem.currentStock < updatedItem.minStockLevel &&
      updatedItem.status === 'LowStock'
    ) {
      await notificationsService.notifyLowStock(
        updatedItem.id,
        updatedItem.name,
        updatedItem.currentStock,
        updatedItem.minStockLevel,
      );
    }

    return updatedItem;
  }

  /**
   * Adjust stock manually
   */
  async adjustStock(
    id: string,
    data: AdjustStockDto,
    userId: string,
  ): Promise<InventoryItemResponse> {
    const item = await inventoryRepository.findById(id);

    if (!item) {
      throw new NotFoundError('Inventory item not found');
    }

    if (data.quantity <= 0) {
      throw new BadRequestError('Quantity must be positive');
    }

    return inventoryRepository.adjustStock(id, data.quantity, data.type, {
      performedBy: userId,
      notes: data.notes,
    });
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(): Promise<LowStockItemResponse[]> {
    return inventoryRepository.getLowStockItems();
  }

  /**
   * Add stock from handover approval
   * This is called when a handover is approved
   */
  async addStockFromHandover(
    data: {
      partNumber: string;
      toolNumber: string;
      itemCode?: string;
      name: string;
      quantity: number;
      handoverId: string;
      prId: string;
      prNumber: string;
      projectId: string;
      performedBy: string;
    },
  ): Promise<InventoryItemResponse> {
    // Find or create inventory item
    let inventoryItem = await inventoryRepository.findByUniqueKey(
      data.partNumber,
      data.toolNumber,
      data.itemCode,
    );

    if (!inventoryItem) {
      // Create new inventory item
      inventoryItem = await inventoryRepository.create({
        partNumber: data.partNumber,
        toolNumber: data.toolNumber,
        itemCode: data.itemCode,
        name: data.name,
        currentStock: 0,
        minStockLevel: 0, // Will be set later
        unitOfMeasure: 'PCS',
      });
    }

    // Add stock
    const updatedItem = await inventoryRepository.addStock(
      inventoryItem.id,
      data.quantity,
      {
        referenceType: 'Handover',
        referenceId: data.handoverId,
        prNumber: data.prNumber,
        projectId: data.projectId,
        purpose: 'Handover approval',
        performedBy: data.performedBy,
      },
    );

    // Check if stock is low after addition (shouldn't happen, but check anyway)
    if (
      updatedItem.currentStock < updatedItem.minStockLevel &&
      updatedItem.status === 'LowStock'
    ) {
      await notificationsService.notifyLowStock(
        updatedItem.id,
        updatedItem.name,
        updatedItem.currentStock,
        updatedItem.minStockLevel,
      );
    }

    return updatedItem;
  }

  /**
   * Remove stock for spares request fulfillment
   * This will be used in Phase 8
   */
  async removeStockForRequest(
    inventoryItemId: string,
    quantity: number,
    requestId: string,
    userId: string,
    purpose?: string,
  ): Promise<InventoryItemResponse> {
    const updatedItem = await inventoryRepository.removeStock(
      inventoryItemId,
      quantity,
      {
        referenceType: 'SparesRequest',
        referenceId: requestId,
        purpose,
        performedBy: userId,
      },
    );

    // Check if stock is low after removal
    if (
      updatedItem.currentStock < updatedItem.minStockLevel &&
      updatedItem.status === 'LowStock'
    ) {
      await notificationsService.notifyLowStock(
        updatedItem.id,
        updatedItem.name,
        updatedItem.currentStock,
        updatedItem.minStockLevel,
      );
    }

    return updatedItem;
  }
}

export const inventoryService = new InventoryService();

