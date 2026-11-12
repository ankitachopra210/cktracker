const Joi = require('joi');

const createCustomerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().min(10).max(15).required(),
  password: Joi.string().min(6).optional(),
  address: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  pincode: Joi.string().allow('', null).optional(),
  propertyType: Joi.string().valid('Apartment', 'Luxury Villa', 'Independent House', 'Penthouse', 'Builder Floor', 'Commercial Studio', 'Other').optional(),
  kitchenDimensions: Joi.string().allow('', null).optional(),
  estimatedBudget: Joi.number().positive().allow(null).optional(),
  preferredStyle: Joi.string().valid('Modern Minimalist', 'Contemporary', 'Scandinavian', 'Industrial', 'Traditional Classical', 'Handleless Gola Profile', 'Bohemian / Eclectic').optional(),
  preferredMaterials: Joi.string().allow('', null).optional(),
  leadSource: Joi.string().valid('Showroom Walk-in', 'Website Form', 'Architect Referral', 'Social Media / Instagram', 'Existing Client Referral', 'Builder Tie-up').optional(),
  requirementsNotes: Joi.string().allow('', null).optional(),
  assignedManagerId: Joi.string().allow('', null).optional(),
});

const updateCustomerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  phoneNumber: Joi.string().min(10).max(15).optional(),
  address: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  pincode: Joi.string().allow('', null).optional(),
  propertyType: Joi.string().optional(),
  kitchenDimensions: Joi.string().allow('', null).optional(),
  estimatedBudget: Joi.number().positive().allow(null).optional(),
  preferredStyle: Joi.string().optional(),
  preferredMaterials: Joi.string().allow('', null).optional(),
  leadSource: Joi.string().optional(),
  requirementsNotes: Joi.string().allow('', null).optional(),
});

const createLeadSchema = Joi.object({
  contactName: Joi.string().min(2).max(100).required(),
  contactEmail: Joi.string().email().allow('', null).optional(),
  contactPhone: Joi.string().min(10).max(15).required(),
  propertyAddress: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('NEW', 'CONTACTED', 'INTERESTED', 'SITE_VISIT_SCHEDULED', 'QUOTATION_SENT', 'CONVERTED', 'LOST').default('NEW'),
  estimatedBudget: Joi.number().positive().allow(null).optional(),
  preferredStyle: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  assignedManagerId: Joi.string().allow('', null).optional(),
});

const updateLeadStageSchema = Joi.object({
  status: Joi.string().valid('NEW', 'CONTACTED', 'INTERESTED', 'SITE_VISIT_SCHEDULED', 'QUOTATION_SENT', 'CONVERTED', 'LOST').required(),
  notes: Joi.string().allow('', null).optional(),
});

const convertLeadSchema = Joi.object({
  projectTitle: Joi.string().min(3).required(),
  kitchenType: Joi.string().valid('L-Shaped', 'U-Shaped', 'Island Kitchen', 'Parallel Kitchen', 'Straight Kitchen').required(),
  budget: Joi.number().positive().required(),
  expectedCompletion: Joi.date().greater('now').optional(),
  password: Joi.string().min(6).optional(),
});

const createAppointmentSchema = Joi.object({
  title: Joi.string().min(3).max(150).required(),
  type: Joi.string().valid('SHOWROOM_CONSULTATION', 'SITE_MEASUREMENT', 'DESIGN_PRESENTATION', 'FINAL_INSPECTION', 'HANDOVER').default('SITE_MEASUREMENT'),
  scheduledDate: Joi.date().iso().required(),
  location: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  customerId: Joi.string().allow('', null).optional(),
  leadId: Joi.string().allow('', null).optional(),
  assignedEmployeeId: Joi.string().allow('', null).optional(),
});

const logInteractionSchema = Joi.object({
  interactionType: Joi.string().valid('Phone Call', 'WhatsApp Chat', 'Showroom Visit', 'Site Visit', 'Email', 'Virtual Meeting').required(),
  summary: Joi.string().min(3).required(),
  nextFollowUpDate: Joi.date().iso().allow(null).optional(),
  customerId: Joi.string().allow('', null).optional(),
  leadId: Joi.string().allow('', null).optional(),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  createLeadSchema,
  updateLeadStageSchema,
  convertLeadSchema,
  createAppointmentSchema,
  logInteractionSchema,
};
