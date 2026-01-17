import { Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { AuthenticatedRequest } from '../types/common.types';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  AdjustStockDto,
} from '../types/inventory.types';

export class InventoryController {
  /**
   * GET /api/inventory
   * Get all inventory items with filtering and pagination
   */
  async getAllInventoryItems(req: AuthenticatedRequest, res: Response) {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined,
      status: req.query.status as any,
      partNumber: req.query.partNumber as string | undefined,
      toolNumber: req.query.toolNumber as string | undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await inventoryService.getAllInventoryItems(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }

  /**
   * GET /api/inventory/:id
   * Get inventory item by ID with transaction history
   */
  async getInventoryItemById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const includeHistory = req.query.history === 'true';

    if (includeHistory) {
      const item = await inventoryService.getInventoryItemWithHistory(id);
      res.json({
        success: true,
        data: item,
      });
    } else {
      const item = await inventoryService.getInventoryItemById(id);
      res.json({
        success: true,
        data: item,
      });
    }
  }

  /**
   * POST /api/inventory
   * Create inventory item (Spares only)
   */
  async createInventoryItem(req: AuthenticatedRequest, res: Response) {
    const data = req.body as CreateInventoryItemDto;

    const item = await inventoryService.createInventoryItem(data);

    res.status(201).json({
      success: true,
      data: item,
      message: 'Inventory item created successfully',
    });
  }

  /**
   * PUT /api/inventory/:id
   * Update inventory item (Spares only)
   */
  async updateInventoryItem(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = req.body as UpdateInventoryItemDto;

    const item = await inventoryService.updateInventoryItem(id, data);

    res.json({
      success: true,
      data: item,
      message: 'Inventory item updated successfully',
    });
  }

  /**
   * POST /api/inventory/:id/adjust
   * Adjust stock manually (Spares only)
   */
  async adjustStock(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = req.body as AdjustStockDto;
    const userId = req.user!.id;

    const item = await inventoryService.adjustStock(id, data, userId);

    res.json({
      success: true,
      data: item,
      message: 'Stock adjusted successfully',
    });
  }

  /**
   * GET /api/inventory/low-stock
   * Get low stock items (Spares only)
   */
  async getLowStockItems(req: AuthenticatedRequest, res: Response) {
    const items = await inventoryService.getLowStockItems();

    res.json({
      success: true,
      data: items,
    });
  }
}

export const inventoryController = new InventoryController();

