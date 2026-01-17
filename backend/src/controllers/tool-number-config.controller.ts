import { Request, Response, NextFunction } from 'express';
import toolNumberConfigService from '../services/tool-number-config.service';
import { AuthenticatedRequest } from '../types/common.types';
import { CreateToolNumberConfigDto, UpdateToolNumberConfigDto } from '../types/tool-number-config.types';

export class ToolNumberConfigController {
  /**
   * GET /tool-number-configs
   * Get all tool number configurations
   */
  async getAllToolNumberConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const configs = await toolNumberConfigService.getAllToolNumberConfigs();

      res.json({
        success: true,
        data: configs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tool-number-configs/:id
   * Get tool number config by ID
   */
  async getToolNumberConfigById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const config = await toolNumberConfigService.getToolNumberConfigById(id);

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tool-number-configs
   * Create tool number config (Approver only)
   */
  async createToolNumberConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const configData = req.body as CreateToolNumberConfigDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const createdBy = authenticatedReq.user?.id;

      const config = await toolNumberConfigService.createToolNumberConfig(configData, createdBy);

      res.status(201).json({
        success: true,
        data: config,
        message: 'Tool number configuration created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /tool-number-configs/:id
   * Update tool number config (Approver only)
   */
  async updateToolNumberConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const configData = req.body as UpdateToolNumberConfigDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const updatedBy = authenticatedReq.user?.id;

      const config = await toolNumberConfigService.updateToolNumberConfig(id, configData, updatedBy);

      res.json({
        success: true,
        data: config,
        message: 'Tool number configuration updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /tool-number-configs/:id
   * Delete tool number config (Approver only)
   */
  async deleteToolNumberConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await toolNumberConfigService.deleteToolNumberConfig(id);

      res.json({
        success: true,
        message: 'Tool number configuration deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ToolNumberConfigController();

