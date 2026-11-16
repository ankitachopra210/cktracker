const prisma = require('../config/db');
const { generateCode } = require('../utils/helpers');
const { emitRealTimeUpdate } = require('../sockets');

class SupportService {
  async getTickets({ customerId = '', status = '', priority = '' } = {}) {
    const where = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          include: {
            user: { select: { fullName: true, phoneNumber: true, email: true } },
          },
        },
        project: { select: { projectCode: true, title: true } },
        assignedTechnician: {
          include: { user: { select: { fullName: true, phoneNumber: true } } },
        },
      },
    });

    return tickets;
  }

  async getTicketById(ticketId) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        customer: {
          include: { user: { select: { fullName: true, phoneNumber: true, email: true } } },
        },
        project: true,
        assignedTechnician: {
          include: { user: { select: { fullName: true, phoneNumber: true } } },
        },
        fileAttachments: true,
      },
    });

    if (!ticket) throw new Error('Support ticket not found.');
    return ticket;
  }

  async createTicket(data, customerProfileId, actorId) {
    const count = await prisma.supportTicket.count();
    const ticketNumber = generateCode('TKT', count + 1);

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerId: customerProfileId,
        projectId: data.projectId || null,
        category: data.category,
        priority: data.priority || 'MEDIUM',
        status: 'OPEN',
        subject: data.subject,
        description: data.description,
      },
      include: {
        customer: { include: { user: true } },
      },
    });

    if (actorId) {
      await prisma.activityLog.create({
        data: {
          actorId,
          action: 'SUPPORT_TICKET_RAISED',
          entityType: 'SUPPORT_TICKET',
          entityId: ticket.id,
          details: `Client raised complaint ${ticket.ticketNumber}: "${ticket.subject}"`,
        },
      });
    }

    emitRealTimeUpdate({
      target: 'role:MANAGER',
      event: 'support:ticket_created',
      payload: { ticket },
    });

    return ticket;
  }

  async updateTicket(ticketId, data, actorId) {
    const existing = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!existing) throw new Error('Support ticket not found.');

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: data.status !== undefined ? data.status : existing.status,
        assignedTechnicianId: data.assignedTechnicianId !== undefined ? data.assignedTechnicianId : existing.assignedTechnicianId,
        scheduledVisitDate: data.scheduledVisitDate !== undefined ? (data.scheduledVisitDate ? new Date(data.scheduledVisitDate) : null) : existing.scheduledVisitDate,
        resolutionNotes: data.resolutionNotes !== undefined ? data.resolutionNotes : existing.resolutionNotes,
        resolvedAt: data.status === 'RESOLVED' || data.status === 'CLOSED' ? new Date() : existing.resolvedAt,
      },
      include: {
        customer: { include: { user: true } },
      },
    });

    return updated;
  }

  async getWarranties(customerId) {
    const where = {};
    if (customerId) where.customerId = customerId;

    return await prisma.warranty.findMany({
      where,
      include: {
        project: { select: { projectCode: true, title: true } },
      },
    });
  }
}

module.exports = new SupportService();
