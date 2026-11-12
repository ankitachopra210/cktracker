const prisma = require('../config/db');
const { generateCode } = require('../utils/helpers');
const { emitRealTimeUpdate } = require('../sockets');
const { uploadToCloudinary } = require('../config/cloudinary');
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

class ProjectService {
  /**
   * List projects with role-aware scoping, status filters, search, and pagination
   */
  async getProjects({ status = '', managerId = '', customerId = '', search = '', page = 1, limit = 20, user = null }) {
    const where = {};

    // Customer security scoping
    if (user && user.role === 'CUSTOMER') {
      where.customerId = user.customerProfile?.id;
    } else if (customerId) {
      where.customerId = customerId;
    }

    // Manager scoping
    if (user && user.role === 'MANAGER' && !managerId) {
      // If manager view
      where.assignedManagerId = user.employeeProfile?.id;
    } else if (managerId) {
      where.assignedManagerId = managerId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { projectCode: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { customer: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            include: {
              user: { select: { fullName: true, email: true, phoneNumber: true } },
            },
          },
          assignedManager: {
            include: {
              user: { select: { fullName: true, email: true } },
            },
          },
          stages: {
            select: {
              id: true,
              stageNumber: true,
              name: true,
              status: true,
              startDate: true,
              completionDate: true,
            },
            orderBy: { stageNumber: 'asc' },
          },
          _count: {
            select: {
              designs: true,
              quotations: true,
              payments: true,
              fileAttachments: true,
            },
          },
        },
      }),
    ]);

    return { projects, total, page: parseInt(page, 10), limit: take };
  }

  /**
   * Get single project with all 14 stages, stage history, designs, quotations, and payments
   */
  async getProjectById(projectId, user = null) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        customer: {
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
        },
        assignedManager: {
          include: {
            user: { select: { fullName: true, email: true, phoneNumber: true } },
          },
        },
        stages: {
          orderBy: { stageNumber: 'asc' },
          include: {
            assignedEmployee: {
              include: { user: { select: { fullName: true } } },
            },
            history: {
              orderBy: { createdAt: 'desc' },
            },
            fileAttachments: true,
          },
        },
        designs: {
          orderBy: { versionNumber: 'desc' },
          include: { approvals: true },
        },
        quotations: {
          orderBy: { versionNumber: 'desc' },
          include: { items: true, approvals: true },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        invoices: {
          orderBy: { issueDate: 'desc' },
        },
        fileAttachments: true,
      },
    });

    if (!project) throw new Error('Kitchen project not found.');

    // Enforce Customer data isolation
    if (user && user.role === 'CUSTOMER') {
      if (project.customerId !== user.customerProfile?.id) {
        throw new Error('Access denied. You do not own this project.');
      }
    }

    return project;
  }

  /**
   * Create a new Kitchen Project with all 14 lifecycle stages
   */
  async createProject(data, actorId) {
    const projectCount = await prisma.project.count();
    const projectCode = data.projectCode || generateCode('CK', projectCount + 101);

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          projectCode,
          title: data.title,
          kitchenType: data.kitchenType,
          budget: parseFloat(data.budget),
          contractAmount: data.contractAmount ? parseFloat(data.contractAmount) : parseFloat(data.budget),
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          expectedCompletion: data.expectedCompletion ? new Date(data.expectedCompletion) : null,
          currentStageNumber: 1,
          status: 'PLANNING',
          customerId: data.customerId,
          assignedManagerId: data.assignedManagerId || null,
          notes: data.notes || null,
        },
      });

      // Initialize all 14 stages
      for (const s of DEFAULT_STAGES) {
        await tx.projectStage.create({
          data: {
            projectId: created.id,
            stageNumber: s.stageNumber,
            name: s.name,
            description: s.description,
            status: s.stageNumber === 1 ? 'IN_PROGRESS' : 'PENDING',
            expectedDurationDays: s.duration,
            startDate: s.stageNumber === 1 ? new Date() : null,
            assignedEmployeeId: data.assignedManagerId || null,
          },
        });
      }

      if (actorId) {
        await tx.activityLog.create({
          data: {
            actorId,
            action: 'PROJECT_CREATED',
            entityType: 'PROJECT',
            entityId: created.id,
            details: `Created new project ${created.projectCode}: "${created.title}" with 14 stages`,
          },
        });
      }

      return created;
    });

    emitRealTimeUpdate({
      target: 'broadcast',
      event: 'project:created',
      payload: { project },
    });

    return project;
  }

  /**
   * Update project metadata, budget, or dates
   */
  async updateProject(projectId, data, actorId) {
    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) throw new Error('Project not found.');

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        title: data.title !== undefined ? data.title : existing.title,
        kitchenType: data.kitchenType !== undefined ? data.kitchenType : existing.kitchenType,
        budget: data.budget !== undefined ? parseFloat(data.budget) : existing.budget,
        contractAmount: data.contractAmount !== undefined ? parseFloat(data.contractAmount) : existing.contractAmount,
        startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : existing.startDate,
        expectedCompletion: data.expectedCompletion !== undefined ? (data.expectedCompletion ? new Date(data.expectedCompletion) : null) : existing.expectedCompletion,
        actualCompletion: data.actualCompletion !== undefined ? (data.actualCompletion ? new Date(data.actualCompletion) : null) : existing.actualCompletion,
        status: data.status !== undefined ? data.status : existing.status,
        assignedManagerId: data.assignedManagerId !== undefined ? data.assignedManagerId : existing.assignedManagerId,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      },
      include: {
        customer: { include: { user: true } },
      },
    });

    if (actorId) {
      await prisma.activityLog.create({
        data: {
          actorId,
          action: 'PROJECT_UPDATED',
          entityType: 'PROJECT',
          entityId: projectId,
          details: `Updated metadata for project ${existing.projectCode}`,
        },
      });
    }

    emitRealTimeUpdate({
      target: `project:${projectId}`,
      event: 'project:updated',
      payload: { project: updated },
    });

    return updated;
  }

  /**
   * Advance or update a specific Project Stage with sequential lifecycle constraints & audit history
   */
  async updateProjectStage(projectId, stageId, updateData, actorId) {
    const stage = await prisma.projectStage.findFirst({
      where: { id: stageId, projectId },
      include: { project: { include: { customer: { include: { user: true } } } } },
    });

    if (!stage) throw new Error('Stage not found for this project.');

    // Validation: Cannot mark a stage COMPLETED if previous stages are not completed
    if (updateData.status === 'COMPLETED' && stage.stageNumber > 1) {
      const priorIncomplete = await prisma.projectStage.findFirst({
        where: {
          projectId,
          stageNumber: { lt: stage.stageNumber },
          status: { not: 'COMPLETED' },
        },
      });

      if (priorIncomplete) {
        throw new Error(
          `Cannot complete Stage ${stage.stageNumber} ("${stage.name}") because Stage ${priorIncomplete.stageNumber} ("${priorIncomplete.name}") is still ${priorIncomplete.status}.`
        );
      }
    }

    // Require delay reason if status is DELAYED
    if (updateData.status === 'DELAYED' && !updateData.delayReason) {
      throw new Error('A reason is mandatory when marking a project stage as DELAYED.');
    }

    const oldStatus = stage.status;
    const newStatus = updateData.status;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the stage
      const updatedStage = await tx.projectStage.update({
        where: { id: stageId },
        data: {
          status: newStatus,
          remarks: updateData.remarks !== undefined ? updateData.remarks : stage.remarks,
          delayReason: updateData.delayReason !== undefined ? updateData.delayReason : stage.delayReason,
          assignedEmployeeId: updateData.assignedEmployeeId !== undefined ? updateData.assignedEmployeeId : stage.assignedEmployeeId,
          startDate: newStatus === 'IN_PROGRESS' && !stage.startDate ? new Date() : stage.startDate,
          completionDate: newStatus === 'COMPLETED' ? new Date() : (newStatus !== 'COMPLETED' ? null : stage.completionDate),
        },
      });

      // 2. Record stage transition history
      await tx.stageHistory.create({
        data: {
          projectStageId: stageId,
          fromStatus: oldStatus,
          toStatus: newStatus,
          changeReason: updateData.delayReason || updateData.remarks || `Status transitioned from ${oldStatus} to ${newStatus}`,
          changedByUserId: actorId || 'system',
        },
      });

      // 3. If stage is completed, activate next stage and advance currentStageNumber
      let nextStageNumber = stage.stageNumber;
      if (newStatus === 'COMPLETED') {
        if (stage.stageNumber < 14) {
          nextStageNumber = stage.stageNumber + 1;
          await tx.projectStage.update({
            where: {
              projectId_stageNumber: {
                projectId,
                stageNumber: nextStageNumber,
              },
            },
            data: {
              status: 'IN_PROGRESS',
              startDate: new Date(),
            },
          });

          await tx.project.update({
            where: { id: projectId },
            data: {
              currentStageNumber: nextStageNumber,
              status: 'IN_PROGRESS',
            },
          });
        } else if (stage.stageNumber === 14) {
          // Handover and Warranty complete! Mark project completed
          await tx.project.update({
            where: { id: projectId },
            data: {
              currentStageNumber: 14,
              status: 'COMPLETED',
              actualCompletion: new Date(),
            },
          });
        }
      }

      // 4. Activity log
      if (actorId) {
        await tx.activityLog.create({
          data: {
            actorId,
            action: 'STAGE_UPDATED',
            entityType: 'PROJECT_STAGE',
            entityId: stageId,
            details: `Project ${stage.project.projectCode}: Stage ${stage.stageNumber} ("${stage.name}") changed from ${oldStatus} to ${newStatus}`,
          },
        });
      }

      return { updatedStage, nextStageNumber };
    });

    // 5. Real-Time Socket Broadcast to Project room & Customer
    emitRealTimeUpdate({
      target: `project:${projectId}`,
      event: 'stage:updated',
      payload: {
        projectId,
        stageId,
        stageNumber: stage.stageNumber,
        newStatus,
        remarks: updateData.remarks,
      },
    });

    // Notify customer if stage completed or delayed
    if (stage.project.customer?.user) {
      const custUser = stage.project.customer.user;
      await sendEmail({
        to: custUser.email,
        subject: `Project Update: ${stage.project.projectCode} - Stage ${stage.stageNumber} ${newStatus}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2>Modular Kitchen Progress Update</h2>
            <p>Dear ${custUser.fullName},</p>
            <p>Your modular kitchen project <strong>${stage.project.title} (${stage.project.projectCode})</strong> has an update:</p>
            <div style="background: #f8fafc; border-left: 4px solid #c59b27; padding: 12px; margin: 15px 0;">
              <p><strong>Stage ${stage.stageNumber}:</strong> ${stage.name}</p>
              <p><strong>Status:</strong> <span style="font-weight: bold; color: ${newStatus === 'COMPLETED' ? '#16a34a' : '#d97706'};">${newStatus}</span></p>
              ${updateData.remarks ? `<p><strong>Remarks:</strong> ${updateData.remarks}</p>` : ''}
              ${updateData.delayReason ? `<p><strong>Delay Reason:</strong> ${updateData.delayReason}</p>` : ''}
            </div>
            <p>You can view full 3D photos and the 14-stage journey by logging into your client portal.</p>
          </div>
        `,
      });
    }

    return result.updatedStage;
  }

  /**
   * Upload site measurement document or progress photograph to project stage
   */
  async uploadStagePhoto(projectId, stageId, file, category = 'PROGRESS_PHOTO', actorId) {
    const stage = await prisma.projectStage.findFirst({
      where: { id: stageId, projectId },
    });
    if (!stage) throw new Error('Project stage not found.');

    const uploadRes = await uploadToCloudinary(file.path, `cktracker/projects/${projectId}/stages`);

    const attachment = await prisma.fileAttachment.create({
      data: {
        originalName: file.originalname,
        fileUrl: uploadRes.url,
        fileType: file.mimetype,
        fileSize: file.size,
        category,
        projectId,
        projectStageId: stageId,
        uploadedByUserId: actorId || 'system',
      },
    });

    emitRealTimeUpdate({
      target: `project:${projectId}`,
      event: 'stage:photo_uploaded',
      payload: { projectId, stageId, attachment },
    });

    return attachment;
  }
}

module.exports = new ProjectService();
