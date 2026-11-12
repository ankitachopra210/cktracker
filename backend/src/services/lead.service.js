const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateCode } = require('../utils/helpers');
const { emitRealTimeUpdate } = require('../sockets');
const { sendEmail } = require('../config/mailer');

const DEFAULT_STAGES = [
  { stageNumber: 1, name: 'Customer Registration & Requirement Gathering', description: 'Initial showroom inquiry, style preferences and budget finalization.', duration: 3 },
  { stageNumber: 2, name: 'Site Measurement & Technical Survey', description: 'Laser measurement of site walls, plumbing outlets, gas pipeline, and electrical points.', duration: 2 },
  { stageNumber: 3, name: '2D / 3D Kitchen Design Preparation', description: 'Preparation of modular layout, ergonomics, 3D photorealistic visualization and finish samples.', duration: 5 },
  { stageNumber: 4, name: 'Customer Design Presentation & Approval', description: 'Reviewing 3D renders with customer and receiving sign-off on layouts and finishes.', duration: 4 },
  { stageNumber: 5, name: 'Quotation Preparation & Cost Estimation', description: 'Itemized estimation of carcasses, shutters, hardware, countertop and GST calculations.', duration: 2 },
  { stageNumber: 6, name: 'Quotation Approval & Advance Payment', description: 'Quotation acceptance by customer and receipt of 50% production advance payment.', duration: 3 },
  { stageNumber: 7, name: 'Raw Material Procurement & Stock Allocation', description: 'Allocating plywood, laminates/acrylic, Blum/Hettich hinges, and tandem boxes from inventory.', duration: 4 },
  { stageNumber: 8, name: 'Factory Manufacturing & CNC Edge Banding', description: 'Precision panel cutting, CNC drilling, PUR edge-banding and carcass pre-assembly at factory.', duration: 10 },
  { stageNumber: 9, name: 'Factory Quality Inspection (QC Audit)', description: 'Multi-point checklist verification of shutter alignment, finish flaws and dimensional accuracy.', duration: 2 },
  { stageNumber: 10, name: 'Protective Packaging & Site Dispatch', description: 'Bubble wrapping, corner protectors and dispatch via freight vehicle to client site.', duration: 2 },
  { stageNumber: 11, name: 'On-Site Modular Installation', description: 'Carcass leveling, wall hanging, countertop cutout, drawer alignment and sink fitting.', duration: 5 },
  { stageNumber: 12, name: 'Final Inspection & Snag List Rectification', description: 'Soft-close tension adjustment, silicone sealing, handle fitting and cleaning.', duration: 2 },
  { stageNumber: 13, name: 'Customer Handover & Sign-Off', description: 'Joint walkthrough with client, care instructions guide handover and final payment settlement.', duration: 1 },
  { stageNumber: 14, name: 'Project Completed & Warranty Activation', description: 'Official completion certificate issue and 10-year warranty registration.', duration: 1 },
];

