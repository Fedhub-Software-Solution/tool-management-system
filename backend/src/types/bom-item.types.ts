export interface CreateBomItemDto {
  itemName: string;
  category: string;
  unit: string;
  unitPrice: string;
  supplier?: string;
  partNumber?: string;
  toolNumber?: string;
}

export interface UpdateBomItemDto {
  itemName?: string;
  category?: string;
  unit?: string;
  unitPrice?: string;
  supplier?: string;
  partNumber?: string;
  toolNumber?: string;
}

export interface BomItemResponse {
  id: string;
  itemName: string;
  category: string;
  unit: string;
  unitPrice: string;
  supplier?: string;
  partNumber?: string;
  toolNumber?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

