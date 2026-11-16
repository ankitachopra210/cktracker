const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

class EmployeeService {
  async getEmployees({ department = '' } = {}) {
    const where = {};
    if (department) where.department = department;

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { employeeCode: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            status: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            managedProjects: true,
            assignedTasks: true,
            managedLeads: true,
          },
        },
      },
    });

    return employees;
  }

  async createEmployee(data, actorId) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existingEmail) {
      throw new Error(`A user with email "${data.email}" already exists.`);
    }

    const existingCode = await prisma.employee.findUnique({
      where: { employeeCode: data.employeeCode.trim().toUpperCase() },
    });
    if (existingCode) {
      throw new Error(`An employee with code "${data.employeeCode}" already exists.`);
    }

    const defaultPassword = data.password || 'Staff@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const employee = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          passwordHash,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          role: 'MANAGER', // Employees default to manager role with granular department permissions
          status: 'ACTIVE',
        },
      });

      const profile = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode: data.employeeCode.trim().toUpperCase(),
          department: data.department,
          designation: data.designation,
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
          emergencyContact: data.emergencyContact || null,
        },
        include: { user: true },
      });

      if (actorId) {
        await tx.activityLog.create({
          data: {
            actorId,
            action: 'EMPLOYEE_CREATED',
            entityType: 'EMPLOYEE',
            entityId: profile.id,
            details: `Created staff member ${user.fullName} (${profile.employeeCode}) in ${profile.department}`,
          },
        });
      }

      return profile;
    });

    return employee;
  }

  /**
   * Task management
   */
  async getTasks({ projectId = '', assignedToId = '', status = '' } = {}) {
    const where = {};
    if (projectId) where.projectId = projectId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        project: { select: { projectCode: true, title: true } },
        assignedTo: { include: { user: { select: { fullName: true } } } },
      },
    });

    return tasks;
  }

  async createTask(data, actorId) {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
        projectStageId: data.projectStageId || null,
        assignedToId: data.assignedToId || null,
        createdById: actorId || null,
      },
      include: {
        project: { select: { projectCode: true, title: true } },
        assignedTo: { include: { user: { select: { fullName: true } } } },
      },
    });

    return task;
  }

  async updateTaskStatus(taskId, status, actorId) {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    return task;
  }
}

module.exports = new EmployeeService();
