import quotationsRepository from '../repositories/quotations.repository';
import prsRepository from '../repositories/prs.repository';
import suppliersRepository from '../repositories/suppliers.repository';
import { notificationsService } from './notifications.service';
import { generateQuotationNumber } from '../utils/quotation-number';
import {
  CreateQuotationDto,
  QuotationFilters,
  QuotationResponse,
  EvaluateQuotationDto,
  QuotationComparisonResponse,
} from '../types/quotation.types';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { QuotationStatus } from '@prisma/client';

export class QuotationsService {
  /**
   * Get quotation by ID
   */
  async getQuotationById(id: string): Promise<QuotationResponse> {
    const quotation = await quotationsRepository.findById(id);

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    return this.mapToQuotationResponse(quotation);
  }

  /**
   * Get all quotations with filtering and pagination
   */
  async getAllQuotations(filters: QuotationFilters = {}) {
    const result = await quotationsRepository.findAll(filters);

    return {
      data: result.quotations.map((quotation) =>
        this.mapToQuotationResponse(quotation)
      ),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Create quotation
   */
  async createQuotation(
    data: CreateQuotationDto,
    quotationFileUrl?: string,
    submittedBy?: string
  ): Promise<QuotationResponse> {
    // Validate PR exists
    const pr = await prsRepository.findById(data.prId);
    if (!pr) {
      throw new NotFoundError('PR not found');
    }

    // Validate supplier exists
    const supplier = await suppliersRepository.findById(data.supplierId);
    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    // Validate items match PR items
    if (data.items.length === 0) {
      throw new BadRequestError('At least one item is required');
    }

    // Generate quotation number
    const quotationNumber = await generateQuotationNumber(() =>
      quotationsRepository.getLatestQuotationNumber()
    );

    // Check if quotation number already exists
    const existingQuotation = await quotationsRepository.findByQuotationNumber(
      quotationNumber
    );
    if (existingQuotation) {
      throw new ConflictError('Quotation number already exists');
    }

    // Create quotation
    const quotation = await quotationsRepository.create({
      ...data,
      quotationNumber,
      quotationFileUrl,
      submittedBy,
    });

    if (!quotation) {
      throw new Error('Failed to create quotation');
    }

    const quotationResponse = this.mapToQuotationResponse(quotation);

    // Notify NPD (pr and supplier are already validated above)
    await notificationsService.notifyQuotationReceived(
      quotationResponse.id,
      pr.prNumber,
      supplier.name,
    );

    return quotationResponse;
  }

  /**
   * Evaluate quotation
   */
  async evaluateQuotation(
    id: string,
    data: EvaluateQuotationDto,
    evaluatedBy: string
  ): Promise<QuotationResponse> {
    const quotation = await quotationsRepository.findById(id);

    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    // Only Pending quotations can be evaluated
    if (quotation.status !== 'Pending') {
      throw new BadRequestError('Only pending quotations can be evaluated');
    }

    // Evaluate quotation
    await quotationsRepository.evaluate(
      id,
      data.status,
      evaluatedBy,
      data.notes
    );

    // Fetch updated quotation
    const updatedQuotation = await quotationsRepository.findById(id);

    if (!updatedQuotation) {
      throw new Error('Failed to fetch updated quotation');
    }

    return this.mapToQuotationResponse(updatedQuotation);
  }

  /**
   * Compare quotations for a PR
   */
  async compareQuotations(prId: string): Promise<QuotationComparisonResponse> {
    // Validate PR exists
    const pr = await prsRepository.findById(prId);
    if (!pr) {
      throw new NotFoundError('PR not found');
    }

    // Get all quotations for this PR
    const quotations = await quotationsRepository.findByPRId(prId);

    if (quotations.length === 0) {
      throw new NotFoundError('No quotations found for this PR');
    }

    // Map quotations to responses
    const quotationResponses = quotations.map((q) => this.mapToQuotationResponse(q));

    // Find best quotations
    const lowestPrice = quotationResponses.reduce((min, q) =>
      q.totalPrice < min.totalPrice ? q : min
    );

    const fastestDelivery = quotationResponses
      .filter((q) => q.deliveryDate)
      .reduce((min, q) => {
        if (!min.deliveryDate) return q;
        return new Date(q.deliveryDate) < new Date(min.deliveryDate) ? q : min;
      }, quotationResponses[0]);

    const bestRating = quotationResponses
      .filter((q) => q.supplier?.rating)
      .reduce((best, q) => {
        if (!best.supplier?.rating) return q;
        const qRating = Number(q.supplier.rating) || 0;
        const bestRating = Number(best.supplier.rating) || 0;
        return qRating > bestRating ? q : best;
      }, quotationResponses[0]);

    // Determine best quotation (lowest price priority)
    const bestQuotation = lowestPrice;

    return {
      prId: pr.id,
      prNumber: pr.prNumber,
      quotations: quotationResponses,
      bestQuotation,
      comparison: {
        lowestPrice,
        fastestDelivery: fastestDelivery?.deliveryDate ? fastestDelivery : null,
        bestRating: bestRating?.supplier?.rating ? bestRating : null,
      },
    };
  }

  /**
   * Map Quotation entity to QuotationResponse
   */
  private mapToQuotationResponse(quotation: any): QuotationResponse {
    return {
      id: quotation.id,
      quotationNumber: quotation.quotationNumber,
      prId: quotation.prId,
      pr: quotation.pr
        ? {
            id: quotation.pr.id,
            prNumber: quotation.pr.prNumber,
          }
        : undefined,
      supplierId: quotation.supplierId,
      supplier: quotation.supplier
        ? {
            id: quotation.supplier.id,
            supplierCode: quotation.supplier.supplierCode,
            name: quotation.supplier.name,
            rating: quotation.supplier.rating
              ? Number(quotation.supplier.rating)
              : undefined,
          }
        : undefined,
      totalPrice: Number(quotation.totalPrice),
      deliveryTerms: quotation.deliveryTerms,
      deliveryDate: quotation.deliveryDate,
      validityDate: quotation.validityDate,
      status: quotation.status,
      notes: quotation.notes,
      quotationFileUrl: quotation.quotationFileUrl,
      createdAt: quotation.createdAt,
      updatedAt: quotation.updatedAt,
      submittedBy: quotation.submittedBy,
      evaluatedAt: quotation.evaluatedAt,
      evaluatedBy: quotation.evaluatedBy,
      items: quotation.quotationItems
        ? quotation.quotationItems.map((item: any) => ({
            id: item.id,
            prItemId: item.prItemId,
            itemName: item.itemName,
            unitPrice: Number(item.unitPrice),
            quantity: item.quantity,
            totalPrice: Number(item.totalPrice),
            createdAt: item.createdAt,
          }))
        : undefined,
    };
  }
}

export default new QuotationsService();

