const prisma = require('../config/db');
const { emitRealTimeUpdate } = require('../sockets');
const { uploadToCloudinary } = require('../config/cloudinary');
const { sendEmail } = require('../config/mailer');

class DesignService {
  async getProjectDesigns(projectId) {
    const designs = await prisma.design.findMany({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
      include: {
        approvals: {
          orderBy: { decidedAt: 'desc' },
        },
      },
    });

    return designs;
  }

  async getDesignById(designId) {
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        project: {
          include: {
            customer: { include: { user: true } },
            assignedManager: { include: { user: true } },
          },
        },
        approvals: {
          orderBy: { decidedAt: 'desc' },
        },
        fileAttachments: true,
      },
    });

    if (!design) throw new Error('Kitchen design iteration not found.');
    return design;
  }

  /**
   * Upload a new kitchen design version (2D CAD or 3D visual render)
   */
  async uploadDesign(projectId, designData, files = {}, actorId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { customer: { include: { user: true } } },
    });
    if (!project) throw new Error('Project not found.');

    // Determine next version number
    const highestVersion = await prisma.design.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const versionNumber = (highestVersion?.versionNumber || 0) + 1;

    let layout2DUrl = designData.layout2DUrl || null;
    let render3DUrl = designData.render3DUrl || null;
    let cadFileUrl = designData.cadFileUrl || null;

    // Handle uploaded files via Cloudinary
    if (files.layout2D && files.layout2D[0]) {
      const res = await uploadToCloudinary(files.layout2D[0].path, `cktracker/designs/${projectId}`);
      layout2DUrl = res.url;
    }
    if (files.render3D && files.render3D[0]) {
      const res = await uploadToCloudinary(files.render3D[0].path, `cktracker/designs/${projectId}`);
      render3DUrl = res.url;
    }
    if (files.cadFile && files.cadFile[0]) {
      const res = await uploadToCloudinary(files.cadFile[0].path, `cktracker/designs/${projectId}`);
      cadFileUrl = res.url;
    }

    const design = await prisma.design.create({
      data: {
        projectId,
        versionNumber,
        title: designData.title || `3D Render & Modular Layout V${versionNumber}`,
        description: designData.description || null,
        materialsDescription: designData.materialsDescription || null,
        finishes: designData.finishes || null,
        status: 'UNDER_REVIEW',
        layout2DUrl,
        render3DUrl,
        cadFileUrl,
        uploadedByUserId: actorId || 'system',
      },
      include: {
        approvals: true,
      },
    });

    // Advance Stage 3 (Design Prep) to COMPLETED if not already, and Stage 4 to IN_PROGRESS
    const stage3 = await prisma.projectStage.findFirst({
      where: { projectId, stageNumber: 3 },
    });
    if (stage3 && stage3.status !== 'COMPLETED') {
      await prisma.projectStage.update({
        where: { id: stage3.id },
        data: { status: 'COMPLETED', completionDate: new Date() },
      });
      await prisma.projectStage.updateMany({
        where: { projectId, stageNumber: 4 },
        data: { status: 'IN_PROGRESS', startDate: new Date() },
      });
      await prisma.project.update({
        where: { id: projectId },
        data: { currentStageNumber: 4 },
      });
    }

    if (actorId) {
      await prisma.activityLog.create({
        data: {
          actorId,
          action: 'DESIGN_UPLOADED',
          entityType: 'DESIGN',
          entityId: design.id,
          details: `Uploaded design V${versionNumber} for project ${project.projectCode}`,
        },
      });
    }

    // Real-time broadcast
    emitRealTimeUpdate({
      target: `project:${projectId}`,
      event: 'design:uploaded',
      payload: { projectId, design },
    });

    // Notify Customer by Email
    if (project.customer?.user?.email) {
      await sendEmail({
        to: project.customer.user.email,
        subject: `New Kitchen 3D Design Uploaded: ${project.title} (V${versionNumber})`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2>New Kitchen Design Ready For Review!</h2>
            <p>Dear ${project.customer.user.fullName},</p>
            <p>Our architectural design team has uploaded <strong>Version ${versionNumber}</strong> of your kitchen design for <strong>${project.title}</strong>.</p>
            <div style="background: #f8fafc; border-left: 4px solid #c59b27; padding: 12px; margin: 15px 0;">
              <p><strong>Design:</strong> ${design.title}</p>
              <p><strong>Materials:</strong> ${design.materialsDescription || 'Standard Premium'}</p>
              <p><strong>Finishes:</strong> ${design.finishes || 'High-Gloss / Matte'}</p>
            </div>
            <p>Please log in to your portal to inspect the photorealistic renders and submit your approval or revision request.</p>
          </div>
        `,
      });
    }

    return design;
  }

  /**
   * Customer submits approval or requests modifications for a design iteration
   */
  async submitDesignDecision(designId, decisionData, customerUser, ipAddress = null) {
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        project: {
          include: {
            customer: { include: { user: true } },
            assignedManager: { include: { user: true } },
          },
        },
      },
    });

    if (!design) throw new Error('Design not found.');

    const newStatus = decisionData.decision; // 'APPROVED' or 'CHANGES_REQUESTED'

    const result = await prisma.$transaction(async (tx) => {
      // 1. Record approval log
      const approval = await tx.designApproval.create({
        data: {
          designId,
          decision: newStatus,
          customerComments: decisionData.customerComments || null,
          ipAddress,
        },
      });

      // 2. Update design status
      const updatedDesign = await tx.design.update({
        where: { id: designId },
        data: { status: newStatus },
      });

      // 3. If APPROVED, advance Stage 4 (Design Approval) to COMPLETED and activate Stage 5 (Quotation Prep)
      if (newStatus === 'APPROVED') {
        const stage4 = await tx.projectStage.findFirst({
          where: { projectId: design.projectId, stageNumber: 4 },
        });
        if (stage4) {
          await tx.projectStage.update({
            where: { id: stage4.id },
            data: { status: 'COMPLETED', completionDate: new Date() },
          });
        }

        const stage5 = await tx.projectStage.findFirst({
          where: { projectId: design.projectId, stageNumber: 5 },
        });
        if (stage5) {
          await tx.projectStage.update({
            where: { id: stage5.id },
            data: { status: 'IN_PROGRESS', startDate: new Date() },
          });
        }

        await tx.project.update({
          where: { id: design.projectId },
          data: { currentStageNumber: 5 },
        });
      }

      // 4. Audit Log
      await tx.activityLog.create({
        data: {
          actorId: customerUser.id,
          action: newStatus === 'APPROVED' ? 'DESIGN_APPROVED' : 'DESIGN_CHANGES_REQUESTED',
          entityType: 'DESIGN',
          entityId: design.id,
          details: `Customer ${customerUser.fullName} marked Design V${design.versionNumber} as ${newStatus}`,
          ipAddress,
        },
      });

      return { updatedDesign, approval };
    });

    emitRealTimeUpdate({
      target: `project:${design.projectId}`,
      event: 'design:decision',
      payload: { designId, decision: newStatus, customerComments: decisionData.customerComments },
    });

    return result;
  }
}

module.exports = new DesignService();
