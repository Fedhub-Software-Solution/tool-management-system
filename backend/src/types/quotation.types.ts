import { QuotationStatus } from '@prisma/client';

export interface QuotationItemDto {
  prItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface CreateQuotationDto {
  prId: string;
  supplierId: string;
  items: QuotationItemDto[];
  deliveryTerms?: string;
  deliveryDate?: string; // ISO date string
  validityDate?: string; // ISO date string
  notes?: string;
}

export interface EvaluateQuotationDto {
  status: QuotationStatus;
  notes?: string;
}

export interface QuotationFilters {
  prId?: string;
  supplierId?: string;
  status?: QuotationStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AwardPRDto {
  quotationId: string;
  supplierId: string;
}

export interface QuotationItemResponse {
  id: string;
  prItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  createdAt: Date;
}

export interface QuotationResponse {
  id: string;
  quotationNumber: string;
  prId: string;
  pr?: {
    id: string;
    prNumber: string;
  };
  supplierId: string;
  supplier?: {
    id: string;
    supplierCode: string;
    name: string;
  };
  totalPrice: number;
  deliveryTerms?: string | null;
  deliveryDate?: Date | null;
  validityDate?: Date | null;
  status: QuotationStatus;
  notes?: string | null;
  quotationFileUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  submittedBy?: string | null;
  evaluatedAt?: Date | null;
  evaluatedBy?: string | null;
  items?: QuotationItemResponse[];
}

export interface QuotationComparisonResponse {
  prId: string;
  prNumber: string;
  quotations: QuotationResponse[];
  bestQuotation?: QuotationResponse;
  comparison: {
    lowestPrice: QuotationResponse | null;
    fastestDelivery: QuotationResponse | null;
    bestRating: QuotationResponse | null;
  };
}

