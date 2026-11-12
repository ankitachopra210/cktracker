const Joi = require('joi');

const createDesignSchema = Joi.object({
  title: Joi.string().min(3).max(150).required(),
  description: Joi.string().allow('', null).optional(),
  materialsDescription: Joi.string().allow('', null).optional(),
  finishes: Joi.string().allow('', null).optional(),
  layout2DUrl: Joi.string().uri().allow('', null).optional(),
  render3DUrl: Joi.string().uri().allow('', null).optional(),
  cadFileUrl: Joi.string().uri().allow('', null).optional(),
});

const designApprovalSchema = Joi.object({
  decision: Joi.string().valid('APPROVED', 'CHANGES_REQUESTED').required(),
  customerComments: Joi.string().allow('', null).optional(),
});

module.exports = {
  createDesignSchema,
  designApprovalSchema,
};
