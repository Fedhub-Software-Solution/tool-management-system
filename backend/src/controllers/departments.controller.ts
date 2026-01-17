import { Request, Response, NextFunction } from 'express';
import departmentsService from '../services/departments.service';
import { AuthenticatedRequest } from '../types/common.types';
import { CreateDepartmentDto, UpdateDepartmentDto } from '../types/department.types';

export class DepartmentsController {
  /**
   * GET /departments
   * Get all departments
   */
  async getAllDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await departmentsService.getAllDepartments();

      res.json({
        success: true,
        data: departments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /departments/:id
   * Get department by ID
   */
  async getDepartmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const department = await departmentsService.getDepartmentById(id);

      res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /departments
   * Create department (Approver only)
   */
  async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentData = req.body as CreateDepartmentDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const createdBy = authenticatedReq.user?.id;

      const department = await departmentsService.createDepartment(departmentData, createdBy);

      res.status(201).json({
        success: true,
        data: department,
        message: 'Department created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /departments/:id
   * Update department (Approver only)
   */
  async updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const departmentData = req.body as UpdateDepartmentDto;
      const authenticatedReq = req as AuthenticatedRequest;
      const updatedBy = authenticatedReq.user?.id;

      const department = await departmentsService.updateDepartment(id, departmentData, updatedBy);

      res.json({
        success: true,
        data: department,
        message: 'Department updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /departments/:id
   * Delete department (Approver only)
   */
  async deleteDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await departmentsService.deleteDepartment(id);

      res.json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DepartmentsController();

