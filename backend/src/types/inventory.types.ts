import { InventoryStatus, TransactionType } from '@prisma/client';

export interface CreateInventoryItemDto {
  partNumber: string;
  toolNumber: string;
  itemCode?: string;
  name: string;
  currentStock?: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unitOfMeasure?: string;
  location?: string;
  notes?: string;
}

export interface UpdateInventoryItemDto {
  minStockLevel?: number;
  maxStockLevel?: number;
  unitOfMeasure?: string;
  location?: string;
  notes?: string;
}

export interface AdjustStockDto {
  quantity: number;
  type: TransactionType;
  notes?: string;
}

export interface InventoryFilters {
  page?: number;
  limit?: number;
  status?: InventoryStatus;
  partNumber?: string;
  toolNumber?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StockTransactionResponse {
  id: string;
  inventoryItemId: string;
  transactionType: TransactionType;
  quantity: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  prNumber: string | null;
  projectId: string | null;
  purpose: string | null;
  performedBy: string;
  performer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  transactionDate: Date;
  notes: string | null;
}

export interface InventoryItemResponse {
  id: string;
  partNumber: string;
  toolNumber: string;
  itemCode: string | null;
  name: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number | null;
  unitOfMeasure: string;
  status: InventoryStatus;
  location: string | null;
  lastRestockedAt: Date | null;
  lastRestockedQuantity: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItemWithHistoryResponse extends InventoryItemResponse {
  transactionHistory: StockTransactionResponse[];
  additionHistory: StockTransactionResponse[];
  removalHistory: StockTransactionResponse[];
}

export interface LowStockItemResponse {
  id: string;
  partNumber: string;
  toolNumber: string;
  itemCode: string | null;
  name: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number | null;
  shortageQuantity: number;
  status: InventoryStatus;
  location: string | null;
}

