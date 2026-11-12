const prisma = require('../config/db');
const { generateCode } = require('../utils/helpers');
const { emitRealTimeUpdate } = require('../sockets');

class InventoryService {
  async getInventory({ category = '', lowStockOnly = false, search = '' }) {
    const where = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { itemCode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { itemCode: 'asc' },
      include: {
        _count: {
          select: { stockMovements: true },
        },
      },
    });

    const enriched = items.map((item) => ({
      ...item,
      isLowStock: Number(item.currentStock) <= Number(item.minimumStockLevel),
    }));

    if (lowStockOnly === true || lowStockOnly === 'true') {
      return enriched.filter((item) => item.isLowStock);
    }

    return enriched;
  }

  async getInventoryItemById(id) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          include: {
            project: { select: { projectCode: true, title: true } },
          },
        },
      },
    });

    if (!item) throw new Error('Inventory item not found.');
    return {
      ...item,
      isLowStock: Number(item.currentStock) <= Number(item.minimumStockLevel),
    };
  }

  async createInventoryItem(data, actorId) {
    const existing = await prisma.inventoryItem.findUnique({
      where: { itemCode: data.itemCode.trim().toUpperCase() },
    });
    if (existing) {
      throw new Error(`Inventory item with code "${data.itemCode}" already exists.`);
    }

    const item = await prisma.inventoryItem.create({
      data: {
        itemCode: data.itemCode.trim().toUpperCase(),
        name: data.name,
        category: data.category,
        unit: data.unit,
        currentStock: parseFloat(data.currentStock) || 0,
        minimumStockLevel: parseFloat(data.minimumStockLevel) || 10,
        unitCost: parseFloat(data.unitCost),
        location: data.location || null,
        description: data.description || null,
      },
    });

    if (actorId) {
      await prisma.activityLog.create({
        data: {
          actorId,
          action: 'INVENTORY_ITEM_CREATED',
          entityType: 'INVENTORY',
          entityId: item.id,
          details: `Added new material: ${item.name} (${item.itemCode})`,
        },
      });
    }

    return item;
  }

  async updateInventoryItem(id, data, actorId) {
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) throw new Error('Item not found.');

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        minimumStockLevel: data.minimumStockLevel !== undefined ? parseFloat(data.minimumStockLevel) : existing.minimumStockLevel,
        unitCost: data.unitCost !== undefined ? parseFloat(data.unitCost) : existing.unitCost,
        location: data.location !== undefined ? data.location : existing.location,
        description: data.description !== undefined ? data.description : existing.description,
      },
    });

    return updated;
  }

  /**
   * Allocate raw materials to a specific kitchen project.
   * STRICT CONSTRAINT: Never allow invalid negative stock quantities.
   */
  async allocateStockToProject(itemId, projectId, quantity, referenceNote = '', actorId) {
    const qty = parseFloat(quantity);
    if (qty <= 0) throw new Error('Quantity to allocate must be greater than zero.');

    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) throw new Error('Inventory material not found.');

    const currentQty = Number(item.currentStock);
    if (currentQty < qty) {
      throw new Error(
        `Insufficient inventory! Requested allocation: ${qty} ${item.unit}. Available in warehouse: ${currentQty} ${item.unit}.`
      );
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found.');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStock: currentQty - qty,
        },
      });

      // 2. Create StockMovement record
      const movement = await tx.stockMovement.create({
        data: {
          inventoryItemId: itemId,
          movementType: 'ALLOCATED_TO_PROJECT',
          quantity: qty,
          unitCost: item.unitCost,
          projectId,
          referenceNote: referenceNote || `Allocated to ${project.projectCode}`,
          performedByUserId: actorId || 'system',
        },
      });

      // 3. Activity Log
      if (actorId) {
        await tx.activityLog.create({
          data: {
            actorId,
            action: 'STOCK_ALLOCATED',
            entityType: 'INVENTORY',
            entityId: itemId,
            details: `Allocated ${qty} ${item.unit} of "${item.name}" to project ${project.projectCode}`,
          },
        });
      }

      return { updatedItem, movement };
    });

    emitRealTimeUpdate({
      target: 'broadcast',
      event: 'inventory:updated',
      payload: { itemId, currentStock: result.updatedItem.currentStock },
    });

    return result;
  }

  /**
   * Suppliers Management
   */
  async getSuppliers() {
    return await prisma.supplier.findMany({
      orderBy: { companyName: 'asc' },
      include: {
        _count: { select: { purchaseOrders: true } },
      },
    });
  }

  async createSupplier(data, actorId) {
    const supplier = await prisma.supplier.create({
      data: {
        supplierCode: data.supplierCode.trim().toUpperCase(),
        companyName: data.companyName,
        contactPerson: data.contactPerson || null,
        email: data.email || null,
        phone: data.phone,
        gstin: data.gstin || null,
        address: data.address || null,
        materialCategories: data.materialCategories || null,
      },
    });

    return supplier;
  }

  /**
   * Purchase Orders Management
   */
  async createPurchaseOrder(data, actorId) {
    const count = await prisma.purchaseOrder.count();
    const poNumber = generateCode('PO', count + 1);

    let totalAmount = 0;
    data.items.forEach((item) => {
      totalAmount += (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    });

    const po = await prisma.$transaction(async (tx) => {
      const created = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: data.supplierId,
          orderDate: new Date(),
          expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
          status: 'ORDERED',
          totalAmount,
          notes: data.notes || null,
        },
      });

      for (const item of data.items) {
        await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: created.id,
            inventoryItemId: item.inventoryItemId,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
          },
        });
      }

      return created;
    });

    return po;
  }
}

module.exports = new InventoryService();
