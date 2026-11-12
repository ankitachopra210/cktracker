import api from './api';

export const getLeads = async (params = {}) => {
  return await api.get('/leads', { params });
};

export const getLeadById = async (id) => {
  return await api.get(`/leads/${id}`);
};

export const createLead = async (data) => {
  return await api.post('/leads', data);
};

export const updateLeadStage = async (id, status, notes = '') => {
  return await api.put(`/leads/${id}/stage`, { status, notes });
};

export const convertLeadToProject = async (id, data) => {
  return await api.post(`/leads/${id}/convert`, data);
};
