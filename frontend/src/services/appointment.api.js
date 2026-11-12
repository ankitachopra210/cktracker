import api from './api';

export const getAppointments = async (params = {}) => {
  return await api.get('/appointments', { params });
};

export const createAppointment = async (data) => {
  return await api.post('/appointments', data);
};

export const updateAppointmentStatus = async (id, status, notes = '') => {
  return await api.put(`/appointments/${id}/status`, { status, notes });
};
