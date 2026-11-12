const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/rbac.middleware');
const { validateBody } = require('../middleware/validate.middleware');
const {
  createInventoryItemSchema,
  allocateStockSchema,
  createSupplierSchema,
  createPOSchema,
} = require('../validators/payment-inventory.validator');

router.use(authenticate);

// Suppliers (Admin only)
router.get('/suppliers', authorize('ADMIN'), inventoryController.getSuppliers);
router.post('/suppliers', authorize('ADMIN'), validateBody(createSupplierSchema), inventoryController.createSupplier);

// Purchase Orders (Admin only)
router.post('/purchase-orders', authorize('ADMIN'), validateBody(createPOSchema), inventoryController.createPurchaseOrder);

// Inventory list & details
router.get('/', authorize('ADMIN', 'MANAGER'), inventoryController.getInventory);
router.get('/:id', authorize('ADMIN', 'MANAGER'), inventoryController.getInventoryItemById);

// Create / edit inventory (Admin only)
router.post('/', authorize('ADMIN'), validateBody(createInventoryItemSchema), inventoryController.createInventoryItem);
router.put('/:id', authorize('ADMIN'), inventoryController.updateInventoryItem);

// Allocate stock to project (Admin & Manager)
router.post(
  '/:id/allocate',
  authorize('ADMIN', 'MANAGER'),
  validateBody(allocateStockSchema),
  inventoryController.allocateStock
);

module.exports = router;
