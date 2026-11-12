const prisma = require('../config/db');
const { emitRealTimeUpdate } = require('../sockets');

class AppointmentService {
  async getAppointments({ customerId = '', leadId = '', assignedEmployeeId = '', status = '' }) {
    const where = {};
    if (customerId) where.customerId = customerId;
    if (leadId) where.leadId = leadId;
    if (assignedEmployeeId) where.assignedEmployeeId = assignedEmployeeId;
    if (status) where.status = status;

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: {
        customer: {
          include: {
            user: { select: { fullName: true, phoneNumber: true, email: true } },
          },
        },
        lead: {
          select: { leadCode: true, contactName: true, contactPhone: true, propertyAddress: true },
        },
        assignedEmployee: {
          include: {
            user: { select: { fullName: true, phoneNumber: true } },
          },
        },
      },
    });

    return appointments;
  }

  async createAppointment(data, actorId) {
    const appointment = await prisma.appointment.create({
      data: {
        title: data.title,
        type: data.type || 'SITE_MEASUREMENT',
        status: 'SCHEDULED',
        scheduledDate: new Date(data.scheduledDate),
        location: data.location || null,
        notes: data.notes || null,
        customerId: data.customerId || null,
        leadId: data.leadId || null,
        assignedEmployeeId: data.assignedEmployeeId || null,
      },
      include: {
        customer: {
          include: { user: { select: { fullName: true, phoneNumber: true } } },
        },
        lead: { select: { contactName: true, contactPhone: true } },
        assignedEmployee: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    if (actorId) {
      await prisma.activityLog.create({
        data: {
          actorId,
          action: 'APPOINTMENT_SCHEDULED',
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
          details: `Scheduled ${appointment.type}: "${appointment.title}" on ${appointment.scheduledDate.toISOString()}`,
        },
      });
    }

    emitRealTimeUpdate({
      target: 'role:MANAGER',
      event: 'appointment:created',
      payload: { appointment },
    });

    return appointment;
  }

  async updateAppointmentStatus(appointmentId, status, notes = '', actorId) {
    const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!existing) throw new Error('Appointment not found.');

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        notes: notes ? (existing.notes ? `${existing.notes}\n[Status Update]: ${notes}` : notes) : existing.notes,
      },
      include: {
        customer: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    if (actorId) {
      await prisma.activityLog.create({
        data: {
          actorId,
          action: 'APPOINTMENT_STATUS_UPDATED',
          entityType: 'APPOINTMENT',
          entityId: appointmentId,
          details: `Updated appointment status to ${status}`,
        },
      });
    }

    return updated;
  }
}

module.exports = new AppointmentService();