class LeadService {
  /**
   * List all leads with filtering by stage, manager, and search query
   */
  async getLeads({ status = '', assignedManagerId = '', search = '' }) {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (assignedManagerId) {
      where.assignedManagerId = assignedManagerId;
    }

    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { leadCode: { contains: search, mode: 'insensitive' } },
        { propertyAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedManager: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        customer: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        _count: {
          select: {
            interactions: true,
            appointments: true,
          },
        },
      },
    });

    return leads;
  }

  /**
   * Get single lead details with timeline and appointments
   */
  async getLeadById(leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignedManager: {
          include: {
            user: { select: { fullName: true, email: true, phoneNumber: true } },
          },
        },
        customer: {
          include: {
            user: { select: { fullName: true, email: true, phoneNumber: true } },
          },
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
        },
        appointments: {
          orderBy: { scheduledDate: 'desc' },
        },
      },
    });

    if (!lead) throw new Error('Lead not found.');
    return lead;
  }

  /**
   * Create a new lead inquiry
   */
  async createLead(data, actorId) {
    const count = await prisma.lead.count();
    const leadCode = generateCode('LD', count + 1);

    const lead = await prisma.lead.create({
      data: {
        leadCode,
        contactName: data.contactName,
        contactEmail: data.contactEmail ? data.contactEmail.toLowerCase().trim() : null,
        contactPhone: data.contactPhone,
        propertyAddress: data.propertyAddress || null,
        status: data.status || 'NEW',
        estimatedBudget: data.estimatedBudget ? parseFloat(data.estimatedBudget) : null,
        preferredStyle: data.preferredStyle || null,
        notes: data.notes || null,
        assignedManagerId: data.assignedManagerId || null,
      },
      include: {
        assignedManager: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    if (actorId) {
      await prisma.activityLog.create({
        data: {
          actorId,
          action: 'LEAD_CREATED',
          entityType: 'LEAD',
          entityId: lead.id,
          details: `Inquiry recorded for ${lead.contactName} (${lead.leadCode})`,
        },
      });
    }

    emitRealTimeUpdate({
      target: 'role:MANAGER',
      event: 'lead:created',
      payload: { lead },
    });

    return lead;
  }

  /**
   * Update lead pipeline stage
   */
  async updateLeadStage(leadId, status, notes = '', actorId) {
    const existing = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!existing) throw new Error('Lead not found.');

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        notes: notes ? (existing.notes ? `${existing.notes}\n[Stage Update]: ${notes}` : notes) : existing.notes,
      },
    });

    if (actorId) {
      await prisma.activityLog.create({
        data: {
          actorId,
          action: 'LEAD_STAGE_UPDATED',
          entityType: 'LEAD',
          entityId: leadId,
          details: `Moved lead ${existing.leadCode} from ${existing.status} to ${status}`,
        },
      });
    }

    emitRealTimeUpdate({
      target: 'role:MANAGER',
      event: 'lead:updated',
      payload: { lead: updated },
    });

    return updated;
  }

  /**
   * Convert lead into an active Customer Project (with complete 14-stage lifecycle initialization)
   */
  async convertLeadToProject(leadId, conversionData, actorId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { customer: true },
    });

    if (!lead) throw new Error('Lead not found.');
    if (lead.status === 'CONVERTED') {
      throw new Error('This lead has already been converted into an active project.');
    }

    const projectCount = await prisma.project.count();
    const projectCode = generateCode('CK', projectCount + 101);

    const result = await prisma.$transaction(async (tx) => {
      let customerId = lead.customerId;

      // 1. If Lead is not yet linked to a Customer entity, register user + customer
      if (!customerId) {
        let userEmail = lead.contactEmail;
        if (!userEmail) {
          userEmail = `client_${lead.contactPhone.replace(/\D/g, '')}@cktracker.com`;
        }

        // Check if user already exists with this email
        let user = await tx.user.findUnique({ where: { email: userEmail } });
        if (!user) {
          const defaultPassword = conversionData.password || 'Welcome@123';
          const passwordHash = await bcrypt.hash(defaultPassword, 10);
          user = await tx.user.create({
            data: {
              email: userEmail,
              passwordHash,
              fullName: lead.contactName,
              phoneNumber: lead.contactPhone,
              role: 'CUSTOMER',
              status: 'ACTIVE',
            },
          });
        }

        let customer = await tx.customer.findUnique({ where: { userId: user.id } });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              userId: user.id,
              address: lead.propertyAddress,
              estimatedBudget: lead.estimatedBudget || parseFloat(conversionData.budget),
              preferredStyle: lead.preferredStyle,
              leadSource: 'Lead Conversion',
            },
          });
        }

        customerId = customer.id;
      }

      // 2. Mark lead as CONVERTED
      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: 'CONVERTED',
          customerId,
        },
      });

      // 3. Create Project
      const project = await tx.project.create({
        data: {
          projectCode,
          title: conversionData.projectTitle,
          kitchenType: conversionData.kitchenType,
          budget: parseFloat(conversionData.budget),
          startDate: new Date(),
          expectedCompletion: conversionData.expectedCompletion ? new Date(conversionData.expectedCompletion) : null,
          currentStageNumber: 1,
          status: 'PLANNING',
          customerId,
          assignedManagerId: lead.assignedManagerId || null,
          notes: `Converted from lead ${lead.leadCode}. Initial inquiry notes: ${lead.notes || 'None'}`,
        },
      });

      // 4. Create all 14 project stages
      for (const s of DEFAULT_STAGES) {
        await tx.projectStage.create({
          data: {
            projectId: project.id,
            stageNumber: s.stageNumber,
            name: s.name,
            description: s.description,
            status: s.stageNumber === 1 ? 'IN_PROGRESS' : 'PENDING',
            expectedDurationDays: s.duration,
            startDate: s.stageNumber === 1 ? new Date() : null,
            assignedEmployeeId: lead.assignedManagerId || null,
          },
        });
      }

      // 5. Activity log
      if (actorId) {
        await tx.activityLog.create({
          data: {
            actorId,
            action: 'LEAD_CONVERTED_TO_PROJECT',
            entityType: 'PROJECT',
            entityId: project.id,
            details: `Converted lead ${lead.leadCode} into project ${project.projectCode} (${project.title})`,
          },
        });
      }

      return { project, customerId };
    });

    emitRealTimeUpdate({
      target: 'broadcast',
      event: 'project:created',
      payload: { project: result.project },
    });

    return result.project;
  }
}

module.exports = new LeadService();
