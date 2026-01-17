import { RequestStatus } from '@prisma/client';

export interface CreateSparesRequestDto {
  inventoryItemId: string;
  quantityRequested: number;
  projectId?: string;
  purpose?: string;
}

export interface FulfillRequestDto {
  quantityFulfilled: number;
  notes?: string;
}

export interface RejectRequestDto {
  rejectionReason: string;
}

export interface RequestFilters {
  page?: number;
  limit?: number;
  status?: RequestStatus;
  requestedBy?: string;
  inventoryItemId?: string;
  projectId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RequestUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string | null;
}

export interface RequestInventoryItemInfo {
  id: string;
  name: string;
  partNumber: string;
  toolNumber: string;
  itemCode: string | null;
  currentStock: number;
  minStockLevel: number;
  status: string;
}

export interface RequestProjectInfo {
  id: string;
  projectNumber: string;
  customerPO: string;
  partNumber: string;
  toolNumber: string;
}

export interface SparesRequestResponse {
  id: string;
  requestNumber: string;
  requestedBy: string;
  requester: RequestUserInfo;
  inventoryItemId: string;
  inventoryItem: RequestInventoryItemInfo;
  itemName: string;
  partNumber: string;
  toolNumber: string;
  quantityRequested: number;
  quantityFulfilled: number;
  status: RequestStatus;
  requestDate: Date;
  projectId: string | null;
  project: RequestProjectInfo | null;
  purpose: string | null;
  fulfilledAt: Date | null;
  fulfilledBy: string | null;
  fulfiller: RequestUserInfo | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

