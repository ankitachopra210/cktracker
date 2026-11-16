const employeeService = require('../services/employee.service');
const { sendSuccess } = require('../utils/helpers');

class EmployeeController {
  async getEmployees(req, res, next) {
    try {
      const { department } = req.query;
      const employees = await employeeService.getEmployees({ department });
      return sendSuccess(res, employees, 'Employees retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createEmployee(req, res, next) {
    try {
      const employee = await employeeService.createEmployee(req.body, req.user?.id);
      return sendSuccess(res, employee, 'Employee created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req, res, next) {
    try {
      const { projectId, assignedToId, status } = req.query;
      const tasks = await employeeService.getTasks({ projectId, assignedToId, status });
      return sendSuccess(res, tasks, 'Tasks retrieved.');
    } catch (error) {
      next(error);
    }
  }

  async createTask(req, res, next) {
    try {
      const task = await employeeService.createTask(req.body, req.user?.id);
      return sendSuccess(res, task, 'Task created successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTaskStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const task = await employeeService.updateTaskStatus(id, status, req.user?.id);
      return sendSuccess(res, task, 'Task status updated.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmployeeController();
