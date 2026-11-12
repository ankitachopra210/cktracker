const Joi = require('joi');

const createProjectSchema = Joi.object({
  title: Joi.string().min(3).max(150).required(),
  projectCode: Joi.string().optional(),
  kitchenType: Joi.string().valid('L-Shaped', 'U-Shaped', 'Island Kitchen', 'Parallel Kitchen', 'Straight Kitchen').required(),
  budget: Joi.number().positive().required(),
  contractAmount: Joi.number().positive().optional(),
  startDate: Joi.date().iso().optional(),
  expectedCompletion: Joi.date().iso().optional(),
  customerId: Joi.string().uuid().required(),
  assignedManagerId: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
});

const updateProjectSchema = Joi.object({
  title: Joi.string().min(3).max(150).optional(),
  kitchenType: Joi.string().valid('L-Shaped', 'U-Shaped', 'Island Kitchen', 'Parallel Kitchen', 'Straight Kitchen').optional(),
  budget: Joi.number().positive().optional(),
  contractAmount: Joi.number().positive().optional(),
  startDate: Joi.date().iso().allow(null).optional(),
  expectedCompletion: Joi.date().iso().allow(null).optional(),
  actualCompletion: Joi.date().iso().allow(null).optional(),
  status: Joi.string().valid('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED').optional(),
  assignedManagerId: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
});

const updateStageSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'DELAYED').required(),
  remarks: Joi.string().allow('', null).optional(),
  delayReason: Joi.string().allow('', null).optional(),
  assignedEmployeeId: Joi.string().allow('', null).optional(),
  startDate: Joi.date().iso().optional(),
  completionDate: Joi.date().iso().optional(),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  updateStageSchema,
};
