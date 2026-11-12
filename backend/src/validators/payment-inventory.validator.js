const Joi = require('joi');

const recordPaymentSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  invoiceId: Joi.string().uuid().allow('', null).optional(),
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string()
    .valid('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'ONLINE_GATEWAY')
    .default('BANK_TRANSFER'),
  transactionReference: Joi.string().min(3).required().messages({
    'any.required': 'Transaction reference (e.g. UTR / Cheque No) is required.',
  }),
  milestoneTitle: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  paymentDate: Joi.date().iso().optional(),
});

const createInvoiceSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  quotationId: Joi.string().uuid().allow('', null).optional(),
  dueDate: Joi.date().iso().required(),
  totalAmount: Joi.number().positive().required(),
  notes: Joi.string().allow('', null).optional(),
});

const createInventoryItemSchema = Joi.object({
  itemCode: Joi.string().min(2).max(30).required(),
  name: Joi.string().min(3).max(150).required(),
  category: Joi.string()
    .valid(
      'BASE_CABINETS',
      'WALL_CABINETS',
      'TALL_UNITS',
      'COUNTERTOPS',
      'LAMINATES',
      'ACRYLIC_FINISHES',
      'HINGES',
      'DRAWER_CHANNELS',
      'HANDLES',
      'KITCHEN_ACCESSORIES',
      'INSTALLATION_SERVICES',
      'MISCELLANEOUS'
    )
    .required(),
  unit: Joi.string().valid('Sheets', 'SqFt', 'Meters', 'Pairs', 'Pieces', 'Sets').required(),
  currentStock: Joi.number().min(0).default(0),
  minimumStockLevel: Joi.number().min(0).default(10),
  unitCost: Joi.number().positive().required(),
  location: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
});

const allocateStockSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  quantity: Joi.number().positive().required(),
  referenceNote: Joi.string().allow('', null).optional(),
});

const createSupplierSchema = Joi.object({
  supplierCode: Joi.string().min(2).max(30).required(),
  companyName: Joi.string().min(3).max(150).required(),
  contactPerson: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  phone: Joi.string().min(10).max(15).required(),
  gstin: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  materialCategories: Joi.string().allow('', null).optional(),
});

const createPOSchema = Joi.object({
  supplierId: Joi.string().uuid().required(),
  expectedDeliveryDate: Joi.date().iso().optional(),
  notes: Joi.string().allow('', null).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        inventoryItemId: Joi.string().uuid().required(),
        quantity: Joi.number().positive().required(),
        unitPrice: Joi.number().positive().required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = {
  recordPaymentSchema,
  createInvoiceSchema,
  createInventoryItemSchema,
  allocateStockSchema,
  createSupplierSchema,
  createPOSchema,
};
