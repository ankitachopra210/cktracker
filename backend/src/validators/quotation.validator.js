const Joi = require('joi');

const quotationItemSchema = Joi.object({
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
  description: Joi.string().min(2).required(),
  dimensions: Joi.string().allow('', null).optional(),
  materialFinish: Joi.string().allow('', null).optional(),
  quantity: Joi.number().integer().min(1).default(1),
  unitPrice: Joi.number().min(0).required(),
  discount: Joi.number().min(0).default(0),
});

const createQuotationSchema = Joi.object({
  items: Joi.array().items(quotationItemSchema).min(1).required(),
  discountPercentage: Joi.number().min(0).max(100).default(0),
  gstPercentage: Joi.number().min(0).max(28).default(18),
  installationCharges: Joi.number().min(0).default(0),
  transportCharges: Joi.number().min(0).default(0),
  additionalCharges: Joi.number().min(0).default(0),
  expiryDays: Joi.number().integer().min(1).max(90).default(30),
  termsAndConditions: Joi.string().allow('', null).optional(),
});

const quotationDecisionSchema = Joi.object({
  decision: Joi.string().valid('APPROVED', 'REJECTED').required(),
  customerComments: Joi.string().allow('', null).optional(),
});

module.exports = {
  createQuotationSchema,
  quotationDecisionSchema,
};
