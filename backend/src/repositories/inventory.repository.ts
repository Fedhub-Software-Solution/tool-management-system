import { Prisma, InventoryStatus, TransactionType } from '@prisma/client';
import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import {
  InventoryFilters,
  InventoryItemResponse,
  InventoryItemWithHistoryResponse,
  LowStockItemResponse,
  StockTransactionResponse,
} from '../types/inventory.types';
import { PAGINATION } from '../utils/constants';

export class InventoryRepository {
  /**
   * Find inventory item by ID
   */
  async findById(id: string): Promise<InventoryItemResponse | null> {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return null;
    }

    return this.mapToInventoryItemResponse(item);
  }

  /**
   * Find inventory item by part number, tool number, and item code
   */
  async findByUniqueKey(
    partNumber: string,
    toolNumber: string,
    itemCode?: string,
  ): Promise<InventoryItemResponse | null> {
    const item = await prisma.inventoryItem.findFirst({
      where: {
        partNumber,
        toolNumber,
        ...(itemCode && { itemCode }),
      },
    });

    if (!item) {
      return null;
    }

    return this.mapToInventoryItemResponse(item);
  }

  /**
   * Find all inventory items with filtering and pagination
   */
  async findAll(filters: InventoryFilters = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      partNumber,
      toolNumber,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, PAGINATION.MAX_LIMIT);

    const where: Prisma.InventoryItemWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (partNumber) {
      where.partNumber = { contains: partNumber, mode: 'insensitive' };
    }

    if (toolNumber) {
      where.toolNumber = { contains: toolNumber, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { toolNumber: { contains: search, mode: 'insensitive' } },
        { itemCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.InventoryItemOrderByWithRelationInput = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'currentStock') {
      orderBy.currentStock = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapToInventoryItemResponse(item)),
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Find inventory item by ID with transaction history
   */
  async findByIdWithHistory(
    id: string,
  ): Promise<InventoryItemWithHistoryResponse | null> {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        stockTransactions: {
          include: {
            performer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            transactionDate: 'desc',
          },
        },
      },
    });

    if (!item) {
      return null;
    }

    const additionHistory = item.stockTransactions
      .filter((t) => t.transactionType === 'Addition')
      .map((t) => this.mapToStockTransactionResponse(t));
    const removalHistory = item.stockTransactions
      .filter((t) => t.transactionType === 'Removal')
      .map((t) => this.mapToStockTransactionResponse(t));

    return {
      ...this.mapToInventoryItemResponse(item),
      transactionHistory: item.stockTransactions.map((t) =>
        this.mapToStockTransactionResponse(t),
      ),
      additionHistory,
      removalHistory,
    };
  }

  /**
   * Create inventory item
   */
  async create(
    data: {
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
    },
  ): Promise<InventoryItemResponse> {
    const item = await prisma.inventoryItem.create({
      data: {
        ...data,
        currentStock: data.currentStock || 0,
        unitOfMeasure: data.unitOfMeasure || 'PCS',
        status: this.calculateStatus(
          data.currentStock || 0,
          data.minStockLevel,
        ),
      },
    });

    return this.mapToInventoryItemResponse(item);
  }

  /**
   * Update inventory item
   */
  async update(
    id: string,
    data: {
      minStockLevel?: number;
      maxStockLevel?: number;
      unitOfMeasure?: string;
      location?: string;
      notes?: string;
    },
  ): Promise<InventoryItemResponse> {
    // Get current item to recalculate status
    const currentItem = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!currentItem) {
      throw new NotFoundError('Inventory item not found');
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...data,
        status: this.calculateStatus(
          currentItem.currentStock,
          data.minStockLevel ?? currentItem.minStockLevel,
        ),
      },
    });

    return this.mapToInventoryItemResponse(item);
  }

  /**
   * Add stock (from handover approval)
   */
  async addStock(
    inventoryItemId: string,
    quantity: number,
    data: {
      referenceType: string;
      referenceId: string;
      prNumber?: string;
      projectId?: string;
      purpose?: string;
      performedBy: string;
      notes?: string;
    },
  ): Promise<InventoryItemResponse> {
    return prisma.$transaction(async (tx) => {
      // Get current item
      const currentItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
      });

      if (!currentItem) {
        throw new NotFoundError('Inventory item not found');
      }

      const newStock = currentItem.currentStock + quantity;
      const newStatus = this.calculateStatus(newStock, currentItem.minStockLevel);

      // Update inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          currentStock: newStock,
          status: newStatus,
          lastRestockedAt: new Date(),
          lastRestockedQuantity: quantity,
        },
      });

      // Create stock transaction
      await tx.stockTransaction.create({
        data: {
          inventoryItemId,
          transactionType: 'Addition',
          quantity,
          balanceAfter: newStock,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          prNumber: data.prNumber,
          projectId: data.projectId,
          purpose: data.purpose,
          performedBy: data.performedBy,
          notes: data.notes,
        },
      });

      return this.mapToInventoryItemResponse(updatedItem);
    });
  }

  /**
   * Remove stock (from spares request fulfillment)
   */
  async removeStock(
    inventoryItemId: string,
    quantity: number,
    data: {
      referenceType: string;
      referenceId: string;
      purpose?: string;
      performedBy: string;
      notes?: string;
    },
  ): Promise<InventoryItemResponse> {
    return prisma.$transaction(async (tx) => {
      // Get current item
      const currentItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
      });

      if (!currentItem) {
        throw new NotFoundError('Inventory item not found');
      }

      if (currentItem.currentStock < quantity) {
        throw new Error('Insufficient stock');
      }

      const newStock = currentItem.currentStock - quantity;
      const newStatus = this.calculateStatus(newStock, currentItem.minStockLevel);

      // Update inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          currentStock: newStock,
          status: newStatus,
        },
      });

      // Create stock transaction
      await tx.stockTransaction.create({
        data: {
          inventoryItemId,
          transactionType: 'Removal',
          quantity,
          balanceAfter: newStock,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          purpose: data.purpose,
          performedBy: data.performedBy,
          notes: data.notes,
        },
      });

      return this.mapToInventoryItemResponse(updatedItem);
    });
  }

  /**
   * Adjust stock manually
   */
  async adjustStock(
    inventoryItemId: string,
    quantity: number,
    type: TransactionType,
    data: {
      performedBy: string;
      notes?: string;
    },
  ): Promise<InventoryItemResponse> {
    return prisma.$transaction(async (tx) => {
      // Get current item
      const currentItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
      });

      if (!currentItem) {
        throw new NotFoundError('Inventory item not found');
      }

      let newStock: number;
      if (type === 'Addition') {
        newStock = currentItem.currentStock + quantity;
      } else if (type === 'Removal') {
        if (currentItem.currentStock < quantity) {
          throw new Error('Insufficient stock');
        }
        newStock = currentItem.currentStock - quantity;
      } else {
        // Adjustment - set to exact quantity
        newStock = quantity;
      }

      const newStatus = this.calculateStatus(newStock, currentItem.minStockLevel);

      // Update inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          currentStock: newStock,
          status: newStatus,
          ...(type === 'Addition' && {
            lastRestockedAt: new Date(),
            lastRestockedQuantity: quantity,
          }),
        },
      });

      // Create stock transaction
      await tx.stockTransaction.create({
        data: {
          inventoryItemId,
          transactionType: type,
          quantity,
          balanceAfter: newStock,
          referenceType: 'Manual',
          performedBy: data.performedBy,
          notes: data.notes,
        },
      });

      return this.mapToInventoryItemResponse(updatedItem);
    });
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(): Promise<LowStockItemResponse[]> {
    const items = await prisma.inventoryItem.findMany({
      where: {
        OR: [
          { status: InventoryStatus.LowStock },
          { status: InventoryStatus.OutOfStock },
        ],
      },
      orderBy: [
        { status: 'asc' }, // OutOfStock first
        { currentStock: 'asc' },
      ],
    });

    return items.map((item) => ({
      id: item.id,
      partNumber: item.partNumber,
      toolNumber: item.toolNumber,
      itemCode: item.itemCode,
      name: item.name,
      currentStock: item.currentStock,
      minStockLevel: item.minStockLevel,
      maxStockLevel: item.maxStockLevel,
      shortageQuantity: Math.max(0, item.minStockLevel - item.currentStock),
      status: item.status,
      location: item.location,
    }));
  }

  /**
   * Calculate inventory status based on stock levels
   */
  private calculateStatus(
    currentStock: number,
    minStockLevel: number,
  ): InventoryStatus {
    if (currentStock <= 0) {
      return InventoryStatus.OutOfStock;
    } else if (currentStock < minStockLevel) {
      return InventoryStatus.LowStock;
    } else {
      return InventoryStatus.InStock;
    }
  }

  /**
   * Map Prisma inventory item to response
   */
  private mapToInventoryItemResponse(
    item: any,
  ): InventoryItemResponse {
    return {
      id: item.id,
      partNumber: item.partNumber,
      toolNumber: item.toolNumber,
      itemCode: item.itemCode,
      name: item.name,
      currentStock: item.currentStock,
      minStockLevel: item.minStockLevel,
      maxStockLevel: item.maxStockLevel,
      unitOfMeasure: item.unitOfMeasure,
      status: item.status,
      location: item.location,
      lastRestockedAt: item.lastRestockedAt,
      lastRestockedQuantity: item.lastRestockedQuantity,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Map Prisma stock transaction to response
   */
  private mapToStockTransactionResponse(
    transaction: any,
  ): StockTransactionResponse {
    return {
      id: transaction.id,
      inventoryItemId: transaction.inventoryItemId,
      transactionType: transaction.transactionType,
      quantity: transaction.quantity,
      balanceAfter: transaction.balanceAfter,
      referenceType: transaction.referenceType,
      referenceId: transaction.referenceId,
      prNumber: transaction.prNumber,
      projectId: transaction.projectId,
      purpose: transaction.purpose,
      performedBy: transaction.performedBy,
      performer: transaction.performer,
      transactionDate: transaction.transactionDate,
      notes: transaction.notes,
    };
  }
}

export const inventoryRepository = new InventoryRepository();

