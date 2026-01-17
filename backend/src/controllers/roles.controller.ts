import { Request, Response, NextFunction } from 'express';
import rolesService from '../services/roles.service';
import { AuthenticatedRequest } from '../types/common.types';
import { CreateRoleDto, UpdateRoleDto } from '../types/role.types';

export class RolesController {
  /**
   * GET /roles
   * Get all roles
   */
  async getAllRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const roles = await rolesService.getAllRoles(includeInactive);

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /roles/:id
   * Get role by ID
   */
  async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const role = await rolesService.getRoleById(id);

      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /roles
   * Create role (Approver only)
   */
  async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleData = req.body as CreateRoleDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const createdBy = authenticatedReq.user?.id;

      const role = await rolesService.createRole(roleData, createdBy);

      res.status(201).json({
        success: true,
        data: role,
        message: 'Role created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /roles/:id
   * Update role (Approver only)
   */
  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const roleData = req.body as UpdateRoleDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const updatedBy = authenticatedReq.user?.id;

      const role = await rolesService.updateRole(id, roleData, updatedBy);

      res.json({
        success: true,
        data: role,
        message: 'Role updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /roles/:id
   * Delete role (Approver only)
   */
  async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await rolesService.deleteRole(id);

      res.json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RolesController();

