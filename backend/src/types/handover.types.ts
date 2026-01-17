import { HandoverStatus } from '@prisma/client';

export interface CreateHandoverDto {
  projectId: string;
  prId: string;
  toolSetDescription: string;
  items: HandoverItemDto[];
  criticalSpares?: CriticalSpareDto[];
}

export interface HandoverItemDto {
  prItemId: string;
  receivedQuantity: number;
}

export interface CriticalSpareDto {
  prItemId: string;
  quantity: number;
}

export interface ApproveHandoverDto {
  remarks?: string;
}

export interface RejectHandoverDto {
  remarks: string;
}

export interface HandoverFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  prId?: string;
  status?: HandoverStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface HandoverItemResponse {
  id: string;
  prItemId: string;
  itemName: string;
  specification: string | null;
  quantity: number;
  requirements: string | null;
  receivedQuantity: number;
  isCriticalSpare: boolean;
  createdAt: Date;
}

export interface HandoverProjectInfo {
  id: string;
  projectNumber: string;
  customerPO: string;
  partNumber: string;
  toolNumber: string;
}

export interface HandoverPRInfo {
  id: string;
  prNumber: string;
  prType: string;
  status: string;
}

export interface HandoverUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string | null;
}

export interface HandoverResponse {
  id: string;
  handoverNumber: string;
  projectId: string;
  project: HandoverProjectInfo;
  prId: string;
  pr: HandoverPRInfo;
  toolSetDescription: string;
  status: HandoverStatus;
  remarks: string | null;
  initiatedBy: string;
  initiator: HandoverUserInfo;
  initiatedAt: Date;
  inspectedBy: string | null;
  inspector: HandoverUserInfo | null;
  inspectionDate: Date | null;
  completedAt: Date | null;
  items: HandoverItemResponse[];
  criticalSpares: HandoverItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

