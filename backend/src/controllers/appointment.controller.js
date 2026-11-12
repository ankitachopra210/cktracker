const appointmentService = require('../services/appointment.service');
const { sendSuccess } = require('../utils/helpers');

class AppointmentController {
  async getAppointments(req, res, next) {
    try {
      const { customerId = '', leadId = '', assignedEmployeeId = '', status = '' } = req.query;
      const appointments = await appointmentService.getAppointments({
        customerId,
        leadId,
        assignedEmployeeId,
        status,
      });
      return sendSuccess(res, appointments, 'Appointments retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async createAppointment(req, res, next) {
    try {
      const appointment = await appointmentService.createAppointment(req.body, req.user?.id);
      return sendSuccess(res, appointment, 'Appointment scheduled successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAppointmentStatus(req, res, next) {
    try {
      const { status, notes } = req.body;
      const updated = await appointmentService.updateAppointmentStatus(req.params.id, status, notes, req.user?.id);
      return sendSuccess(res, updated, 'Appointment status updated.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppointmentController();
