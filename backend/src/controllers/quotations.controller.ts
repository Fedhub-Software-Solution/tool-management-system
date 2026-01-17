import { Request, Response, NextFunction } from 'express';
import quotationsService from '../services/quotations.service';
import {
  CreateQuotationDto,
  QuotationFilters,
  EvaluateQuotationDto,
} from '../types/quotation.types';

export class QuotationsController {
  /**
   * GET /quotations
   * Get all quotations with filtering and pagination
   */
  async getAllQuotations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters: QuotationFilters = {
        prId: req.query.prId as string,
        supplierId: req.query.supplierId as string,
        status: req.query.status as any,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await quotationsService.getAllQuotations(filters);

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
   * GET /quotations/:id
   * Get quotation by ID
   */
  async getQuotationById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const quotation = await quotationsService.getQuotationById(id);

      res.json({
        success: true,
        data: quotation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /quotations
   * Create quotation (with optional file upload)
   */
  async createQuotation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const quotationData = req.body as CreateQuotationDto;
      const userId = (req as any).user?.id;

      // Get file URL if file was uploaded
      const quotationFileUrl = req.file
        ? `/uploads/quotations/${req.file.filename}`
        : undefined;

      const quotation = await quotationsService.createQuotation(
        quotationData,
        quotationFileUrl,
        userId
      );

      res.status(201).json({
        success: true,
        data: quotation,
        message: 'Quotation created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /quotations/:id/evaluate
   * Evaluate quotation (NPD only)
   */
  async evaluateQuotation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const evaluateData = req.body as EvaluateQuotationDto;
      const userId = (req as any).user.id;

      const quotation = await quotationsService.evaluateQuotation(
        id,
        evaluateData,
        userId
      );

      res.json({
        success: true,
        data: quotation,
        message: 'Quotation evaluated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /prs/:prId/quotations/compare
   * Compare quotations for a PR
   */
  async compareQuotations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { prId } = req.params;
      const comparison = await quotationsService.compareQuotations(prId);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new QuotationsController();

