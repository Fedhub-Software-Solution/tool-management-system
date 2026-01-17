import { Request, Response, NextFunction } from 'express';
import bomItemService from '../services/bom-item.service';
import { AuthenticatedRequest } from '../types/common.types';
import { CreateBomItemDto, UpdateBomItemDto } from '../types/bom-item.types';

export class BomItemController {
  /**
   * GET /bom-items
   * Get all BOM items
   */
  async getAllBomItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await bomItemService.getAllBomItems();

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /bom-items/:id
   * Get BOM item by ID
   */
  async getBomItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const item = await bomItemService.getBomItemById(id);

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /bom-items
   * Create BOM item (Approver only)
   */
  async createBomItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const itemData = req.body as CreateBomItemDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const createdBy = authenticatedReq.user?.id;

      const item = await bomItemService.createBomItem(itemData, createdBy);

      res.status(201).json({
        success: true,
        data: item,
        message: 'BOM item created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /bom-items/:id
   * Update BOM item (Approver only)
   */
  async updateBomItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const itemData = req.body as UpdateBomItemDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const updatedBy = authenticatedReq.user?.id;

      const item = await bomItemService.updateBomItem(id, itemData, updatedBy);

      res.json({
        success: true,
        data: item,
        message: 'BOM item updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /bom-items/:id
   * Delete BOM item (Approver only)
   */
  async deleteBomItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await bomItemService.deleteBomItem(id);

      res.json({
        success: true,
        message: 'BOM item deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BomItemController();

