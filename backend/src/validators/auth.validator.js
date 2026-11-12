const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long.',
    'any.required': 'Password is required.',
  }),
});

const registerCustomerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).optional(),
  phoneNumber: Joi.string().min(10).max(15).required(),
  address: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  pincode: Joi.string().allow('', null).optional(),
  propertyType: Joi.string().allow('', null).optional(),
  kitchenDimensions: Joi.string().allow('', null).optional(),
  estimatedBudget: Joi.number().positive().optional(),
  preferredStyle: Joi.string().allow('', null).optional(),
  preferredMaterials: Joi.string().allow('', null).optional(),
  leadSource: Joi.string().allow('', null).optional(),
  requirementsNotes: Joi.string().allow('', null).optional(),
  assignedManagerId: Joi.string().allow('', null).optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long.',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

module.exports = {
  loginSchema,
  registerCustomerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
