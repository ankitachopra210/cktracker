const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { emitRealTimeUpdate } = require('../sockets');
const { sendEmail } = require('../config/mailer');

class CustomerService {
  /**
   * List customers with search, filtering, pagination, and sorting
   */
  async getCustomers({ page = 1, limit = 10, search = '', propertyType = '', preferredStyle = '', sortBy = 'createdAt', order = 'desc' }) {
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {};

    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { phoneNumber: { contains: search, mode: 'insensitive' } } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (propertyType) {
      where.propertyType = propertyType;
    }

    if (preferredStyle) {
      where.preferredStyle = preferredStyle;
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: sortBy === 'fullName' 
          ? { user: { fullName: order } } 
          : { [sortBy]: order },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phoneNumber: true,
              status: true,
              createdAt: true,
              lastLoginAt: true,
            },
          },
          projects: {
            select: {
              id: true,
              projectCode: true,
              title: true,
              status: true,
              currentStageNumber: true,
              budget: true,
            },
          },
          _count: {
            select: {
              projects: true,
              appointments: true,
              interactions: true,
            },
          },
        },
      }),
    ]);

    return {
      customers,
      total,
      page: parseInt(page, 10),
      limit: take,
    };
  }

  /**
   * Get single customer with complete profile, projects, appointments, and interaction history
   */
  async getCustomerById(customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        projects: {
          include: {
            stages: {
              select: {
                stageNumber: true,
                name: true,
                status: true,
                startDate: true,
                completionDate: true,
              },
              orderBy: { stageNumber: 'asc' },
            },
            assignedManager: {
              include: { user: { select: { fullName: true, email: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        appointments: {
          include: {
            assignedEmployee: {
              include: { user: { select: { fullName: true } } },
            },
          },
          orderBy: { scheduledDate: 'desc' },
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
        },
        warranties: true,
      },
    });

    if (!customer) {
      throw new Error('Customer profile not found.');
    }

    return customer;
  }

  /**
   * Create a new Customer with User identity and welcome email
   */
  async createCustomer(data, actorId) {
    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new Error(`A user account with email "${data.email}" already exists.`);
    }

    const defaultPassword = data.password || 'Welcome@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          passwordHash,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          address: data.address || null,
          city: data.city || null,
          pincode: data.pincode || null,
          propertyType: data.propertyType || null,
          kitchenDimensions: data.kitchenDimensions || null,
          estimatedBudget: data.estimatedBudget ? parseFloat(data.estimatedBudget) : null,
          preferredStyle: data.preferredStyle || null,
          preferredMaterials: data.preferredMaterials || null,
          leadSource: data.leadSource || 'Showroom Walk-in',
          requirementsNotes: data.requirementsNotes || null,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      // Audit log
      if (actorId) {
        await tx.activityLog.create({
          data: {
            actorId,
            action: 'CUSTOMER_CREATED',
            entityType: 'CUSTOMER',
            entityId: customer.id,
            details: `Registered customer ${user.fullName} (${user.email})`,
          },
        });
      }

      return customer;
    });

    // Notify via real-time socket
    emitRealTimeUpdate({
      target: 'role:ADMIN',
      event: 'customer:created',
      payload: { customer: result },
    });

    emitRealTimeUpdate({
      target: 'role:MANAGER',
      event: 'customer:created',
      payload: { customer: result },
    });

    // Dispatch welcome email
    await sendEmail({
      to: result.user.email,
      subject: 'Welcome to CKTracker Modular Kitchens Portal',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2>Welcome, ${result.user.fullName}!</h2>
          <p>Your CKTracker modular kitchen customer portal has been created.</p>
          <p>You can track all stages of your modular kitchen project, view 3D designs, approve quotations, and download payment receipts.</p>
          <div style="background: #f1f5f9; padding: 12px; border-left: 4px solid #c59b27; margin: 15px 0;">
            <p><strong>Login Email:</strong> ${result.user.email}</p>
            <p><strong>Temporary Password:</strong> ${defaultPassword}</p>
          </div>
          <p>Please log in and update your password.</p>
        </div>
      `,
    });

    return result;
  }

  /**
   * Update customer profile details
   */
  async updateCustomer(customerId, data, actorId) {
    const existing = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });
    if (!existing) throw new Error('Customer profile not found.');

    const result = await prisma.$transaction(async (tx) => {
      if (data.fullName || data.phoneNumber) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            fullName: data.fullName || existing.user.fullName,
            phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : existing.user.phoneNumber,
          },
        });
      }

      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          address: data.address !== undefined ? data.address : existing.address,
          city: data.city !== undefined ? data.city : existing.city,
          pincode: data.pincode !== undefined ? data.pincode : existing.pincode,
          propertyType: data.propertyType !== undefined ? data.propertyType : existing.propertyType,
          kitchenDimensions: data.kitchenDimensions !== undefined ? data.kitchenDimensions : existing.kitchenDimensions,
          estimatedBudget: data.estimatedBudget !== undefined ? (data.estimatedBudget ? parseFloat(data.estimatedBudget) : null) : existing.estimatedBudget,
          preferredStyle: data.preferredStyle !== undefined ? data.preferredStyle : existing.preferredStyle,
          preferredMaterials: data.preferredMaterials !== undefined ? data.preferredMaterials : existing.preferredMaterials,
          leadSource: data.leadSource !== undefined ? data.leadSource : existing.leadSource,
          requirementsNotes: data.requirementsNotes !== undefined ? data.requirementsNotes : existing.requirementsNotes,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (actorId) {
        await tx.activityLog.create({
          data: {
            actorId,
            action: 'CUSTOMER_UPDATED',
            entityType: 'CUSTOMER',
            entityId: customerId,
            details: `Updated profile details for customer ${existing.user.fullName}`,
          },
        });
      }

      return updatedCustomer;
    });

    return result;
  }

  /**
   * Log interaction with customer (call, visit, follow-up)
   */
  async logInteraction(customerId, data, actorId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new Error('Customer not found.');

    const interaction = await prisma.customerInteraction.create({
      data: {
        customerId,
        interactionType: data.interactionType,
        summary: data.summary,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
        recordedByUserId: actorId,
      },
    });

    return interaction;
  }
}

module.exports = new CustomerService();
