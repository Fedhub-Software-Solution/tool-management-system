import bomItemRepository from '../repositories/bom-item.repository';
import { CreateBomItemDto, UpdateBomItemDto, BomItemResponse } from '../types/bom-item.types';
import { NotFoundError } from '../utils/errors';

export class BomItemService {
  /**
   * Get all BOM items
   */
  async getAllBomItems(): Promise<BomItemResponse[]> {
    const items = await bomItemRepository.findAll();
    return items.map((item) => this.mapToBomItemResponse(item));
  }

  /**
   * Get BOM item by ID
   */
  async getBomItemById(id: string): Promise<BomItemResponse> {
    const item = await bomItemRepository.findById(id);

    if (!item) {
      throw new NotFoundError('BOM item not found');
    }

    return this.mapToBomItemResponse(item);
  }

  /**
   * Create BOM item
   */
  async createBomItem(data: CreateBomItemDto, createdBy?: string): Promise<BomItemResponse> {
    const item = await bomItemRepository.create({
      ...data,
      createdBy,
    });

    return this.mapToBomItemResponse(item);
  }

  /**
   * Update BOM item
   */
  async updateBomItem(id: string, data: UpdateBomItemDto, updatedBy?: string): Promise<BomItemResponse> {
    const item = await bomItemRepository.findById(id);

    if (!item) {
      throw new NotFoundError('BOM item not found');
    }

    const updatedItem = await bomItemRepository.update(id, {
      ...data,
      updatedBy,
    });

    return this.mapToBomItemResponse(updatedItem);
  }

  /**
   * Delete BOM item
   */
  async deleteBomItem(id: string): Promise<void> {
    const item = await bomItemRepository.findById(id);

    if (!item) {
      throw new NotFoundError('BOM item not found');
    }

    await bomItemRepository.delete(id);
  }

  /**
   * Map BomItem entity to BomItemResponse
   */
  private mapToBomItemResponse(item: any): BomItemResponse {
    return {
      id: item.id,
      itemName: item.itemName,
      category: item.category,
      unit: item.unit,
      unitPrice: item.unitPrice,
      supplier: item.supplier,
      partNumber: item.partNumber,
      toolNumber: item.toolNumber,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
    };
  }
}

export default new BomItemService();

