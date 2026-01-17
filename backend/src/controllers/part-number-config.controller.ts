import { Request, Response, NextFunction } from 'express';
import partNumberConfigService from '../services/part-number-config.service';
import { AuthenticatedRequest } from '../types/common.types';
import { CreatePartNumberConfigDto, UpdatePartNumberConfigDto } from '../types/part-number-config.types';

export class PartNumberConfigController {
  /**
   * GET /part-number-configs
   * Get all part number configurations
   */
  async getAllPartNumberConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const configs = await partNumberConfigService.getAllPartNumberConfigs();

      res.json({
        success: true,
        data: configs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /part-number-configs/:id
   * Get part number config by ID
   */
  async getPartNumberConfigById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const config = await partNumberConfigService.getPartNumberConfigById(id);

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /part-number-configs
   * Create part number config (Approver only)
   */
  async createPartNumberConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const configData = req.body as CreatePartNumberConfigDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const createdBy = authenticatedReq.user?.id;

      const config = await partNumberConfigService.createPartNumberConfig(configData, createdBy);

      res.status(201).json({
        success: true,
        data: config,
        message: 'Part number configuration created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /part-number-configs/:id
   * Update part number config (Approver only)
   */
  async updatePartNumberConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const configData = req.body as UpdatePartNumberConfigDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const updatedBy = authenticatedReq.user?.id;

      const config = await partNumberConfigService.updatePartNumberConfig(id, configData, updatedBy);

      res.json({
        success: true,
        data: config,
        message: 'Part number configuration updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /part-number-configs/:id
   * Delete part number config (Approver only)
   */
  async deletePartNumberConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await partNumberConfigService.deletePartNumberConfig(id);

      res.json({
        success: true,
        message: 'Part number configuration deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PartNumberConfigController();

