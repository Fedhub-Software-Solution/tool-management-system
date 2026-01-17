import { PRStatus, PRType } from '@prisma/client';

export interface PRItemDto {
  itemCode?: string;
  name: string;
  specification: string;
  quantity: number;
  requirements?: string;
  bomUnitPrice?: number;
  sequenceNumber?: number;
}

export interface CriticalSpareDto {
  prItemId: string;
  quantity: number;
  notes?: string;
}

export interface CreatePRDto {
  projectId: string;
  prType: PRType;
  modRefReason?: string;
  items: PRItemDto[];
  supplierIds?: string[];
  criticalSpares?: Omit<CriticalSpareDto, 'prItemId'>[];
}

export interface UpdatePRDto {
  prType?: PRType;
  modRefReason?: string;
  items?: PRItemDto[];
  supplierIds?: string[];
  criticalSpares?: Omit<CriticalSpareDto, 'prItemId'>[];
}

export interface PRFilters {
  status?: PRStatus;
  prType?: PRType;
  projectId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApprovePRDto {
  comments?: string;
}

export interface RejectPRDto {
  comments: string;
}

export interface PRUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PRItemResponse {
  id: string;
  itemCode?: string | null;
  name: string;
  specification: string;
  quantity: number;
  requirements?: string | null;
  bomUnitPrice?: number | null;
  sequenceNumber?: number | null;
  createdAt: Date;
}

export interface CriticalSpareResponse {
  id: string;
  prItemId: string;
  quantity: number;
  notes?: string | null;
  createdAt: Date;
}

export interface PRProjectInfo {
  id: string;
  projectNumber: string;
  customerPO: string;
  partNumber: string;
  toolNumber: string;
}

export interface PRSupplierInfo {
  id: string;
  supplierCode: string;
  name: string;
}

export interface PRResponse {
  id: string;
  prNumber: string;
  projectId: string;
  project?: PRProjectInfo;
  prType: PRType;
  status: PRStatus;
  modRefReason?: string | null;
  approverComments?: string | null;
  itemsReceivedDate?: Date | null;
  awardedSupplierId?: string | null;
  awardedSupplier?: PRSupplierInfo | null;
  createdBy: PRUserInfo | string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: PRUserInfo | string | null;
  approvedAt?: Date | null;
  approvedBy?: PRUserInfo | string | null;
  items?: PRItemResponse[];
  criticalSpares?: CriticalSpareResponse[];
}

