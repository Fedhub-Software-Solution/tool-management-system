import { Request, Response, NextFunction } from 'express';
import suppliersService from '../services/suppliers.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierFilters,
} from '../types/supplier.types';

export class SuppliersController {
  /**
   * GET /suppliers
   * Get all suppliers with filtering and pagination
   */
  async getAllSuppliers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters: SupplierFilters = {
        status: req.query.status as any,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await suppliersService.getAllSuppliers(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /suppliers/:id
   * Get supplier by ID
   */
  async getSupplierById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const supplier = await suppliersService.getSupplierById(id);

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /suppliers
   * Create new supplier (Approver only)
   */
  async createSupplier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const supplierData = req.body as CreateSupplierDto;
      const userId = (req as any).user?.id;

      const supplier = await suppliersService.createSupplier(supplierData, userId);

      res.status(201).json({
        success: true,
        data: supplier,
        message: 'Supplier created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /suppliers/:id
   * Update supplier (Approver only)
   */
  async updateSupplier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const supplierData = req.body as UpdateSupplierDto;

      const supplier = await suppliersService.updateSupplier(id, supplierData);

      res.json({
        success: true,
        data: supplier,
        message: 'Supplier updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /suppliers/:id
   * Delete supplier (Approver only)
   */
  async deleteSupplier(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await suppliersService.deleteSupplier(id);

      res.json({
        success: true,
        message: 'Supplier deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SuppliersController();

