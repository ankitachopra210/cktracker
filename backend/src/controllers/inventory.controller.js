const inventoryService = require('../services/inventory.service');
const { sendSuccess } = require('../utils/helpers');

class InventoryController {
  async getInventory(req, res, next) {
    try {
      const { category, lowStockOnly, search } = req.query;
      const items = await inventoryService.getInventory({ category, lowStockOnly, search });
      return sendSuccess(res, items, 'Inventory fetched successfully.');
    } catch (error) {
      next(error);
    }
  }

  async getInventoryItemById(req, res, next) {
    try {
      const item = await inventoryService.getInventoryItemById(req.params.id);
      return sendSuccess(res, item, 'Inventory item details.');
    } catch (error) {
      next(error);
    }
  }

  async createInventoryItem(req, res, next) {
    try {
      const item = await inventoryService.createInventoryItem(req.body, req.user?.id);
      return sendSuccess(res, item, 'Inventory material added.', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateInventoryItem(req, res, next) {
    try {
      const item = await inventoryService.updateInventoryItem(req.params.id, req.body, req.user?.id);
      return sendSuccess(res, item, 'Inventory material updated.');
    } catch (error) {
      next(error);
    }
  }

  async allocateStock(req, res, next) {
    try {
      const { id } = req.params;
      const { projectId, quantity, referenceNote } = req.body;
      const result = await inventoryService.allocateStockToProject(id, projectId, quantity, referenceNote, req.user?.id);
      return sendSuccess(res, result, 'Material allocated to project successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async getSuppliers(req, res, next) {
    try {
      const suppliers = await inventoryService.getSuppliers();
      return sendSuccess(res, suppliers, 'Suppliers fetched.');
    } catch (error) {
      next(error);
    }
  }

  async createSupplier(req, res, next) {
    try {
      const supplier = await inventoryService.createSupplier(req.body, req.user?.id);
      return sendSuccess(res, supplier, 'Supplier created.', 201);
    } catch (error) {
      next(error);
    }
  }

  async createPurchaseOrder(req, res, next) {
    try {
      const po = await inventoryService.createPurchaseOrder(req.body, req.user?.id);
      return sendSuccess(res, po, 'Purchase order generated.', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
