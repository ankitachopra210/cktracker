const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().min(10).max(15).required(),
  password: Joi.string().min(6).optional(),
  employeeCode: Joi.string().min(2).max(20).required(),
  department: Joi.string()
    .valid(
      'MANAGEMENT',
      'SALES',
      'DESIGN',
      'MEASUREMENT',
      'PROCUREMENT',
      'MANUFACTURING',
      'QUALITY_CONTROL',
      'INSTALLATION',
      'CUSTOMER_SUPPORT'
    )
    .required(),
  designation: Joi.string().min(2).max(100).required(),
  joiningDate: Joi.date().iso().optional(),
  emergencyContact: Joi.string().allow('', null).optional(),
});

const createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(150).required(),
  description: Joi.string().allow('', null).optional(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').default('MEDIUM'),
  dueDate: Joi.date().iso().optional(),
  projectId: Joi.string().uuid().required(),
  projectStageId: Joi.string().uuid().allow('', null).optional(),
  assignedToId: Joi.string().uuid().allow('', null).optional(),
});

const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED').required(),
});

const createSupportTicketSchema = Joi.object({
  projectId: Joi.string().uuid().allow('', null).optional(),
  category: Joi.string()
    .valid('Hardware & Hinges', 'Drawer Channel Alignment', 'Laminate / Acrylic Peel', 'Water Seepage & Plumbing', 'Countertop Finish', 'General Maintenance')
    .required(),
  priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').default('MEDIUM'),
  subject: Joi.string().min(5).max(150).required(),
  description: Joi.string().min(10).required(),
});

const updateTicketSchema = Joi.object({
  status: Joi.string().valid('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').required(),
  assignedTechnicianId: Joi.string().uuid().allow('', null).optional(),
  scheduledVisitDate: Joi.date().iso().allow(null).optional(),
  resolutionNotes: Joi.string().allow('', null).optional(),
});

module.exports = {
  createEmployeeSchema,
  createTaskSchema,
  updateTaskStatusSchema,
  createSupportTicketSchema,
  updateTicketSchema,
};
